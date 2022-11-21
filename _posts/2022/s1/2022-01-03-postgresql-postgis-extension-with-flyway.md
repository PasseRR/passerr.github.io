---
layout: post
title:  Postgres中使用postgis集成flyway
categories: [database, java]
last_modified_at: 2022-01-06
toc: true
---

## 问题描述
在系统[flyway](https://flywaydb.org/){:target="_blank"}初始化脚本中，使用了[postgis](http://postgis.net/){:target="_blank"}
扩展中的`GEOMETRY`类型，当脚本在非`public`模式下运行时报错如下：

```text
Caused by: org.postgresql.util.PSQLException: 错误: 类型 "geometry" 不存在
  位置：215
	at org.postgresql.core.v3.QueryExecutorImpl.receiveErrorResponse(QueryExecutorImpl.java:2552)
	at org.postgresql.core.v3.QueryExecutorImpl.processResults(QueryExecutorImpl.java:2284)
	at org.postgresql.core.v3.QueryExecutorImpl.execute(QueryExecutorImpl.java:322)
	at org.postgresql.jdbc.PgStatement.executeInternal(PgStatement.java:481)
	at org.postgresql.jdbc.PgStatement.execute(PgStatement.java:401)
	at org.postgresql.jdbc.PgStatement.executeWithFlags(PgStatement.java:322)
	at org.postgresql.jdbc.PgStatement.executeCachedSql(PgStatement.java:308)
	at org.postgresql.jdbc.PgStatement.executeWithFlags(PgStatement.java:284)
	at org.postgresql.jdbc.PgStatement.execute(PgStatement.java:279)
	at com.zaxxer.hikari.pool.ProxyStatement.execute(ProxyStatement.java:94)
	at com.zaxxer.hikari.pool.HikariProxyStatement.execute(HikariProxyStatement.java)
	at org.flywaydb.core.internal.jdbc.JdbcTemplate.executeStatement(JdbcTemplate.java:241)
	at org.flywaydb.core.internal.sqlscript.ParsedSqlStatement.execute(ParsedSqlStatement.java:111)
	at org.flywaydb.core.internal.sqlscript.DefaultSqlScriptExecutor.executeStatement(DefaultSqlScriptExecutor.java:206)
	... 49 common frames omitted
```

数据库初始化脚本如下:

```sql
-- 项目表
DROP TABLE IF EXISTS "project";
CREATE TABLE "project"
(
    "id"                VARCHAR(32)       NOT NULL PRIMARY KEY,
    "name"              VARCHAR(128)      NULL,
    "address"           VARCHAR(512)      NULL,
    "location"          GEOMETRY NULL,
    "initial_view"      VARCHAR(256)      NULL,
    "description"       VARCHAR(256)      NULL,
    "creator"           VARCHAR(32)       NULL,
    "created_datetime"  TIMESTAMP         NULL,
    "modifier"          VARCHAR(32)       NULL,
    "modified_datetime" TIMESTAMP         NULL
);
COMMENT ON TABLE "project" IS '项目';
COMMENT ON COLUMN "project"."id" IS 'id';
COMMENT ON COLUMN "project"."name" IS '名称';
COMMENT ON COLUMN "project"."address" IS '地址';
COMMENT ON COLUMN "project"."location" IS '位置点';
COMMENT ON COLUMN "project"."initial_view" IS '初始视角';
COMMENT ON COLUMN "project"."description" IS '描述';
COMMENT ON COLUMN "project"."creator" IS '创建人';
COMMENT ON COLUMN "project"."created_datetime" IS '创建时间';
COMMENT ON COLUMN "project"."modifier" IS '修改人';
COMMENT ON COLUMN "project"."modified_datetime" IS '修改时间';
```

## 问题原因
`postgis`扩展安装于`public`模式下，在非`public`模式找不到`GEOMETRY`类型，
尝试修改~~`GEOMETRY`~~为`"public".GEOMETRY`，问题暂时解决。

**扩展问题**：若当`postgis`未安装于`public`模式，上述sql脚本同样会执行不通过，会出现相同问题。

## 初步解决方案
1.安装`postgis`于`public`模式，若已安装于其他模式，移动扩展至`public`模式

```sql
-- 安装插件
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "public";

-- 设置插件位置可以修改
UPDATE "pg_extension"
SET "extrelocatable" = TRUE
WHERE "extname" = 'postgis';

-- 修改插件到public模式
ALTER EXTENSION "postgis" SET SCHEMA "public";
```

2.指定`GEOMETRY`类型的模式为`public`

```sql
DROP TABLE IF EXISTS "project";
CREATE TABLE "project"
(
    "id"                VARCHAR(32)       NOT NULL PRIMARY KEY,
    "name"              VARCHAR(128)      NULL,
    "address"           VARCHAR(512)      NULL,
    "location"          "public".GEOMETRY NULL,
    "initial_view"      VARCHAR(256)      NULL,
    "description"       VARCHAR(256)      NULL,
    "creator"           VARCHAR(32)       NULL,
    "created_datetime"  TIMESTAMP         NULL,
    "modifier"          VARCHAR(32)       NULL,
    "modified_datetime" TIMESTAMP         NULL
);
```

3.存在问题

会导致在非`public`模式下访问postgis的函数时都必须加上`public`模式。

## 最终解决方案
1.添加创建`postgis脚本`

```sql
BEGIN;
DO
$$
    DECLARE
        -- 插件是否可以修改
        "v_locatable" BOOLEAN;
        -- 插件安装schema
        "v_schema"    VARCHAR;
    BEGIN
        -- 安装插件
        CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "public";

        -- 查询插件安装的schema
        SELECT "pn"."nspname"
        INTO "v_schema"
        FROM "pg_extension" "pe"
                 LEFT JOIN "pg_namespace" "pn" ON "pe"."extnamespace" = "pn"."oid"
        WHERE "pe"."extname" = 'postgis';

        -- 安装schema非public
        IF "v_schema" != 'public' THEN
            -- 查询插件是否可以修改
            SELECT "extrelocatable" INTO "v_locatable" FROM "pg_extension" WHERE "extname" = 'postgis';

            -- 设置插件可以修改
            IF NOT "v_locatable" THEN
                UPDATE "pg_extension"
                SET "extrelocatable" = TRUE
                WHERE "extname" = 'postgis';
            END IF;

            -- 修改插件schema为public
            ALTER EXTENSION "postgis" SET SCHEMA "public";

            -- 还原修改
            IF NOT "v_locatable" THEN
                UPDATE "pg_extension"
                SET "extrelocatable" = FALSE
                WHERE "extname" = 'postgis';
            END IF;
        END IF;
    END
$$ LANGUAGE "plpgsql";
-- 事务提交
COMMIT;
```

2.修改连接配置参数`currentSchema`

> [官网说明](https://jdbc.postgresql.org/documentation/head/connect.html)  
> Specify the schema (or several schema separated by commas) to be set in the search-path. 
> This schema will be used to resolve unqualified object names used in statements over this connection.  

根据官方参数定义，可以设置`currentSchema`参数为多个schema，将`public`添加到currentSchema中。
在代码中访问`public`模式下的函数或者扩展的数据类型就不需要要public模式了。

```yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:6543/database?currentSchema=yourSchema,public
```

最后移除所有`GEOMETRY`的~~`public`~~模式，问题解决。
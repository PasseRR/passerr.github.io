---
layout: post
title:  "Flyway在SpringBoot中的使用"
categories: [java]
last_modified_at: 2019-07-09
---

## 什么是[Flyway](https://flywaydb.org/){:target="_blank"}

> Flyway is an open-source database migration tool.
> It strongly favors simplicity and convention over configuration.

根据官网描述，Flyway是一个开源的数据库迁移工具，它强烈支持简单、约定大于配置。

## 为什么需要Flyway?

数据库脚本通常由开发人员生产，当在针对不同环境升级时，需要在对应的环境执行升级脚本，
但在实际的实施过程中，通常会因为疏忽、遗漏、脚本管理不规范导致数据库升级错误，
从而导致耗费更多的人力去维护数据库脚本、保证数据库的顺利升级。

![migrate](https://cdn.jsdelivr.net/gh/PasseRR/passerr.github.io/assets/2019/07-09/migrate.png)

## Flyway如何保证数据迁移过程?
每个迁移版本使用sql定义，版本前缀`V`，版本号以小数点`.`或单个下划线`_`分隔，版本描述间隔两个下划线`__`。
如下图：

![sqls](https://cdn.jsdelivr.net/gh/PasseRR/passerr.github.io/assets/2019/07-09/sqls.jpg)

脚本在数据库执行时，默认会将版本执行记录存放在表`flyway_schema_history`中，如下：

![schema](https://cdn.jsdelivr.net/gh/PasseRR/passerr.github.io/assets/2019/07-09/schema.png)

|列名|描述|
|:---|:---|
|installed_rank|执行顺序|
|version|脚本版本号|
|description|脚本描述|
|type|迁移类型，这里是SQL|
|script|脚本文件名|
|checksum|脚本[CRC-32](https://en.wikipedia.org/wiki/Cyclic_redundancy_check){:target="_blank"}值|
|installed_by|执行数据库脚本用户|
|installed_on|执行脚本时间|
|execution_time|脚本执行耗时|
|success|是否执行成功|

脚本执行顺序按照版本号递增，版本号建议使用`major.minor.revision`或`年.月.日.时.分.秒`或其他可读性较高的版本号。

每次执行成功的脚本会生成对应的checksum，若脚本再次修改，脚本校验失败会导致服务启动失败。

## 在SpringBoot中快速集成
`spring-boot-autoconfigure`中已经集成Flyway的自动配置，只需引入flyway-core就可以使用。

![flyway](https://cdn.jsdelivr.net/gh/PasseRR/passerr.github.io/assets/2019/07-09/flyway.png)

maven引用
```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
```

若需要扩展使用`org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer`，然后在`resources/db/migration`目录下编写的sql脚本开始体验吧！


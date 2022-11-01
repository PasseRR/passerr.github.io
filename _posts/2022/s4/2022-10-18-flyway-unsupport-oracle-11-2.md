---
layout: post
title:  Flyway不支持低版本Oracle数据库适配(非重新编译flyway)
mermaid: true
categories: [java]
last_modified_at: 2022-10-18
---

## 前言

在基于现有flyway版本`7.7.3`中，发现社区版对低于`12.2`的Oracle数据库不支持，需要使用`Flyway Teams`或者升级Oracle数据库版本，
由于数据库是客户提供不能轻易升级版本，只能自己想办法兼容低版本。

在网上搜了下，都是修改flyway源代码重新打包，强迫症受不了，在看了当前版本的flyway后，发现可以通过反射的方式自行增加数据库适配。

```markdown
org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'flywayInitializer' defined in class path resource [org/springframework/boot/autoconfigure/flyway/FlywayAutoConfiguration$FlywayConfiguration.class]: Invocation of init method failed; nested exception is org.flywaydb.core.internal.license.FlywayEditionUpgradeRequiredException: Flyway Teams Edition or Oracle upgrade required: Oracle 11.2 is no longer supported by Flyway Community Edition, but still supported by Flyway Teams Edition.
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.initializeBean(AbstractAutowireCapableBeanFactory.java:1786)
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.doCreateBean(AbstractAutowireCapableBeanFactory.java:602)
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBean(AbstractAutowireCapableBeanFactory.java:524)
	at org.springframework.beans.factory.support.AbstractBeanFactory.lambda$doGetBean$0(AbstractBeanFactory.java:335)
	at org.springframework.beans.factory.support.DefaultSingletonBeanRegistry.getSingleton(DefaultSingletonBeanRegistry.java:234)
	at org.springframework.beans.factory.support.AbstractBeanFactory.doGetBean(AbstractBeanFactory.java:333)
	at org.springframework.beans.factory.support.AbstractBeanFactory.getBean(AbstractBeanFactory.java:208)
	at org.springframework.beans.factory.support.AbstractBeanFactory.doGetBean(AbstractBeanFactory.java:322)
	at org.springframework.beans.factory.support.AbstractBeanFactory.getBean(AbstractBeanFactory.java:208)
	at org.springframework.beans.factory.support.DefaultListableBeanFactory.preInstantiateSingletons(DefaultListableBeanFactory.java:944)
	at org.springframework.context.support.AbstractApplicationContext.finishBeanFactoryInitialization(AbstractApplicationContext.java:918)
	at org.springframework.context.support.AbstractApplicationContext.refresh(AbstractApplicationContext.java:583)
	at org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext.refresh(ServletWebServerApplicationContext.java:145)
	at org.springframework.boot.SpringApplication.refresh(SpringApplication.java:754)
	at org.springframework.boot.SpringApplication.refreshContext(SpringApplication.java:434)
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:338)
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:1343)
	at org.springframework.boot.SpringApplication.run(SpringApplication.java:1332)
	at com.hightop.demo.oracle.only.OracleOnlyApplication.main(OracleOnlyApplication.java:14)
Caused by: org.flywaydb.core.internal.license.FlywayEditionUpgradeRequiredException: Flyway Teams Edition or Oracle upgrade required: Oracle 11.2 is no longer supported by Flyway Community Edition, but still supported by Flyway Teams Edition.
	at org.flywaydb.core.internal.database.base.Database.ensureDatabaseNotOlderThanOtherwiseRecommendUpgradeToFlywayEdition(Database.java:127)
	at org.flywaydb.core.internal.database.oracle.OracleDatabase.ensureSupported(OracleDatabase.java:84)
	at org.flywaydb.core.Flyway.execute(Flyway.java:561)
	at org.flywaydb.core.Flyway.migrate(Flyway.java:165)
	at com.hightop.magina.core.config.MaginaFlywayConfigurer.lambda$migrate$1(MaginaFlywayConfigurer.java:81)
	at java.util.stream.ForEachOps$ForEachOp$OfRef.accept(ForEachOps.java:184)
	at java.util.stream.SortedOps$SizedRefSortingSink.end(SortedOps.java:352)
	at java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:482)
	at java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:471)
	at java.util.stream.ForEachOps$ForEachOp.evaluateSequential(ForEachOps.java:151)
	at java.util.stream.ForEachOps$ForEachOp$OfRef.evaluateSequential(ForEachOps.java:174)
	at java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:234)
	at java.util.stream.ReferencePipeline.forEach(ReferencePipeline.java:418)
	at com.hightop.magina.core.config.MaginaFlywayConfigurer.migrate(MaginaFlywayConfigurer.java:71)
	at org.springframework.boot.autoconfigure.flyway.FlywayMigrationInitializer.afterPropertiesSet(FlywayMigrationInitializer.java:62)
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.invokeInitMethods(AbstractAutowireCapableBeanFactory.java:1845)
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.initializeBean(AbstractAutowireCapableBeanFactory.java:1782)
	... 18 common frames omitted

Disconnected from the target VM, address: '127.0.0.1:58499', transport: 'socket'

Process finished with exit code 1
```

## 源码阅读

flyway对数据库的支持扩展主要在包[org.flywaydb.core.internal.database](https://github.com/flyway/flyway/tree/flyway-7.7.3/flyway-core/src/main/java/org/flywaydb/core/internal/database){:target="_blank"}中，
其中涉及对数据库类型校验、数据库版本支持校验。
 
- [DatabaseTypeRegister](https://github.com/flyway/flyway/blob/flyway-7.7.3/flyway-core/src/main/java/org/flywaydb/core/internal/database/DatabaseTypeRegister.java){:target="_blank"}  

    数据库类型支持主要是通过`DatabaseTypeRegister`注册器实现

    ```java
    public class DatabaseTypeRegister {
        private static final Log LOG = LogFactory.getLog(DatabaseTypeRegister.class);
        // 注册的数据库类型列表
        private static final List<DatabaseType> registeredDatabaseTypes = new ArrayList<>();
        // 是否注册
        private static boolean hasRegisteredDatabaseTypes = false;
    
        private static void registerDatabaseTypes() {
            // 注册支持的数据库类型
            synchronized (registeredDatabaseTypes) {
                if (hasRegisteredDatabaseTypes) {
                    return;
                }
    
                registeredDatabaseTypes.clear();
                
                registeredDatabaseTypes.add(new SynapseDatabaseType());
    
                registeredDatabaseTypes.add(new CockroachDBDatabaseType());
                registeredDatabaseTypes.add(new RedshiftDatabaseType());
                registeredDatabaseTypes.add(new MariaDBDatabaseType());
    
                registeredDatabaseTypes.add(new DB2DatabaseType());
                registeredDatabaseTypes.add(new DerbyDatabaseType());
                registeredDatabaseTypes.add(new FirebirdDatabaseType());
                registeredDatabaseTypes.add(new H2DatabaseType());
                registeredDatabaseTypes.add(new HSQLDBDatabaseType());
                registeredDatabaseTypes.add(new InformixDatabaseType());
                registeredDatabaseTypes.add(new MySQLDatabaseType());
                // 这里可以看到oracle数据库类型支持
                registeredDatabaseTypes.add(new OracleDatabaseType());
                registeredDatabaseTypes.add(new PostgreSQLDatabaseType());
                registeredDatabaseTypes.add(new SAPHANADatabaseType());
                registeredDatabaseTypes.add(new SnowflakeDatabaseType());
                registeredDatabaseTypes.add(new SQLiteDatabaseType());
                registeredDatabaseTypes.add(new SQLServerDatabaseType());
                registeredDatabaseTypes.add(new SybaseASEJTDSDatabaseType());
                registeredDatabaseTypes.add(new SybaseASEJConnectDatabaseType());
    
                registeredDatabaseTypes.add(new TestContainersDatabaseType());
    
                hasRegisteredDatabaseTypes = true;
            }
        }
  
        // 其他方法省略
    
        
        // 核心方法 通过JDBC连接判断是否适配的数据库类型支持
        public static DatabaseType getDatabaseTypeForConnection(Connection connection) {
            // 没有注册 先注册一次
            if (!hasRegisteredDatabaseTypes) {
                registerDatabaseTypes();
            }
    
            DatabaseMetaData databaseMetaData = JdbcUtils.getDatabaseMetaData(connection);
            String databaseProductName = JdbcUtils.getDatabaseProductName(databaseMetaData);
            String databaseProductVersion = JdbcUtils.getDatabaseProductVersion(databaseMetaData);
    
            // 数据库类型选择
            for (DatabaseType type : registeredDatabaseTypes) {
                // 根据数据库名称确定是否匹配数据库类型
                if (type.handlesDatabaseProductNameAndVersion(databaseProductName, databaseProductVersion, connection)) {
                    return type;
                }
            }
    
            throw new FlywayException("Unsupported Database: " + databaseProductName);
        }
    }
    ```

- [OracleDatabaseType](https://github.com/flyway/flyway/blob/flyway-7.7.3/flyway-core/src/main/java/org/flywaydb/core/internal/database/oracle/OracleDatabaseType.java#L89-L91){:target="_blank"}

    ```java
    public class OracleDatabaseType extends DatabaseType {
        @Override
        public boolean handlesDatabaseProductNameAndVersion(String databaseProductName, String databaseProductVersion, Connection connection) {
              // jdbc meta里面的数据库名称前缀判断
              return databaseProductName.startsWith("Oracle");
        }
    }
    ```
  
- [OracleDatabase](https://github.com/flyway/flyway/blob/flyway-7.7.3/flyway-core/src/main/java/org/flywaydb/core/internal/database/oracle/OracleDatabase.java#L80-L87){:target="_blank"}

    ```java
    public class OracleDatabase extends Database<OracleConnection> {
        @Override
        public final void ensureSupported() {
            // 版本低于10 flyway所有产品都不支持
            ensureDatabaseIsRecentEnough("10");
            // 版本低于12.2 只有Teams支持
            ensureDatabaseNotOlderThanOtherwiseRecommendUpgradeToFlywayEdition("12.2", org.flywaydb.core.internal.license.Edition.ENTERPRISE);
            // 版本高于19.0 建议升级flyway 警告日志
            recommendFlywayUpgradeIfNecessary("19.0");
        }
    }
    ```

由这些可知，如果在11.2的Oracle语法没有变动的情况下，我们只需更改数据库支持版本范围就可以了，但是，
`OracleDatabase`中的`ensureSupported`方法是final的，不可以override，这个就比较恶心了，只能复制他的代码，构建自己的类型支持。

## 重写支持低版本数据库扩展
参考[官方对oracle数据库支持的目录](https://github.com/flyway/flyway/tree/flyway-7.7.3/flyway-core/src/main/java/org/flywaydb/core/internal/database/oracle){:target="_blank"}结构重写

- LowerOracleDatabaseType

    ```java
    class LowerOracleDatabaseType extends OracleDatabaseType {
        @Override
        public Database<?> createDatabase(Configuration configuration, JdbcConnectionFactory jdbcConnectionFactory,
                                          StatementInterceptor statementInterceptor) {
            OracleDatabase.enableTnsnamesOraSupport();
            return new LowerOracleDatabase(configuration, jdbcConnectionFactory, statementInterceptor);
        }
    
        @Override
        public boolean handlesDatabaseProductNameAndVersion(String databaseProductName, String databaseProductVersion,
                                                            Connection connection) {
            // 必须满足是oracle数据库
            if (!super.handlesDatabaseProductNameAndVersion(databaseProductName, databaseProductVersion, connection)) {
                return false;
            }
    
            DatabaseMetaData metaData = JdbcUtils.getDatabaseMetaData(connection);
            try {
                return
                    // 版本小于等于12.2则满足条件
                    !MigrationVersion.fromVersion(
                            metaData.getDatabaseMajorVersion() + "." + metaData.getDatabaseMinorVersion()
                        )
                        .isAtLeast("12.2");
            } catch (Exception e) {
                log.error(e.getMessage(), e);
            }
    
            return false;
        }
    }
    ```

- LowerOracleDatabase

    ```java
    class LowerOracleDatabase extends Database<LowerOracleConnection> {
        private static final String ORACLE_NET_TNS_ADMIN = "oracle.net.tns_admin";
    
        public LowerOracleDatabase(Configuration configuration,
                                   JdbcConnectionFactory jdbcConnectionFactory,
                                   StatementInterceptor statementInterceptor) {
            super(configuration, jdbcConnectionFactory, statementInterceptor);
        }
  
        // 其他代码跟org.flywaydb.core.internal.database.oracle.OracleDatabase一样
        
        @Override
        public void ensureSupported() {
            // 数据库类型中判断版本必须小于等于12.2
            // 这里确保高于10 
            ensureDatabaseIsRecentEnough("10");
        }
    }
    ```

- LowerOracleConnection

    ```java
    // 代码跟org.flywaydb.core.internal.database.oracle.OracleConnection一样 只是修改了泛型类型
    class LowerOracleConnection extends Connection<LowerOracleDatabase> {
        protected LowerOracleConnection(LowerOracleDatabase database, java.sql.Connection connection) {
            super(database, connection);
        }
    }
    ```

- LowerOracleSchema

```java
// 代码跟org.flywaydb.core.internal.database.oracle.OracleSchema一样 只是修改了泛型类型
class LowerOracleSchema extends Schema<LowerOracleDatabase, LowerOracleTable> {
    protected LowerOracleSchema(JdbcTemplate jdbcTemplate, LowerOracleDatabase database, String name) {
        super(jdbcTemplate, database, name);
    }
}
```

- LowerOracleTable

    ```java
    // 代码跟org.flywaydb.core.internal.database.oracle.OracleTable一样 只是修改了泛型类型
    class LowerOracleTable extends Table<LowerOracleDatabase, LowerOracleSchema> {
        LowerOracleTable(JdbcTemplate jdbcTemplate,
                         LowerOracleDatabase database,
                         LowerOracleSchema schema, String name) {
            super(jdbcTemplate, database, schema, name);
        }
    }
    ```

## 将自定义的扩展注册到flyway中

```mermaid
flowchart LR
A(定义扩展接口) --> B(自定义数据库类型实现扩展) --> C(在flyway自动配置之前注册)
```

- 定义扩展接口

    ```java
    public abstract class DatabaseTypeSupportExpander {
        /**
         * 数据库类型适配改造过程
         */
        public abstract void doAdapt();
    
        /**
         * 移除现有的类型
         * @param predicate {@link Predicate}
         */
        protected static void removeDatabaseType(Predicate<? super DatabaseType> predicate) {
            getDatabaseTypes().removeIf(predicate);
        }
    
        /**
         * 新增数据库类型支持
         * @param databaseType {@link DatabaseType}
         */
        protected static void addDatabaseType(DatabaseType databaseType) {
            // 优先级排高
            getDatabaseTypes().add(0, databaseType);
        }
    
        /**
         * 获得flyway支持的数据库类型 若未进行初始化先初始化
         * @return {@link List}
         */
        @SuppressWarnings("unchecked")
        private static List<DatabaseType> getDatabaseTypes() {
            boolean hasRegisteredDatabaseTypes = (boolean) DatabaseTypeSupportExpander.getFieldValue(
                "hasRegisteredDatabaseTypes");
            // 没有注册类型
            if (!hasRegisteredDatabaseTypes) {
                synchronized (DatabaseTypeSupportExpander.class) {
                    DatabaseTypeSupportExpander.invokeRegisteredDatabaseTypes();
                }
            }
    
            return (List<DatabaseType>) DatabaseTypeSupportExpander.getFieldValue("registeredDatabaseTypes");
        }
    
        /**
         * 执行数据库类型注册
         */
        private static void invokeRegisteredDatabaseTypes() {
            try {
                Method method = DatabaseTypeRegister.class.getDeclaredMethod("registerDatabaseTypes");
                if (!method.isAccessible()) {
                    method.setAccessible(true);
                }
    
                method.invoke(null);
            } catch (Exception e) {
                // 忽略我的异常类型
                throw new MaginaException(e);
            }
        }
    
        /**
         * 获得{@link DatabaseTypeRegister}静态字段值
         * @param name 字段名
         * @return 字段值
         */
        private static Object getFieldValue(String name) {
            try {
                Field field = DatabaseTypeRegister.class.getDeclaredField(name);
                if (!field.isAccessible()) {
                    field.setAccessible(true);
                }
    
                return field.get(null);
            } catch (Exception e) {
                // 忽略我的异常类型
                throw new MaginaException(e);
            }
        }
    }
    ```

- 自定义数据库类型实现扩展

    ```java
    @Component
    class LowerOracleSupportExpander extends DatabaseTypeSupportExpander {
        @Override
        public void doAdapt() {
            DatabaseTypeSupportExpander.addDatabaseType(new LowerOracleDatabaseType());
        }
    }
    ```
  
- 在flyway自动配置之前注册

    ```java
    @Configuration(proxyBeanMethods = false)
    @FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
    @RequiredArgsConstructor
    // 在flyway自动配置之前初始化
    @AutoConfigureBefore(FlywayAutoConfiguration.class)
    @Slf4j
    class MaginaFlywayConfigurer implements FlywayMigrationStrategy {
        ObjectProvider<List<DatabaseTypeSupportExpander>> expanderProvider;
    
        @PostConstruct
        void init() {
            // 初始化扩展
            this.expanderProvider.ifAvailable(expanders -> expanders.forEach(DatabaseTypeSupportExpander::doAdapt));
        }
    }
    ```

以上，通过反射的方式实现了对flyway数据库的扩展支持，类似的，项目中遇到了使用达梦数据库，flyway同样不支持，
考虑到达梦类似Oracle数据库，通过上面的方式很快就实现了对达梦数据库的支持。

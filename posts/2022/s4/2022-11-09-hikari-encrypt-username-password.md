---
title:  SpringBoot中使用Hikari时对数据库用户名密码加密
tags: [java]
---

为了满足**二级等保**要求，数据库用户名、密码需要进行加密且内存中不能常驻明文用户名、密码。
使用[jasypt](http://www.jasypt.org/)实质上是读取配置时解密，然后设置用户名密码到数据源中，
结果不满足内存中不常驻明文用户名、密码要求。

笔者在扩展这一支持时使用的是SpringBoot推荐的[Hikari 4.0.3](https://github.com/brettwooldridge/HikariCP/tree/HikariCP-4.0.3)，
以下的扩展均基于此版本修改。

## 关于Hikari是如何创建数据库连接的?

### 1. 在HikariDataSource的[getConnection()](https://github.com/brettwooldridge/HikariCP/blob/HikariCP-4.0.3/src/main/java/com/zaxxer/hikari/HikariDataSource.java#L104-L126)方法中创建数据源连接

```java
// 方法重载的java.sql.DataSource
@Override
public Connection getConnection() throws SQLException
{
   if (isClosed()) {
      throw new SQLException("HikariDataSource " + this + " has been closed.");
   }

   // 如果连接池已经初始化 直接重连接池获取连接
   if (fastPathPool != null) {
      return fastPathPool.getConnection();
   }

   // See http://en.wikipedia.org/wiki/Double-checked_locking#Usage_in_Java
   // 双重锁初始化连接池
   HikariPool result = pool;
   if (result == null) {
      synchronized (this) {
         result = pool;
         if (result == null) {
            validate();
            LOGGER.info("{} - Starting...", getPoolName());
            try {
               // 连接池初始化
               pool = result = new HikariPool(this);
               this.seal();
            }
            catch (PoolInitializationException pie) {
               if (pie.getCause() instanceof SQLException) {
                  throw (SQLException) pie.getCause();
               }
               else {
                  throw pie;
               }
            }
            LOGGER.info("{} - Start completed.", getPoolName());
         }
      }
   }

   // 获得连接池的连接
   return result.getConnection();
}
```

### 2. HikariPool的父类PoolBase

其默认构造方法有一个[initializeDataSource()](https://github.com/brettwooldridge/HikariCP/blob/da838d36fa85fabcdd671a1fa4d9e22392e9e9a3/src/main/java/com/zaxxer/hikari/pool/PoolBase.java#L315-L348)方法

```java
 private void initializeDataSource()
 {
    final String jdbcUrl = config.getJdbcUrl();
    final String username = config.getUsername();
    final String password = config.getPassword();
    final String dsClassName = config.getDataSourceClassName();
    final String driverClassName = config.getDriverClassName();
    final String dataSourceJNDI = config.getDataSourceJNDI();
    final Properties dataSourceProperties = config.getDataSourceProperties();

    // 默认为null 由HikariDataSource来
    DataSource ds = config.getDataSource();
    // 若设置了DataSource的类型 且当前的ds为null 则通过设置的类型构造一个DataSource
    // 需要将用户名密码设置在dataSourceProperties才能被复制到目标数据源
    if (dsClassName != null && ds == null) {
       ds = createInstance(dsClassName, DataSource.class);
       PropertyElf.setTargetFromProperties(ds, dataSourceProperties);
    }
    // jdbcUrl非空且当前ds为null 通过当前的连接信息初始化DriverDataSource数据源
    else if (jdbcUrl != null && ds == null) {
       ds = new DriverDataSource(jdbcUrl, driverClassName, dataSourceProperties, username, password);
    }
    // JNDI方式
    else if (dataSourceJNDI != null && ds == null) {
       try {
          InitialContext ic = new InitialContext();
          ds = (DataSource) ic.lookup(dataSourceJNDI);
       } catch (NamingException e) {
          throw new PoolInitializationException(e);
       }
    }

    if (ds != null) {
       setLoginTimeout(ds);
       createNetworkTimeoutExecutor(ds, dsClassName, jdbcUrl);
    }
    this.dataSource = ds;
 }
```
   
通过代码我们可以知道，若在初始化HikariDataSource的时候设[置了dataSource](https://github.com/brettwooldridge/HikariCP/blob/da838d36fa/src/main/java/com/zaxxer/hikari/HikariConfig.java#L95)，则连接池会直接使用设置的数据源初始化连接。

### 3. [DriverDataSource](https://github.com/brettwooldridge/HikariCP/blob/da838d36fa/src/main/java/com/zaxxer/hikari/util/DriverDataSource.java)
根据HikariDataSource配置实现获取连接的方法

以上，大概梳理了hikari初始化连接池过程，我们只需要定义一个在创建连接时解密的数据源则满足了加密需求。

## 扩展数据源支持用户名、密码加密

### 1. 定义解密接口

```java
// 这里将用户名密码分开解密，考虑用户名密码相同时密文可能一样，所以在加密时可以考虑加盐的方式避免
public interface AuthenticationDecryptor {
    /**
     * 用户名解密
     * @param username 用户名密文
     * @return 用户名明文
     */
    String decryptUsername(String username);

    /**
     * 密码解密
     * @param password 密码密文
     * @return 密码明文
     */
    String decryptPassword(String password);
}
```

### 2. 定义解密配置及解密器实现

```java
// 数据库连接用户名、密码加密配置
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@Configuration(proxyBeanMethods = false)
@ConfigurationProperties(prefix = "db")
public class DatabaseCipherProperties {
    /**
     * 连接授权对称密钥
     */
    String authSecretKey;
    /**
     * 禁止用户名加密 默认需要对用户名加密
     */
    boolean disableUsernameEncrypt = false;

    /**
     * 是否禁止存储对称加密
     * @return true/false
     */
    public boolean isDisableStorageEncrypt() {
        return StringUtils.isEmpty(this.storageSecretKey);
    }

    /**
     * 是否禁止连接授权对称加密
     * @return true/false
     */
    public boolean isDisableAuthEncrypt() {
        return StringUtils.isEmpty(this.authSecretKey);
    }
}
// 数据库用户名、密码解密器
static class DatabaseAuthenticationDecryptor implements AuthenticationDecryptor {
    DatabaseCipherProperties databaseCipherProperties;

    @Override
    public String decryptUsername(String username) {
        // 未开启数据库授权加密或者禁止用户名加密
        if (databaseCipherProperties.isDisableAuthEncrypt() || databaseCipherProperties.isDisableUsernameEncrypt()) {
            return username;
        }

        return Sm4CipherType.USERNAME.decrypt(databaseCipherProperties.getAuthSecretKey(), username);
    }

    @Override
    public String decryptPassword(String password) {
        // 未开启数据库授权加密
        if (databaseCipherProperties.isDisableAuthEncrypt()) {
            return password;
        }

        return Sm4CipherType.PASSWORD.decrypt(databaseCipherProperties.getAuthSecretKey(), password);
    }
}
```

### 3. 定义可加密用户名密码的数据源，参考DriverDataSource，仅修改在创建连接数时将用户名、密码解密

```java
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProtectedHikariDataSource implements DataSource {
    AuthenticationDecryptor decryptor;
    String jdbcUrl;
    Properties driverProperties;
    @NonFinal
    Driver driver;

    /**
     * jdbc用户名连接属性
     */
    private static final String USER = "user";
    /**
     * jdbc用户名连接属性
     */
    private static final String USERNAME = "username";
    /**
     * jdbc密码连接属性
     */
    private static final String PASSWORD = "password";

    public ProtectedHikariDataSource(HikariConfig hikariConfig, AuthenticationDecryptor decryptor) {
        // 其他部分与DriverDataSource类似，属性来源HikariConfig
        this.decryptor = Objects.requireNonNull(decryptor);
    }

    @Override
    public Connection getConnection() throws SQLException {
        return
            this.doGetConnection(
                this.driverProperties.getProperty(USER, this.driverProperties.getProperty(USERNAME)),
                this.driverProperties.getProperty(PASSWORD)
            );
    }

    @Override
    public Connection getConnection(final String username, final String password) throws SQLException {
        return this.doGetConnection(username, password);
    }

    /**
     * 解密关键字创建连接
     * @param username 用户名
     * @param password 密码
     * @return {@link Connection}
     * @throws SQLException SQLException
     */
    protected Connection doGetConnection(final String username, final String password) throws SQLException {
        final Properties cloned = new Properties(this.driverProperties);

        // 创建连接前解密密文用户名
        Optional.ofNullable(username)
            .ifPresent(it -> {
                try {
                    String decrypt = this.decryptor.decryptUsername(it);
                    cloned.put(USER, decrypt);
                    if (cloned.containsKey(USERNAME)) {
                        cloned.put(USERNAME, decrypt);
                    }
                } catch (Exception e) {
                    log.error(e.getMessage(), e);
                    throw new SQLException(e);
                }
            });

        // 创建连接前解密密文密码
        Optional.ofNullable(password)
            .ifPresent(it -> {
                try {
                    String decrypt = this.decryptor.decryptPassword(it);
                    cloned.put(PASSWORD, decrypt);
                } catch (Exception e) {
                    log.error(e.getMessage(), e);
                    throw new SQLException(e);
                }
            });

        return driver.connect(jdbcUrl, cloned);
    }
}
```

### 4. Spring配置

```java
@Configuration(proxyBeanMethods = false)
@Slf4j
class CipherConfigurer implements WebMvcConfigurer {
    /**
    * 构造方法初始化数据库连接加密配置
    * @param hikariDataSource         {@link HikariDataSource}
    * @param databaseCipherProperties {@link DatabaseCipherProperties}
    * @since 1.1.0
    */
    public CipherConfigurer(HikariDataSource hikariDataSource, DatabaseCipherProperties databaseCipherProperties) {
        // 设置HikariDataSource自定义数据源
        hikariDataSource.setDataSource(
            new ProtectedHikariDataSource(
                hikariDataSource,
                new DatabaseAuthenticationDecryptor(databaseCipherProperties)
            )
        );
    }
}
```

```yml
spring:
  datasource:
    url: jdbc:oracle:thin:@//localhost:1521/ORCL
    username: demo
    password: 1b52ea1954f984f2dfd51dfccff224c712788249decade70e8f307d9dcb15928

db:
  auth-secret-key: 你的对称加密密钥
  # 配置不做用户名加密
  disable-username-encrypt: true
```

以上，完成了满足二级等保要求的数据库连接用户名、密码加密要求。

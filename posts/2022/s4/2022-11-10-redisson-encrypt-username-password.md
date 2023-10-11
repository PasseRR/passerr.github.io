---
title:  SpringBoot中使用Redisson时对用户名密码加密
tags: [springboot, redission, java]
---

为了满足**二级等保**要求，数据库用户名、密码需要进行加密且内存中不能常驻明文用户名、密码。
使用[jasypt](http://www.jasypt.org/)实质上是读取配置时解密，然后设置用户名密码到配置中，
结果不满足内存中不常驻明文用户名、密码要求。

笔者在扩展这一支持时使用的是[Redisson 3.16.2](https://github.com/redisson/redisson/tree/redisson-3.16.2)，
以下的扩展均基于此版本修改，其他版本可以参考修改。

## Redisson连接创建过程

### 1. 自动配置
通过不同的配置Redisson支持单机、主从、哨兵、集群、分片等多种连接模式，
结合spring-data-redis的`RedisProperties`[自动配置](https://github.com/redisson/redisson/blob/redisson-3.16.2/redisson-spring-boot-starter/src/main/java/org/redisson/spring/starter/RedissonAutoConfiguration.java#L116-L204)。

```java
@Bean(destroyMethod = "shutdown")
@ConditionalOnMissingBean(RedissonClient.class)
public RedissonClient redisson() throws IOException {
    Config config = null;
    Method clusterMethod = ReflectionUtils.findMethod(RedisProperties.class, "getCluster");
    Method timeoutMethod = ReflectionUtils.findMethod(RedisProperties.class, "getTimeout");
    Object timeoutValue = ReflectionUtils.invokeMethod(timeoutMethod, redisProperties);
    int timeout;
    if(null == timeoutValue){
        timeout = 10000;
    }else if (!(timeoutValue instanceof Integer)) {
        Method millisMethod = ReflectionUtils.findMethod(timeoutValue.getClass(), "toMillis");
        timeout = ((Long) ReflectionUtils.invokeMethod(millisMethod, timeoutValue)).intValue();
    } else {
        timeout = (Integer)timeoutValue;
    }
    
    // 根据配置区分不同连接模式
    if (redissonProperties.getConfig() != null) {
        try {
            config = Config.fromYAML(redissonProperties.getConfig());
        } catch (IOException e) {
            try {
                config = Config.fromJSON(redissonProperties.getConfig());
            } catch (IOException e1) {
                throw new IllegalArgumentException("Can't parse config", e1);
            }
        }
    } else if (redissonProperties.getFile() != null) {
        try {
            InputStream is = getConfigStream();
            config = Config.fromYAML(is);
        } catch (IOException e) {
            // trying next format
            try {
                InputStream is = getConfigStream();
                config = Config.fromJSON(is);
            } catch (IOException e1) {
                throw new IllegalArgumentException("Can't parse config", e1);
            }
        }
    } else if (redisProperties.getSentinel() != null) {
        Method nodesMethod = ReflectionUtils.findMethod(Sentinel.class, "getNodes");
        Object nodesValue = ReflectionUtils.invokeMethod(nodesMethod, redisProperties.getSentinel());

        String[] nodes;
        if (nodesValue instanceof String) {
            nodes = convert(Arrays.asList(((String)nodesValue).split(",")));
        } else {
            nodes = convert((List<String>)nodesValue);
        }

        config = new Config();
        config.useSentinelServers()
            .setMasterName(redisProperties.getSentinel().getMaster())
            .addSentinelAddress(nodes)
            .setDatabase(redisProperties.getDatabase())
            .setConnectTimeout(timeout)
            .setPassword(redisProperties.getPassword());
    } else if (clusterMethod != null && ReflectionUtils.invokeMethod(clusterMethod, redisProperties) != null) {
        Object clusterObject = ReflectionUtils.invokeMethod(clusterMethod, redisProperties);
        Method nodesMethod = ReflectionUtils.findMethod(clusterObject.getClass(), "getNodes");
        List<String> nodesObject = (List) ReflectionUtils.invokeMethod(nodesMethod, clusterObject);

        String[] nodes = convert(nodesObject);

        config = new Config();
        config.useClusterServers()
            .addNodeAddress(nodes)
            .setConnectTimeout(timeout)
            .setPassword(redisProperties.getPassword());
    } else {
        config = new Config();
        String prefix = REDIS_PROTOCOL_PREFIX;
        Method method = ReflectionUtils.findMethod(RedisProperties.class, "isSsl");
        if (method != null && (Boolean)ReflectionUtils.invokeMethod(method, redisProperties)) {
            prefix = REDISS_PROTOCOL_PREFIX;
        }

        config.useSingleServer()
            .setAddress(prefix + redisProperties.getHost() + ":" + redisProperties.getPort())
            .setConnectTimeout(timeout)
            .setDatabase(redisProperties.getDatabase())
            .setPassword(redisProperties.getPassword());
    }
    // 这里可以对配置自定义扩展
    if (redissonAutoConfigurationCustomizers != null) {
        for (RedissonAutoConfigurationCustomizer customizer : redissonAutoConfigurationCustomizers) {
            customizer.customize(config);
        }
    }
    return Redisson.create(config);
}
```

### 2. 连接管理器创建

- [Redisson](https://github.com/redisson/redisson/blob/redisson-3.16.2/redisson/src/main/java/org/redisson/Redisson.java#L67)

    ```java
    // Redisson是RedissonClient的实现，我们可以在代码中直接注入RedissonClient使用
    protected Redisson(Config config) {
        this.config = config;
        Config configCopy = new Config(config);
    
        // 连接管理器 本质上管理RedisClient
        connectionManager = ConfigSupport.createConnectionManager(configCopy);
        RedissonObjectBuilder objectBuilder = null;
        if (config.isReferenceEnabled()) {
            objectBuilder = new RedissonObjectBuilder(this);
        }
        // 命令执行器 通过连接管理器获得连接 执行命令
        commandExecutor = new CommandSyncService(connectionManager, objectBuilder);
        evictionScheduler = new EvictionScheduler(commandExecutor);
        writeBehindService = new WriteBehindService(commandExecutor);
    }
    ```
- [ConfigSupport](https://github.com/redisson/redisson/blob/redisson-3.16.2/redisson/src/main/java/org/redisson/config/ConfigSupport.java#L182-L205)

   ```java
    // 通过配置初始化不同的连接管理器
    public static ConnectionManager createConnectionManager(Config configCopy) {
        UUID id = UUID.randomUUID();

        if (configCopy.getMasterSlaveServersConfig() != null) {
            validate(configCopy.getMasterSlaveServersConfig());
            return new MasterSlaveConnectionManager(configCopy.getMasterSlaveServersConfig(), configCopy, id);
        } else if (configCopy.getSingleServerConfig() != null) {
            validate(configCopy.getSingleServerConfig());
            return new SingleConnectionManager(configCopy.getSingleServerConfig(), configCopy, id);
        } else if (configCopy.getSentinelServersConfig() != null) {
            validate(configCopy.getSentinelServersConfig());
            return new SentinelConnectionManager(configCopy.getSentinelServersConfig(), configCopy, id);
        } else if (configCopy.getClusterServersConfig() != null) {
            validate(configCopy.getClusterServersConfig());
            return new ClusterConnectionManager(configCopy.getClusterServersConfig(), configCopy, id);
        } else if (configCopy.getReplicatedServersConfig() != null) {
            validate(configCopy.getReplicatedServersConfig());
            return new ReplicatedConnectionManager(configCopy.getReplicatedServersConfig(), configCopy, id);
        } else if (configCopy.getConnectionManager() != null) {
            return configCopy.getConnectionManager();
        }else {
            throw new IllegalArgumentException("server(s) address(es) not defined!");
        }
    }
   ```

### 3. [RedisClient](https://github.com/redisson/redisson/blob/redisson-3.16.2/redisson/src/main/java/org/redisson/client/RedisClient.java#L85-L124)创建

```java
private RedisClient(RedisClientConfig config) {
    // 省略其他
    
    channels = new DefaultChannelGroup(copy.getGroup().next());
    // 初始化netty引导程序
    bootstrap = createBootstrap(copy, Type.PLAIN);
    pubSubBootstrap = createBootstrap(copy, Type.PUBSUB);
    
    this.commandTimeout = copy.getCommandTimeout();
}

private Bootstrap createBootstrap(RedisClientConfig config, Type type) {
    Bootstrap bootstrap = new Bootstrap()
        .resolver(config.getResolverGroup())
        .channel(config.getSocketChannelClass())
        .group(config.getGroup());

    // 初始化nio通道
    bootstrap.handler(new RedisChannelInitializer(bootstrap, config, this, channels, type));
    bootstrap.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, config.getConnectTimeout());
    bootstrap.option(ChannelOption.SO_KEEPALIVE, config.isKeepAlive());
    bootstrap.option(ChannelOption.TCP_NODELAY, config.isTcpNoDelay());
    // 预留的netty钩子 后面实现用户名、密码解密会用到
    config.getNettyHook().afterBoostrapInitialization(bootstrap);
    return bootstrap;
}
```

### 4. nio通道[始化过程](https://github.com/redisson/redisson/blob/redisson-3.16.2/redisson/src/main/java/org/redisson/client/handler/RedisChannelInitializer.java#L74-L107)

```java
@Override
protected void initChannel(Channel ch) throws Exception {
    initSsl(config, ch);
    
    // 连接处理器
    if (type == Type.PLAIN) {
        ch.pipeline().addLast(new RedisConnectionHandler(redisClient));
    } else {
        ch.pipeline().addLast(new RedisPubSubConnectionHandler(redisClient));
    }

    ch.pipeline().addLast(
        // 看门狗
        connectionWatchdog,
        // 命令报文编码器 所有命令都会通过它进行编码发送到redis server
        // 考虑通过重写encode方法 拦截auth命令 对auth命令参数解密即可
        CommandEncoder.INSTANCE,
        // 批量命令编码器
        CommandBatchEncoder.INSTANCE);

    if (type == Type.PLAIN) {
        ch.pipeline().addLast(new CommandsQueue());
    } else {
        ch.pipeline().addLast(new CommandsQueuePubSub());
    }

    if (pingConnectionHandler != null) {
        ch.pipeline().addLast(pingConnectionHandler);
    }
    
    if (type == Type.PLAIN) {
        ch.pipeline().addLast(new CommandDecoder(config.getAddress().getScheme()));
    } else {
        ch.pipeline().addLast(new CommandPubSubDecoder(config));
    }

    ch.pipeline().addLast(new ErrorsLoggingHandler());

    config.getNettyHook().afterChannelInitialization(ch);
}
```

## 扩展CommandEncoder支持用户名、密码加密

通过扩展CommandEncoder，重写encode方法，发送报文编码之前拦截[AUTH](https://github.com/redisson/redisson/blob/redisson-3.16.2/redisson/src/main/java/org/redisson/client/protocol/RedisCommands.java#L259)命令，
编码时将命令参数(用户名、密码)解密，通过[NettyHook](https://github.com/redisson/redisson/blob/redisson-3.16.2/redisson/src/main/java/org/redisson/client/NettyHook.java#L42)将扩展实现的CommandEncoder替换。

### 1. 定义解密器

这里解密是区分用户名、密码，避免用户名密码相同时密文一样，可以在对称加密时对用户名、密码加入不同的盐，
即使用户名密码一样密文也不一样。

```java
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

### 2. 扩展CommandEncoder

```java
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
class CipherAuthEncoder extends CommandEncoder {
    AuthenticationDecryptor authenticationDecryptor;

    @Override
    protected void encode(ChannelHandlerContext ctx, CommandData<?, ?> msg, ByteBuf out) throws Exception {
        // 如果是授权命令 修改参数值
        if (RedisCommands.AUTH.equals(msg.getCommand())) {
            Object[] params = msg.getParams();
            // 只有一个参数时 进行密码解密
            if (params.length == 1) {
                params[0] = this.authenticationDecryptor.decryptPassword(String.valueOf(params[0]));
            } else {
                // 存在两个参数时 进行用户名、密码解密
                params[0] = this.authenticationDecryptor.decryptUsername(String.valueOf(params[0]));
                params[1] = this.authenticationDecryptor.decryptPassword(String.valueOf(params[1]));
            }
        }

        super.encode(ctx, msg, out);
    }
}
```

### 3. 自定义NettyHook

```java
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CipherNettyHook extends DefaultNettyHook {
    CipherAuthEncoder cipherAuthEncoder;

    public CipherNettyHook(AuthenticationDecryptor authenticationDecryptor) {
        this.cipherAuthEncoder = new CipherAuthEncoder(authenticationDecryptor);
    }

    @Override
    public void afterChannelInitialization(Channel channel) {
        super.afterChannelInitialization(channel);
        // 将原有的CommandEncoder替换为新的编码器
        channel.pipeline().replace(CommandEncoder.class, null, this.cipherAuthEncoder);
    }
}
```

### 4. 解密配置及解密器实现

```java
// 解密配置 可根据情况配置其他辅助信息
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@Configuration(proxyBeanMethods = false)
@ConfigurationProperties(prefix = "redis")
public class RedisCipherProperties {
    /**
     * 连接授权对称密钥
     */
    String authSecretKey;
    /**
     * 禁止用户名加密 默认需要对用户名加密
     */
    boolean disableUsernameEncrypt = false;

    /**
     * 是否禁止连接授权对称加密
     * @return true/false
     */
    public boolean isDisableAuthEncrypt() {
        return StringUtils.isEmpty(this.authSecretKey);
    }
}

// 解密器实现 只要是能把密文解密成明文即可 我使用的是SM4对称加密
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Slf4j
class RedisAuthenticationDecryptor implements AuthenticationDecryptor {
    RedisCipherProperties redisCipherProperties;

    @Override
    public String decryptUsername(String username) {
        if (redisCipherProperties.isDisableAuthEncrypt() || redisCipherProperties.isDisableUsernameEncrypt()) {
            return username;
        }

        try {
            return Sm4CipherType.USERNAME.decrypt(redisCipherProperties.getAuthSecretKey(), username);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            throw new MaginaException("Redis用户名解密失败");
        }
    }

    @Override
    public String decryptPassword(String password) {
        if (redisCipherProperties.isDisableAuthEncrypt()) {
            return password;
        }

        try {
            return Sm4CipherType.PASSWORD.decrypt(redisCipherProperties.getAuthSecretKey(), password);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            throw new MaginaException("Redis免密解密失败");
        }
    }
}
```

### 5. 配置自定义NettyHook

```java
@Configuration(proxyBeanMethods = false)
class CipherAuthConfigurer {
    @Bean
    RedissonAutoConfigurationCustomizer authRedissonAutoConfigurationCustomizer(RedisCipherProperties redisCipherProperties) {
        // 通过自定义配置bean 设置我们自定的NettyHook
        return c -> c.setNettyHook(new CipherNettyHook(new RedisAuthenticationDecryptor(redisCipherProperties)));
    }
}
```

### 6. yml配置

```yaml
spring:
  redis:
    host: localhost
    port: 6379
    password: 321b01bfb3e3af479989c4561d8ea01ab7a50c6b7be3a242a73da57b710075c0
    timeout: 10S

redis:
  auth-secret-key: 你的对称加密密钥
  # redis 6.0之后支持用户名
  disable-username-encrypt: false
```

以上，完成了满足二级等保要求的Redis连接用户名、密码加密要求。

---
title:  "Nacos国产化适配达梦数据库、TongWeb"
tags: [nacos, 国产化, 数据库, 达梦, 东方通, java]
---

项目国产化要求，数据库只能使用[达梦](https://www.dameng.com/DM8.html)数据库，web容器只能使用[东方通-TongWeb](https://www.tongtech.com/pctype/25.html)，nacos默认仅支持derby和mysql数据库，容器使用的是tomcat，
需要做数据库和web容器的适配达到国产化要求。

## 达梦数据库适配插件准备

### 数据库准备

创建达梦用户并导入[sql](https://github.com/nacos-group/nacos-plugin/blob/develop/nacos-datasource-plugin-ext/nacos-dm-datasource-plugin-ext/src/main/resources/schema/nacos-dm.sql)。

### 插件编译打包

自[nacos 2.2.0](https://github.com/alibaba/nacos/releases/tag/2.2.0)版本开始支持数据源插件支持，可以扩展支持其他数据库。
社区已经有[达梦数据源插件](https://github.com/nacos-group/nacos-plugin/tree/develop/nacos-datasource-plugin-ext/nacos-dm-datasource-plugin-ext)，这里仅做插件编译打包。

```bash
git clone https://github.com/nacos-group/nacos-plugin
cd nacos-plugin && mvn clean package
```

打包完成可以获得nacos-datasource-plugin-ext/nacos-dm-datasource-plugin-ext/target/nacos-dm-datasource-plugin-ext-1.0.0-SNAPSHOT.jar备用。

### Maven打包遇到的[问题](https://github.com/nacos-group/nacos-plugin/issues/38)

1. Could not resolve dependencies for project com.alibaba.nacos:nacos-encryption-plugin-ext\:pom\:1.0.0-SNAPSHOT: The following artifacts could not be resolved: 
   com.alibaba.nacos:nacos-encryption-plugin\:jar\:2.3.0-SNAPSHOT, com.alibaba.nacos:nacos-common\:jar\:2.3.0-SNAPSHOT: 
   Could not find artifact com.alibaba.nacos:nacos-encryption-plugin\:jar\:2.3.0-SNAPSHOT

   根据[Nacos的仓库](https://github.com/alibaba/nacos)项目的版本更新根目录pom中alibaba-nacos.version的值。如目前的值为2.4.0-SNAPSHOT，或者修改为一个release版本号。
   ```xml
   <alibaba-nacos.version>2.3.0</alibaba-nacos.version>
   ```
2. Could not resolve dependencies for project com.alibaba.nacos:nacos-dm-datasource-plugin-ext\:jar\:1.0.0-SNAPSHOT: Could not find artifact com.dameng:DmJdbcDriver18\:jar\:8.1.2.79

   无法找到jar包com.dameng\:DmJdbcDriver18\:jar\:8.1.2.114，这可能是因为你的电脑上没有该jar包。这时可以根据注释的提示修改版本为8.1.2.79，
   并将达梦依赖的systemPath和scope的标签删除，以便从在线仓库中下载。

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns="http://maven.apache.org/POM/4.0.0"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
    <artifactId>nacos-datasource-plugin-ext</artifactId>
    <groupId>com.alibaba.nacos</groupId>
    <version>${revision}</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>
    
        <artifactId>nacos-dm-datasource-plugin-ext</artifactId>
    
        <properties>
            <maven.compiler.source>8</maven.compiler.source>
            <maven.compiler.target>8</maven.compiler.target>
            <!-- 驱动小版本不同时，可能会造成某些操作异常（读取超长CLOB，TEXT），
                 需要使用达梦安装目录下drivers/jdbc下的驱动      -->
            <jdbc.dm.version>8.1.2.79</jdbc.dm.version> 
        </properties>
    
        <dependencies>
            <dependency>
                <groupId>com.dameng</groupId>
                <artifactId>DmJdbcDriver18</artifactId>
                <version>${jdbc.dm.version}</version>
            </dependency>
            <dependency>
                <groupId>com.alibaba.nacos</groupId>
                <artifactId>nacos-datasource-plugin-ext-base</artifactId>
                <version>${revision}</version>
                <scope>compile</scope>
            </dependency>
        </dependencies>
    </project>
   ```

## TongWeb依赖准备

厂商会提供springboot的tongweb依赖jar，这里以tongweb-spring-boot-starter-2.x为例。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.tongweb</groupId>
    <version>7.0.E.6_P2</version>
    <artifactId>tongweb-spring-boot-starter-2.x</artifactId>
    <dependencies>
        <dependency>
            <groupId>com.tongweb</groupId>
            <artifactId>tongweb-embed-core</artifactId>
            <version>7.0.E.6_P2</version>
            <scope>compile</scope>
        </dependency>
        <dependency>
            <groupId>com.tongweb</groupId>
            <artifactId>tongweb-embed-el</artifactId>
            <version>7.0.E.6_P2</version>
            <scope>compile</scope>
        </dependency>
        <dependency>
            <groupId>com.tongweb</groupId>
            <artifactId>tongweb-javax-annotation</artifactId>
            <version>1.2</version>
        </dependency>
        <dependency>
            <groupId>com.tongweb</groupId>
            <artifactId>tongweb-dependencies-check</artifactId>
            <version>7.0.E.6_P2</version>
        </dependency>
        <dependency>
            <groupId>org.eclipse.jdt</groupId>
            <artifactId>ecj</artifactId>
            <version>3.20.0</version>
            <scope>compile</scope>
        </dependency>
        <dependency>
            <groupId>com.tongweb</groupId>
            <artifactId>tongweb-lic-sdk</artifactId>
            <version>4.4.1.1</version>
        </dependency>
    </dependencies>
</project>
```

将pom中涉及的jar以及license.dat文件准备好备用。

::: tip 提示
在tongweb中ServletWebServerFactory定义优先级最高，可以不用排除nacos本身的tomcat依赖，要排除的话需要重新源码编译打包。

```java
@Configuration
// 最高优先级
@AutoConfigureOrder(Integer.MIN_VALUE)
@ConditionalOnWebApplication(
    type = Type.SERVLET
)
@EnableConfigurationProperties({TongWebProperties.class})
@Import({BeanPostProcessorsRegistrar.class, ServletContextInitializer.class})
public class LiteTongWeb {
    public LiteTongWeb() {
    }

    @Bean
    @ConditionalOnMissingBean(
        value = {ServletWebServerFactory.class},
        search = SearchStrategy.CURRENT
    )
    public TongWebServletWebServerFactory tongWebServletWebServerFactory() {
        return new TongWebServletWebServerFactory();
    }
}
```

:::

## nacos配置

根据spring的`loader.path`指定依赖库的目录，参考[startup.sh](https://github.com/alibaba/nacos/blob/2.2.0/distribution/bin/startup.sh#L115)中对loader.path的定义，
默认加载了plugins、plugins/health、plugins/cmdb、plugins/selector目录，这里使用`plugins`目录做插件加载。

```bash
JAVA_OPT="${JAVA_OPT} -Dloader.path=${BASE_DIR}/plugins,${BASE_DIR}/plugins/health,${BASE_DIR}/plugins/cmdb,${BASE_DIR}/plugins/selector"
```

1. 下载[nacos](https://github.com/alibaba/nacos/releases/tag/2.2.0)，这里以`2.2.0`版本为例
2. 将上面步骤中准备的所有jar包复制到plugins目录

    ![home][1]
    ![plugins][2]
3. 复制tongweb的license.dat文件到conf目录

    ![conf][3]
4. 修改conf/application.properties配置文件

    ```properties
    server.servlet.contextPath=/nacos
    server.error.include-message=ALWAYS
    server.port=8848
    # 1. 指定东方通授权证书路径
    server.tongweb.license.path=../conf/license.dat
    
    # 2. 修改数据源类型
    spring.datasource.platform=dm
    db.num=1
    
    # 3. 配置jdbc连接信息
    db.url.0=jdbc:dm://127.0.0.1:5236/?zeroDateTimeBehavior=convertToNull&useUnicode=true&characterEncoding=utf-8
    db.user.0=NACOS
    db.password.0=123456789
    db.pool.config.connectionTimeout=30000
    db.pool.config.validationTimeout=10000
    db.pool.config.maximumPoolSize=20
    db.pool.config.minimumIdle=2
    # 4. 设置达梦驱动类
    db.pool.config.driverClassName=dm.jdbc.driver.DmDriver
   
    # 其他配置省略...
    ```
5. 启动nacos

    ```bash
    cd nacos/bin && sh startup.sh -m standalone
    ```

[1]: /assets/2024/05-06/nacos-home.png
[2]: /assets/2024/05-06/nacos-plugins.png
[3]: /assets/2024/05-06/nacos-conf.png

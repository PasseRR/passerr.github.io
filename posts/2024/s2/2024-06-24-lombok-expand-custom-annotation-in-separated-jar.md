---
title: "Lombok独立jar扩展自定义注解"
tags: [ java, lombok ]
---

相信只要用Java语言开发的人，无论是否使用[Lombok](https://projectlombok.org/)，都应该知道Lombok。

Lombok通过Java的Annotation Processor机制，通过修改编译器的AST（Abstract Syntax Tree）来达到在编译过程中注入新的方法、字段、注解等，
编译器将修改后的AST编译成字节码，这样生成的class文件中就包含了注入的方法、字段、注解等。

Lombok支持的编译器：

- [Eclipse compiler for Java (ECJ)](https://eclipse.dev/eclipse/news/4.27/jdt.php)
- [OpenJDK Java Compiler](https://openjdk.org/groups/compiler/doc/hhgtjavac/index.html)

## 前提

在Java日常开发过程中，会在项目中声明Configuration、Component、Service、Controller等，不借助lombok的话，我们可以使用@Autowire或构造方法注入，
当注入bean很多时，构造方法参数列表就会很长不易维护，这时我们可以借助lombok的@AllArgsConstructor或@RequiredArgsConstructor，
一般我们会这样写：

::: code-group

```java [SomeController.java]

@RestController
@RequestMapping("/path")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
// swagger api标签
@Api(tags = "swagger文档标签")
public class SomeController {
    SomeService someService;

    @GetMapping
    public String echo() {
        return "echo";
    }

    @PostMapping
    public boolean save(@RequestBody SomeObject someObject) {
        return true;
    }
}
```

```java [SomeService.java]

@Service
@FieldsDefault(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class SomeService {
    SomeComponent SomeComponent;
    SomeDao someDao;

    public void doSomething() {
        this.myDao.doSomething();
    }

    public void doOtherThing() {
        this.SomeComponent.doSomething();
    }
}
```

```java [SomeComponent.java]

@Component
@FieldsDefault(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class SomeComponent {
    SomeDao someDao;

    public void doSomething() {
        this.someDao.doSomething();
    }
}
```

```java [SomeConfiguration.java]

@Configuration(proxyBeanMethods = false)
@FieldsDefault(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class SomeConfiguration {
    SomeProperties someProperties;

    @Bean
    public SomeBean someBean() {
        // 声明一些bean
        return new SomeBean(this.someProperties.getXxx());
    }
}
```

:::

如上，虽然这样写比较清晰、简单，但是每次需要加3个以上的注解还是觉得有点麻烦，本来也想了解下lombok的大概原理就想着，
我能否自定义lombok注解，分别通过`一个注解`就可以实现Controller、Service、Component、Configuration的声明呢?

假设我们定义注解功能如下：

- `@LombokSpringConfiguration`： 包含注解@Configuration、@FieldsDefault、@RequiredArgsConstructor
- `@LombokSpringComponent`：包含注解@Component、@FieldsDefault、@RequiredArgsConstructor
- `@LombokSpringService`：包含注解@Service、@FieldsDefault、@RequiredArgsConstructor
- `@LombokSpringRestController`：包含注解@RestController、@RequestMapping、@FieldsDefault、@RequiredArgsConstructor、@Api

## 搭建lombok开发环境

::: info How to work on Project Lombok yourself
Project Lombok is being developed via the [lombok git repository on github](https://github.com/projectlombok/lombok).
If you want to start development on lombok, clone the repository and run `ant eclipse` or `ant intellij`,
then open the working directory as a project in eclipse / intellij. Because the main contributors of lombok all use
eclipse,
that'll probably work a little more smoothly.

To produce a lombok jar, run `ant dist`; in general run `ant -p`; there's lots of stuff there,
including downloading various versions of java runtimes to run the test suite against, and building this website.
:::

参考[官网说明](https://projectlombok.org/contributing/contributing)，我们要对lombok做扩展开发只能clone源码。

1. [Apache Ant](https://ant.apache.org/bindownload.cgi)下载安装，自行百度、谷歌
2. 设置JDK版本11及以上
3.
克隆lombok代码并导入开发工具，本文使用的是lombok [v1.18.32](https://github.com/projectlombok/lombok/releases/tag/v1.18.32)

 ```shell
 # idea环境执行
 ant intellij
 # eclipse环境执行
 ant eclipse
 ```
4. 环境验证

    ```shell
    # lombok打包
    # 执行后dist目录有lombok.jar、lombok-1.18.32.jar、spiProcessor.jar则表示环境正常
    ant clean dist
    ```

至此，你已经准备好可以开发lombok了。

## 扩展lombok的开发

::: info Adding your own handlers and annotations to Lombok
If you want to extend lombok, we advise that you fork lombok and add handlers directly into the same place and package
that lombok's handlers are in (`lombok.javac.handlers` and `lombok.eclipse.handlers`) –
lombok does some fancy footwork to ensure various modular class loading systems don't interface with finding the lombok
classes,
but that system is not (currently) easily expanded to include separate jars.
:::

参考[官网说明及建议](https://projectlombok.org/contributing/contributing)，lombok的注解支持都是通过Java SPI机制实现的，
分别定义在`META-INF/services/lombok.javac.JavacAnnotationHandler`及
`META-INF/services/lombok.eclipse.EclipseAnnotationHandler`，
部分注解需要[lombok.javac.JavacASTVisitor](https://github.com/projectlombok/lombok/blob/v1.18.32/src/core/lombok/javac/JavacASTVisitor.java#L42)
或[lombok.eclipse.EclipseASTVisitor](https://github.com/projectlombok/lombok/blob/v1.18.32/src/core/lombok/eclipse/EclipseASTVisitor.java#L54)
来实现，比如@FieldDefaults、Val的实现。

本文是基于idea做的lombok扩展开发。

::: tip 提示
idea需要手动添加lib目录为项目依赖，File > Project Structure > Modules > Dependency > 添加lib目录
:::

### 增加spring注解依赖【可选】

将org.springframework-spring-context.jar、org.springframework-spring-web.jar复制到lib目录，并添加到项目依赖中。

若在自定义的lombok的注解上不添加@RestController、@Service、@Component、@Configuration注解，
idea无法识别被自定义注解标记的类型为Spring Bean，非强迫症可以无需设置。

### 新增ext模块

在src目录下新增`ext`模块，所有注解扩展都在这里。

![ext][1]

### 注解定义

::: code-group

```java [LombokSpringRestController.java]

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.SOURCE)
// RestController注解只是为了idea中显示bean声明、引用关系 非强迫症可以不需要
@RestController
public @interface LombokSpringRestController {
    /**
     * 默认属性可见范围
     * {@link FieldDefaults#level()}
     * @return {@link AccessLevel}
     */
    AccessLevel level() default AccessLevel.PRIVATE;
    /**
     * controller bean名称 默认为空字符串
     * @return bean名称
     */
    String name() default "";
    /**
     * RequestMapping#value 非空路径才会添加@RequestMapping注解
     * @return RequestMapping路径
     */
    String[] path() default {};
    /**
     * Swagger @Api标签 非空标签才会添加@Api注解
     * @return 接口文档标签
     */
    String[] tags() default {};
}
```

```java [LombokSpringService.java]

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.SOURCE)
// Service注解只是为了idea中显示bean声明、引用关系 非强迫症可以不需要
@Service
public @interface LombokSpringService {
    /**
     * 默认属性可见范围
     * {@link FieldDefaults#level()}
     * @return {@link AccessLevel}
     */
    AccessLevel level() default AccessLevel.PRIVATE;
    /**
     * service bean名称 默认为空字符串
     * @return bean名称
     */
    String name() default "";
}
```

```java [LombokSpringComponent.java]

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.SOURCE)
// Component注解只是为了idea中显示bean声明、引用关系 非强迫症可以不需要
@Component
public @interface LombokSpringComponent {
    /**
     * 默认属性可见范围
     * {@link FieldDefaults#level()}
     * @return {@link AccessLevel}
     */
    AccessLevel level() default AccessLevel.PRIVATE;
    /**
     * Component bean名称 默认为空字符串
     * @return bean名称
     */
    String name() default "";
}
```

```java [LombokSpringConfiguration.java]

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.SOURCE)
// Configuration注解只是为了idea中显示bean声明、引用关系 非强迫症可以不需要
@Configuration
public @interface LombokSpringConfiguration {
    /**
     * 默认属性可见范围
     * {@link FieldDefaults#level()}
     * @return {@link AccessLevel}
     */
    AccessLevel level() default AccessLevel.PRIVATE;
    /**
     * Configuration bean名称 默认为空字符串
     * @return bean名称
     */
    String name() default "";
    /**
     * 是否代理bean方法
     * @return true/false
     */
    boolean proxyBeanMethods() default true;
}
```

:::

### 编译器处理器定义

一个注解分别对应一个[JavacAnnotationHandler](https://github.com/projectlombok/lombok/blob/v1.18.32/src/core/lombok/javac/JavacAnnotationHandler.java#L43)
及[EclipseAnnotationHandler](https://github.com/projectlombok/lombok/blob/v1.18.32/src/core/lombok/eclipse/EclipseAnnotationHandler.java#L38)
处理器，
考虑当前环境只会使用javac编译器，未做出ejc编译器处理器定义实现，若有需要可以参考源码自行实现。

::: danger 注意

-
处理器需要有[@Provides](https://github.com/projectlombok/lombok/blob/v1.18.32/src/spiProcessor/lombok/spi/Provides.java#L31)
注解，否则编译打包时不会被扫描到，也不会生成spi services文件
- javac处理器包名必须为`lombok.javac.handlers`，ejc处理器包名必须为`lombok.eclipse.handlers`
  :::

::: code-group

```java [HandleLombokSpringRestController.java]
package lombok.javac.handlers;

import com.sun.tools.javac.tree.JCTree;
import com.sun.tools.javac.util.List;
import lombok.LombokSpringRestController;
import lombok.RequiredArgsConstructor;
import lombok.core.AnnotationValues;
import lombok.javac.JavacAnnotationHandler;
import lombok.javac.JavacNode;
import lombok.javac.JavacTreeMaker;
import lombok.spi.Provides;

import static lombok.javac.handlers.JavacHandlerUtil.addAnnotation;
import static lombok.javac.handlers.JavacHandlerUtil.createAnnotation;

@Provides
public class HandleLombokSpringRestController extends JavacAnnotationHandler<LombokSpringRestController> {
    private final HandleConstructor.HandleRequiredArgsConstructor argsConstructor =
        new HandleConstructor.HandleRequiredArgsConstructor();
    private final HandleFieldDefaults handleFieldDefaults = new HandleFieldDefaults();

    @Override
    public void handle(AnnotationValues<LombokSpringRestController> annotation, JCTree.JCAnnotation ast,
                       JavacNode annotationNode) {
        JavacNode typeNode = annotationNode.up();

        if (!JavacHandlerUtil.isClass(typeNode)) {
            annotationNode.addError("@LombokSpringRestController is only supported on a class.");
            return;
        }

        LombokSpringRestController instance = annotation.getInstance();
        // 字段可见性
        handleFieldDefaults.generateFieldDefaultsForType(typeNode, annotationNode, instance.level(), true, true);
        // 处理RequiredArgsConstructor注解
        argsConstructor.handle(
            createAnnotation(RequiredArgsConstructor.class, annotationNode),
            ast,
            annotationNode
        );
        JCTree.JCClassDecl td = (JCTree.JCClassDecl) typeNode.get();

        JavacTreeMaker maker = annotationNode.getTreeMaker();
        // 添加@RestController注解
        String name = instance.name();
        addAnnotation(
            td.mods,
            annotationNode,
            typeNode,
            "org.springframework.web.bind.annotation.RestController",
            name.isEmpty() ? null : maker.Assign(maker.Ident(annotationNode.toName("value")), maker.Literal(name))
        );

        // 添加@RequestMapping注解
        String[] path = instance.path();
        // 路径非空才添加
        if (path.length > 0) {
            List<JCTree.JCExpression> list = List.nil();
            for (String s : path) {
                list = list.append(maker.Literal(s));
            }
            addAnnotation(
                td.mods,
                annotationNode,
                typeNode,
                "org.springframework.web.bind.annotation.RequestMapping",
                maker.Assign(
                    maker.Ident(annotationNode.toName("value")),
                    maker.NewArray(null, List.<JCTree.JCExpression>nil(), list)
                )
            );
        }

        // 添加@Api注解
        String[] tags = instance.tags();
        if (tags.length > 0) {
            List<JCTree.JCExpression> list = List.nil();
            for (String s : tags) {
                list = list.append(maker.Literal(s));
            }
            addAnnotation(
                td.mods,
                annotationNode,
                typeNode,
                "io.swagger.annotations.Api",
                maker.Assign(
                    maker.Ident(annotationNode.toName("tags")),
                    maker.NewArray(null, List.<JCTree.JCExpression>nil(), list)
                )
            );
        }
    }
}
```

```java [HandleLombokSpringService.java]
package lombok.javac.handlers;

import com.sun.tools.javac.tree.JCTree;
import lombok.LombokSpringService;
import lombok.RequiredArgsConstructor;
import lombok.core.AnnotationValues;
import lombok.javac.JavacAnnotationHandler;
import lombok.javac.JavacNode;
import lombok.javac.JavacTreeMaker;
import lombok.spi.Provides;

import static lombok.javac.handlers.JavacHandlerUtil.addAnnotation;
import static lombok.javac.handlers.JavacHandlerUtil.createAnnotation;

@Provides
public class HandleLombokSpringService extends JavacAnnotationHandler<LombokSpringService> {
    private final HandleConstructor.HandleRequiredArgsConstructor argsConstructor =
        new HandleConstructor.HandleRequiredArgsConstructor();
    private final HandleFieldDefaults handleFieldDefaults = new HandleFieldDefaults();

    @Override
    public void handle(AnnotationValues<LombokSpringService> annotation, JCTree.JCAnnotation ast,
                       JavacNode annotationNode) {
        JavacNode typeNode = annotationNode.up();

        if (!JavacHandlerUtil.isClass(typeNode)) {
            annotationNode.addError("@LombokSpringService is only supported on a class.");
            return;
        }

        LombokSpringService instance = annotation.getInstance();
        // 字段可见性
        handleFieldDefaults.generateFieldDefaultsForType(typeNode, annotationNode, instance.level(), true, true);
        // 处理RequiredArgsConstructor注解
        argsConstructor.handle(
            createAnnotation(RequiredArgsConstructor.class, annotationNode),
            ast,
            annotationNode
        );

        JavacTreeMaker maker = annotationNode.getTreeMaker();
        // 添加@Service注解
        String name = instance.name();
        addAnnotation(
            ((JCTree.JCClassDecl) typeNode.get()).mods,
            annotationNode,
            typeNode,
            "org.springframework.stereotype.Service",
            name.isEmpty() ? null : maker.Assign(maker.Ident(annotationNode.toName("value")), maker.Literal(name))
        );
    }
}
```

```java [HandleLombokSpringComponent.java]
package lombok.javac.handlers;

import com.sun.tools.javac.tree.JCTree;
import lombok.LombokSpringComponent;
import lombok.RequiredArgsConstructor;
import lombok.core.AnnotationValues;
import lombok.javac.JavacAnnotationHandler;
import lombok.javac.JavacNode;
import lombok.javac.JavacTreeMaker;
import lombok.spi.Provides;

import static lombok.javac.handlers.JavacHandlerUtil.addAnnotation;
import static lombok.javac.handlers.JavacHandlerUtil.createAnnotation;

@Provides
public class HandleLombokSpringComponent extends JavacAnnotationHandler<LombokSpringComponent> {
    private final HandleConstructor.HandleRequiredArgsConstructor argsConstructor =
        new HandleConstructor.HandleRequiredArgsConstructor();
    private final HandleFieldDefaults handleFieldDefaults = new HandleFieldDefaults();

    @Override
    public void handle(AnnotationValues<LombokSpringComponent> annotation, JCTree.JCAnnotation ast,
                       JavacNode annotationNode) {
        JavacNode typeNode = annotationNode.up();

        if (!JavacHandlerUtil.isClass(typeNode)) {
            annotationNode.addError("@LombokSpringComponent is only supported on a class.");
            return;
        }

        LombokSpringComponent instance = annotation.getInstance();
        // 字段可见性
        handleFieldDefaults.generateFieldDefaultsForType(typeNode, annotationNode, instance.level(), true, true);
        // 处理RequiredArgsConstructor注解
        argsConstructor.handle(
            createAnnotation(RequiredArgsConstructor.class, annotationNode),
            ast,
            annotationNode
        );

        JavacTreeMaker maker = annotationNode.getTreeMaker();
        // 添加@Component注解
        String name = instance.name();
        addAnnotation(
            ((JCTree.JCClassDecl) typeNode.get()).mods,
            annotationNode,
            typeNode,
            "org.springframework.stereotype.Component",
            name.isEmpty() ? null : maker.Assign(maker.Ident(annotationNode.toName("value")), maker.Literal(name))
        );
    }
}
```

```java [HandleLombokSpringConfiguration.java]
package lombok.javac.handlers;

import com.sun.tools.javac.tree.JCTree;
import com.sun.tools.javac.util.List;
import lombok.LombokSpringConfiguration;
import lombok.RequiredArgsConstructor;
import lombok.core.AnnotationValues;
import lombok.javac.Javac;
import lombok.javac.JavacAnnotationHandler;
import lombok.javac.JavacNode;
import lombok.javac.JavacTreeMaker;
import lombok.spi.Provides;

import static lombok.javac.handlers.JavacHandlerUtil.chainDotsString;
import static lombok.javac.handlers.JavacHandlerUtil.createAnnotation;
import static lombok.javac.handlers.JavacHandlerUtil.recursiveSetGeneratedBy;

@Provides
public class HandleLombokSpringConfiguration extends JavacAnnotationHandler<LombokSpringConfiguration> {
    private final HandleConstructor.HandleRequiredArgsConstructor argsConstructor =
        new HandleConstructor.HandleRequiredArgsConstructor();
    private final HandleFieldDefaults handleFieldDefaults = new HandleFieldDefaults();

    @Override
    public void handle(AnnotationValues<LombokSpringConfiguration> annotation, JCTree.JCAnnotation ast,
                       JavacNode annotationNode) {
        JavacNode typeNode = annotationNode.up();

        if (!JavacHandlerUtil.isClass(typeNode)) {
            annotationNode.addError("@LombokSpringService is only supported on a class.");
            return;
        }

        LombokSpringConfiguration instance = annotation.getInstance();
        // 字段可见性
        handleFieldDefaults.generateFieldDefaultsForType(typeNode, annotationNode, instance.level(), true, true);
        // 处理RequiredArgsConstructor注解
        argsConstructor.handle(
            createAnnotation(RequiredArgsConstructor.class, annotationNode),
            ast,
            annotationNode
        );

        JavacTreeMaker maker = annotationNode.getTreeMaker();
        JCTree.JCModifiers mods = ((JCTree.JCClassDecl) typeNode.get()).mods;

        // 添加@Configuration注解
        List<JCTree.JCExpression> list = List.<JCTree.JCExpression>of(
            maker.Assign(
                maker.Ident(annotationNode.toName("proxyBeanMethods")),
                maker.Literal(Javac.CTC_BOOLEAN, instance.proxyBeanMethods() ? 1 : 0)
            )
        );
        String name = instance.name();
        if (!name.isEmpty()) {
            list = list.append(maker.Assign(maker.Ident(annotationNode.toName("value")), maker.Literal(name)));
        }
        JCTree.JCExpression annType =
            chainDotsString(annotationNode, "org.springframework.context.annotation.Configuration");
        JCTree.JCAnnotation anno = recursiveSetGeneratedBy(maker.Annotation(annType, list), typeNode);
        mods.annotations = mods.annotations.append(anno);
    }
}
```

:::

### Ant配置修改

文件[buildScripts/compile.ant.xml](https://github.com/projectlombok/lombok/blob/v1.18.32/buildScripts/compile.ant.xml)
中，修改ant编译、打包的配置，将ext加入编译目标中，将ext打包为独立jar包。

#### compile target

```xml

<project name="lombok.compile" default="dist" xmlns:ivy="antlib:com.zwitserloot.ivyplusplus" basedir="..">
    <target name="compile" depends="version, deps, -setup.build, create.spiProcessor, create.mavenEcjBootstrapAgent"
            description="Compiles the code">
        <ivy:compile destdir="build/lombok-main" release="9">
            <src path="src/core9"/>
            <compilerarg value="-Xlint:none"/>
            <classpath refid="cp.build"/>
        </ivy:compile>
        <!-- [!code ++:15] -->
        <!-- 自定义ext模块编译 -->
        <ivy:compile destdir="build/lombok-ext" source="1.6" target="1.6" ecj="true" nowarn="true">
            <bootclasspath path="${jdk6-rt.loc}"/>
            <src path="src/ext"/>
            <classpath path="build/lombok-utils:build/lombok-utils6:build/lombok-main:build/spiProcessor"/>
            <classpath refid="cp.javac6"/>
            <classpath refid="cp.eclipse-oxygen"/>
            <classpath refid="cp.ecj8"/>
            <classpath path="lib/org.springframework-spring-context.jar"/>
            <classpath path="lib/org.springframework-spring-web.jar"/>
            <annotationProcessor jar="dist/spiProcessor.jar" processor="lombok.spi.SpiProcessor"/>
        </ivy:compile>
        <!-- ext使用ShadowClassLoader加载 也是独立jar结合lombok的根本 -->
        <echo file="build/lombok-ext/META-INF/ShadowClassLoader">lombok</echo>

        <mkdir dir="build/lombok-main/META-INF/services"/>
        <echo file="build/lombok-main/META-INF/services/javax.annotation.processing.Processor">
            lombok.launch.AnnotationProcessorHider$AnnotationProcessor
            lombok.launch.AnnotationProcessorHider$ClaimingProcessor
        </echo>
        <mkdir dir="build/lombok-main/META-INF/gradle"/>
        <echo file="build/lombok-main/META-INF/gradle/incremental.annotation.processors">
            lombok.launch.AnnotationProcessorHider$AnnotationProcessor,isolating
            lombok.launch.AnnotationProcessorHider$ClaimingProcessor,isolating
        </echo>
    </target>
</project>
```

#### dist target

```xml

<project name="lombok.compile" default="dist" xmlns:ivy="antlib:com.zwitserloot.ivyplusplus" basedir="..">
    <target name="dist" depends="version, compile, latest-changes.build, mapstruct.compile, -deps.unpack"
            description="Builds the 'everything' lombok.jar">
        <!-- ... but manifest is not part of the ant zip task, so do that with the jar task -->
        <jar destfile="dist/lombok-${lombok.version}.jar" update="true">
            <manifest>
                <attribute name="Premain-Class" value="lombok.launch.Agent"/>
                <attribute name="Agent-Class" value="lombok.launch.Agent"/>
                <attribute name="Can-Redefine-Classes" value="true"/>
                <attribute name="Main-Class" value="lombok.launch.Main"/>
                <attribute name="Lombok-Version" value="${lombok.version}"/>
                <attribute name="Automatic-Module-Name" value="lombok"/>
            </manifest>
        </jar>
        <!-- [!code ++:36] -->
        <!-- 自定义ext模块打包 -->
        <zip destfile="dist/lombok-ext-${lombok.version}.jar">
            <!-- 不需要重命名的class -->
            <patternset id="packing.ext.entrypoints">
                <include name="lombok/*.class"/>
                <include name="META-INF/**"/>
                <exclude name="lombok/javac/**"/>
                <exclude name="lombok/eclipse/**"/>
            </patternset>
            <!-- 需要重名的class 上边定义取反 -->
            <patternset id="packing.ext.shadowed">
                <invert>
                    <patternset refid="packing.ext.entrypoints"/>
                </invert>
            </patternset>
            <fileset dir="build/lombok-ext">
                <patternset refid="packing.ext.entrypoints"/>
            </fileset>
            <mappedresources>
                <multirootfileset basedirs="build/lombok-ext">
                    <patternset refid="packing.ext.shadowed"/>
                </multirootfileset>
                <!-- 将注解处理器class文件重命名 -->
                <firstmatchmapper>
                    <globmapper from="*.class" to="SCL.lombok/*.SCL.lombok"/>
                    <identitymapper/>
                </firstmatchmapper>
            </mappedresources>
        </zip>
        <!-- 自定义ext模块源码打包 -->
        <zip destfile="dist/lombok-ext-${lombok.version}-sources.jar">
            <fileset dir="src/ext">
                <include name="lombok/*.java"/>
            </fileset>
        </zip>

        <delete file="release-timestamp.txt"/>
        <copy overwrite="true" tofile="dist/lombok.jar" file="dist/lombok-${lombok.version}.jar"/>
        <property name="lombok.dist.built" value="true"/>
    </target>
</project>
```

### 编译打包

执行`ant clean dist`后，生成文件如下：

![2][2]

### lombok编译过程Debug

开启Ant远程debug端口即可，以Windows环境为例，在Ant的bin目录创建`antdebug.bat`文件，内容如下：

```bat
set ANT_OPTS=-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=y,address=5005
call ant.bat %*
```

在执行`antdebug clean dist`后会阻塞，直到你用Remote JVM Debug连接，连接后即可debug打包注解处理器执行过程。

### lombok使用过程Debug

在你的lombok项目中使用Remote JVM Debug连接到Maven/Gradle的远程端口，添加断点就可以正常调试的扩展模块逻辑了。

::: code-group

```shell[Maven]
# 默认debug端口为8000
mvndebug clean compile
```

```shell[Gradle]
# 默认debug端口为5005
gradle task -Dorg.gradle.debug=true --no-daemon
```

:::

## 使用效果

将lombok-ext.jar及lombok-ext-sources.jar传到仓库后，maven引入即可。

```xml

<dependencies>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>${lombok.version}</version>
        <scope>provided</scope>
    </dependency>

    <!-- 这个是我们的扩展包 -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok-ext</artifactId>
        <version>${lombok.ext.version}</version>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

1. Controller源码和class文件对比
   ![3][3] ![4][4]
2. Service源码和class文件对比
   ![5][5] ![6][6]

以上，完成了一个lombok的自定义注解扩展，其实这种方式的扩展是可以做到任意你想做的事情，但是，
由于IDE环境无法识别你在编译过程中做了哪些改动，比如你添加了方法、字段，IDE是没法识别的，
这也是为什么lombok需要IDE插件来支持才能友好的提示。

当然，个人觉得，在不修改lombok IDE插件的前提做一定的扩展是挺酷的结果，如果还要修改插件才能实现的扩展就有点得不偿失了。

## 参考资料

<LinkCard
  link='https://projectlombok.org/contributing/contributing/'
  logo='https://projectlombok.org/favicon.ico'
  title="Contributing to Project Lombok's development"
  description="Project Lombok is being developed via the lombok git repository on github. If you want to start
  development on lombok, clone the repository and run ant eclipse or ant intellij, then open the working directory as a
  project in eclipse / intellij. Because the main contributors of lombok all use eclipse, that'll probably work a little
  more smoothly."
  />

<LinkCard
  link='https://bigbrotherlee.com/index.php/archives/327/'
  logo='https://bigbrotherlee.com/usr/uploads/2023/12/3699598906.ico'
  title="扩展你的lombok - 大家都叫我李哥"
  description="扩展lombok是我一直想做的一件事。本文将浅浅介绍lombok原理着重介绍如何扩展lombok。本文前置知识是抽象语法树，不过没有也没关系。"
  />

<LinkCard
  link='https://github.com/peichhorn/lombok-pg/'
  logo='https://github.com/favicon.ico'
  title="GitHub - peichhorn/lombok-pg: Collection of lombok extensions"
  description="Collection of lombok extensions. Contribute to peichhorn/lombok-pg development by creating an account on GitHub."
  />

[1]: /assets/2024/06-24/ext.png

[2]: /assets/2024/06-24/dist.png

[3]: /assets/2024/06-24/controller-java.png

[4]: /assets/2024/06-24/controller-class.png

[5]: /assets/2024/06-24/service-java.png

[6]: /assets/2024/06-24/service-class.png

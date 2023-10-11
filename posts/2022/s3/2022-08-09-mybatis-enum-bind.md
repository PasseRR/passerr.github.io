---
title:  MyBatis枚举类型绑定
tags: [mybatis, java]
---

## 前言

枚举是我个人很喜欢的一个特性，它提供更好的可读性、可维护性、安全性，有限的扩展，通过多态也可以实现枚举实例之间的一些特殊行为。

通常，我们用枚举来维护事物有限的类型，持久化到数据库时，会以一些简单的数字或字符串存储，比如颜色、状态、星期等。

假如，我们需要在代码中使用`星期`这个枚举，枚举定义如下：

```java
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Getter
public enum DayOfWeek {
    MONDAY(1, "星期一"),
    TUESDAY(2, "星期二"),
    WEDNESDAY(3, "星期三"),
    THURSDAY(4, "星期四"),
    FRIDAY(5, "星期五"),
    SATURDAY(6, "星期六"),
    SUNDAY(7, "星期日");
    
    int code;
    String name;
}
```

在代码做业务逻辑判断时，不用通过`魔法数字`， 而使用枚举实例代替使得代码更简单易读。
在实际数据库存储时，使用的是`code`，但在界面展示时，使用的是`name`，可以通过Mybatis的TypeHandler把code转为枚举实例。

简单来说，TypeHandler的作用就是java类型和jdbc类型相互转换的一个类型处理器。借助这个它的特性，
我们可以在插入/更新时，将枚举的某个属性入库，查询时，根据这个值转为枚举实例即可满足。

## 基于TypeHandler的简单实现

### 定义DayOfWeek的TypeHandler

~~~java
public class DayOfWeekTypeHandler extends BaseTypeHandler<DayOfWeek> {
    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, DayOfWeek parameter, JdbcType jdbcType)
        throws SQLException {
        ps.setObject(i, parameter.getCode());
    }

    @Override
    public DayOfWeek getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return of(rs.getInt(columnName), rs.wasNull());
    }

    @Override
    public DayOfWeek getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return of(rs.getInt(columnIndex), rs.wasNull());
    }

    @Override
    public DayOfWeek getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return of(cs.getInt(columnIndex), cs.wasNull());
    }

    protected static DayOfWeek of(Integer code, boolean wasNull) {
        // 列为null 不做转换
        if (wasNull) {
            return null;
        }

        return
            Stream.of(DayOfWeek.values())
                .filter(it -> Objects.equals(it.getCode(), code))
                .findFirst()
                .orElse(null);
    }
}
~~~

### 定义实体、Mapper

定义一个打卡实体，包含用户、打卡时间、星期，**只是为了展示枚举的使用，并不切合实际业务**。

::: code-group

```java [打卡实体]
@FieldDefaults(level = AccessLevel.PRIVATE)
@Data
@Table(name = "t_clock_in_out")
public class ClockInOut {
    Long id;
    Long userId;
    LocalDateTime clockedAt;
    /**
     * 星期 直接使用枚举类型定义列
     */
    DayOfWeek dayOfWeek;
}
```

```java [打卡Mapper]
public interface ClockInOutMapper extends BaseMapper<ClockInOut> {
}
```

:::

### 配置扩展mybatis的类型处理器

~~~java
@Configuration
public class MybatisConfigurer {
    @Bean
    ConfigurationCustomizer configurationCustomizer() {
        // 注册类型处理器
        return config -> config.getTypeHandlerRegistry().register(DayOfWeek.class, DayOfWeekTypeHandler.class);
    }
}
~~~

### 小结

这一节，我们完成了简单的枚举类型定义，也存在一个问题，实际业务开发过程中，枚举可能会定义多个，
但是mybatis的TypeHandler并不支持泛型类型，也就是说，每个枚举和TypeHandler是一一对应的，
每当我们定义一个枚举，还得自定义一个类型处理器或者ConfigurationCustomizer将枚举类型注册到类型处理器注册中心。

## 进一步改进ConfigurationCustomizer适配类型处理器

mybatis的TypeHandler支持两种方式初始化，一种是带Class的构造方法，另一种是默认构造方法。

::: details 参考代码 {open}

~~~java
public <T> TypeHandler<T> getInstance(Class<?> javaTypeClass, Class<?> typeHandlerClass) {
    // 如果指定class类型，优先去找带class的构造方法
    if (javaTypeClass != null) {
      try {
        Constructor<?> c = typeHandlerClass.getConstructor(Class.class);
        return (TypeHandler<T>) c.newInstance(javaTypeClass);
      } catch (NoSuchMethodException ignored) {
        // ignored
      } catch (Exception e) {
        throw new TypeException("Failed invoking constructor for handler " + typeHandlerClass, e);
      }
    }
    
    // 没有找到就按照默认构造方法初始化
    try {
      Constructor<?> c = typeHandlerClass.getConstructor();
      return (TypeHandler<T>) c.newInstance();
    } catch (Exception e) {
      throw new TypeException("Unable to find a usable constructor for " + typeHandlerClass, e);
    }
  }
~~~

:::

考虑，定义一个类型处理器的提供者，在mybatis配置时，根据配置提供者的值来动态注册类型处理器。

### 定义基础的类型处理器提供者

~~~java
/**
 * 类型提供器的提供者，一个类型处理器可以处理多个java类型，即Set集合
 */
public interface TypeSupplier<T> extends Supplier<Set<Class<? extends T>>> {
    /**
     * 默认类型转换处理器
     * @return {@link Class}
     */
    Class<?> defaultTypeHandlerClass();

    /**
     * 注册类型转换器
     * @param registry {@link TypeHandlerRegistry}
     */
    default void register(TypeHandlerRegistry registry) {
        Class<?> clazz = this.defaultTypeHandlerClass();
        Set<Class<? extends T>> classes = this.get();
        if (Objects.isNull(clazz) || Objects.isNull(classes)) {
            return;
        }

        classes.forEach(it -> registry.register(it, clazz));
    }
}
~~~

### 定义标识枚举的接口

因为java中所有枚举都是通过enum关键字标识，这里定义标识接口为了区分出我们想要的枚举类型。

~~~java
/**
 * 枚举标识接口
 * @param <T> 关键字类型 即存储到db的枚举属性类型
 */
public interface Enumerable<T> {
    /**
     * 获取枚举关键字
     * @return 枚举关键字
     */
    T getKey();

    /**
     * 默认key的解析序列化
     * @param key 关键字{@link #getKey()}
     * @return 序列化后的字符串
     */
    default String keySerialize(T key) {
        return String.valueOf(key);
    }

    /**
     * 枚举key序列化后的值
     * @return 序列化后的字符串
     */
    default String keyValue() {
        return this.keySerialize(this.getKey());
    }

    /**
     * 按照枚举key类型给定值获取枚举实例
     * @param clazz 枚举类型
     * @param key   key的值
     * @param <T>   key的类型
     * @param <E>   枚举类型
     * @return {@link E}
     */
    static <T, E extends Enum<?> & Enumerable<T>> E getRaw(Class<E> clazz, T key) {
        return
            Arrays.stream(clazz.getEnumConstants())
                .filter(it -> Objects.equals(it.getKey(), key))
                .findFirst()
                .orElse(null);
    }

    /**
     * 按照枚举key的字符串序列化值获取枚举实例
     * @param clazz    枚举类型
     * @param keyValue key序列化字符串
     * @param <E>      枚举类型
     * @return {@link E}
     */
    static <E extends Enum<?> & Enumerable<?>> E get(Class<E> clazz, String keyValue) {
        return
            Arrays.stream(clazz.getEnumConstants())
                .filter(it -> Objects.equals(it.keyValue(), keyValue))
                .findFirst()
                .orElse(null);
    }
}
~~~

### 定义通用的枚举类型处理器

~~~java
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EnumerableTypeHandler<T extends Enum<?> & Enumerable<?>> extends BaseTypeHandler<T> {
    Class<T> clazz;

    public EnumerableTypeHandler(Class<T> clazz) {
        this.clazz = clazz;
    }

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, T t, JdbcType jdbcType) throws SQLException {
        // 由于枚举关键字类型位置，这里按照object类型设置，建议关键字为简单类型
        ps.setObject(i, t.getKey());
    }

    @Override
    public T getNullableResult(ResultSet rs, String s) throws SQLException {
        return this.from(rs.getString(s), rs.wasNull());
    }

    @Override
    public T getNullableResult(ResultSet rs, int i) throws SQLException {
        return this.from(rs.getString(i), rs.wasNull());
    }

    @Override
    public T getNullableResult(CallableStatement cs, int i) throws SQLException {
        return this.from(cs.getString(i), cs.wasNull());
    }

    protected T from(String s, boolean wasNull) {
        // 若列为空
        if (wasNull) {
            return null;
        }

        // 非空按照关键字序列化内容比较
        return Enumerable.get(this.clazz, s);
    }
}
~~~

### 根据TypeSupplier扩展一个枚举类型处理器提供者

~~~java
@FunctionalInterface
public interface EnumTypeSupplier<T extends Enum<?> & Enumerable<?>> extends TypeSupplier<T> {
    @Override
    default Class<?> defaultTypeHandlerClass() {
        // 就是指定了枚举的类型处理器class
        return EnumerableTypeHandler.class;
    }
}
~~~

### 增加一个枚举类型

~~~java
/**
 * 定义一个性别枚举
 */
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Getter
public enum Sex implements Enumerable<Integer> {
    MALE(0, "男"),
    FEMALE(1, "女"),
    UNKNOWN(2, "未知");
    int code;
    String name;

    @Override
    public Integer getKey() {
        return this.code;
    }
}
~~~

### 按照类型处理器提供者来定义类型处理器及修改mybatis的配置

~~~java
@Configuration
public class MybatisConfigurer {
    @Bean
    ConfigurationCustomizer configurationCustomizer(ObjectProvider<List<TypeSupplier<?>>> provider) {
        // 将所有自定义类型处理器注册到注册中心
        return
            config -> {
                TypeHandlerRegistry typeHandlerRegistry = configuration.getTypeHandlerRegistry();
                provider.ifAvailable(it -> it.forEach(s -> s.register(typeHandlerRegistry)));
            };
    }

    @Bean
    EnumTypeSupplier<?> enumTypeSupplier() {
        // 需要修改DayOfWeek实现Enumerable接口
        return () -> Collections.unmodifiableSet(new HashSet<>(Arrays.asList(DayOfWeek.class, Sex.class)));
    }
}
~~~

### 小结

这一节，我们扩展了类型处理器，定义了通用的mybatis的类型处理器配置，当枚举扩展时，只需定义一个相应的
EnumTypeSupplier即可。

但是否可以自动扫描的方式实现枚举类型处理器的注入呢？

## 枚举自动发现并注入类型处理器

参考mybatis的MapperScan的实现，自定义注解配合Spring的@Import注解实现，自动扫描包下的枚举类，然后结合
EnumTypeSupplier来自动注入。

### 定义扫描注解

包含单个扫描及多个扫描，可以使用@EnumScans配置多个扫描路径，也可以多次使用@EnumScan配置多个扫描路径。

::: code-group

~~~java [@EnumScan]
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
@Repeatable(EnumScans.class)
@Import(EnumScannerRegistrar.class)
public @interface EnumScan {
    /**
     * 要扫描的基础包
     * @return 包名称
     */
    String value();
}
~~~

~~~java [@EnumScans]
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
@Import(EnumScannersRegistrar.class)
public @interface EnumScans {
    EnumScan[] value();
}
~~~

:::

### 定义枚举自动扫描Registrar

::: code-group

~~~java [EnumScannerRegistrar]
class EnumScannerRegistrar implements ImportBeanDefinitionRegistrar {
    @Override
    public void registerBeanDefinitions(AnnotationMetadata annotationMetadata, BeanDefinitionRegistry registry) {
        Optional.ofNullable(
                AnnotationAttributes.fromMap(annotationMetadata.getAnnotationAttributes(EnumScan.class.getName()))
            )
            .ifPresent(it -> this.doRegisterBeanDefinitions(annotationMetadata, it, registry, 0));
    }

    /**
     * scanner注册
     * @param annotationMetadata   {@link AnnotationMetadata}
     * @param annotationAttributes {@link AnnotationAttributes}
     * @param registry             {@link BeanDefinitionRegistry}
     * @param index                索引
     */
    protected void doRegisterBeanDefinitions(AnnotationMetadata annotationMetadata,
                                             AnnotationAttributes annotationAttributes,
                                             BeanDefinitionRegistry registry,
                                             int index) {
        String basePackage = annotationAttributes.getString("value");
        if (StringUtils.isBlank(basePackage)) {
            return;
        }
        String beanName = EnumScannerRegistrar.generateBeanName(annotationMetadata, index);

        // 注册supplier bean
        new ClassPathEnumScanner(registry).scanAndProcessSupplierDefinition(beanName, basePackage);
    }

    /**
     * 生成bean名称
     * @param annotationMetadata {@link AnnotationMetadata}
     * @param index              索引
     * @return bean名称
     */
    private static String generateBeanName(AnnotationMetadata annotationMetadata, int index) {
        return String.format("%s#%s#%d", annotationMetadata.getClassName(), EnumTypeSupplier.class.getName(), index);
    }
}
~~~

~~~java [EnumScannersRegistrar]
class EnumScannersRegistrar extends EnumScannerRegistrar {
    @Override
    public void registerBeanDefinitions(AnnotationMetadata annotationMetadata, BeanDefinitionRegistry registry) {
        Optional.ofNullable(
                AnnotationAttributes.fromMap(annotationMetadata.getAnnotationAttributes(EnumScans.class.getName()))
            )
            .ifPresent(it -> {
                AnnotationAttributes[] values = it.getAnnotationArray("value");
                IntStream.range(0, values.length)
                    .forEach(index ->
                        super.doRegisterBeanDefinitions(annotationMetadata, values[index], registry, index)
                    );
            });

    }
}
~~~

:::

### 定义枚举包扫描器

::: code-group

```java [ClassPathEnumScanner]
class ClassPathEnumScanner extends ClassPathBeanDefinitionScanner {
    ClassPathEnumScanner(BeanDefinitionRegistry registry) {
        super(registry, false);
        // 满足条件的过滤器
        super.addIncludeFilter(new AssignableTypeFilter(Enum.class) {
            @Override
            public boolean match(MetadataReader metadataReader, MetadataReaderFactory metadataReaderFactory) {
                ClassMetadata metadata = metadataReader.getClassMetadata();
                Class<?> clazz = ClassUtils.forName(metadata.getClassName());
                // 必须是枚举且实现了Enumerable接口
                return clazz.isEnum() && Enumerable.class.isAssignableFrom(clazz);
            }
        });
    }

    @Override
    protected void registerBeanDefinition(BeanDefinitionHolder definitionHolder, BeanDefinitionRegistry registry) {
        // 不做枚举bean注册
    }

    /**
     * 扫描枚举、注册supplier
     * @param beanName    supplier bean名称
     * @param basePackage 扫描包名
     */
    void scanAndProcessSupplierDefinition(String beanName, String basePackage) {
        Set<BeanDefinitionHolder> holders = super.doScan(basePackage);
        // 未找到满足条件的枚举
        if (CollectionUtils.isEmpty(holders)) {
            return;
        }

        BeanDefinitionRegistry registry = super.getRegistry();
        if (Objects.isNull(registry)) {
            return;
        }

        AbstractBeanDefinition definition =
            // 扩展EnumTypeSupplier实现类
            BeanDefinitionBuilder.genericBeanDefinition(ScannedEnumTypeSupplier.class)
                // 通过构造方法构造EnumTypeSupplier
                .addConstructorArgValue(
                    holders.stream()
                        .map(BeanDefinitionHolder::getBeanDefinition)
                        .map(BeanDefinition::getBeanClassName)
                        .map(ClassUtils::forName)
                        .collect(Collectors.toSet())
                )
                .setScope(ConfigurableBeanFactory.SCOPE_SINGLETON)
                .setAutowireMode(AbstractBeanDefinition.AUTOWIRE_BY_NAME)
                .getBeanDefinition();

        // 注入实例
        registry.registerBeanDefinition(beanName, definition);
    }
}
```

~~~java [ScannedEnumTypeSupplier]
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
class ScannedEnumTypeSupplier<T extends Enum<?> & Enumerable<?>> implements EnumTypeSupplier<T> {
    Set<Class<? extends T>> set;

    @Override
    public Set<Class<? extends T>> get() {
        return this.set;
    }
}
~~~

:::

### 实际使用

```java
@SpringBootApplication
@EnumScan("com.project.module")
@EnumScan("com.project2.module")
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(PostgresRedisApplication.class, args);
    }
}
```

### 小结

通过一个简单的枚举自定义类型处理器的实现，逐步简化配置，最后达到跟SpringBoot理念一致的简单配置即可用。

## 总结

以上，完成了整个对枚举处理的类型的自动配置，当然还存在一些其他问题未处理。

- mvc的路径参数处理

    可以结合ConverterFactory、Converter、ConversionService来处理

- jackson对自定义枚举的序列化与反序列化

    可以结合BeanSerializerModifier、BeanDeserializerModifier处理枚举的序列化与反序列化

- swagger对自定义枚举的友好展示

    可以参考[Swagger统一应答类型处理](2022-07-04-swagger-common-response.md)实现

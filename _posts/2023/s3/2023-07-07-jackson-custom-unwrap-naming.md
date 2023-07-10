---
layout: post
title:  "自定义@JsonUnwrapped注解实现任意命名风格"
categories: [java]
last_modified_at: 2023-07-07
toc: true
---

## [@JsonUnwrapped](https://github.com/FasterXML/jackson-annotations/blob/master/src/main/java/com/fasterxml/jackson/annotation/JsonUnwrapped.java){:target="_blank"}的作用？

参考[Jackson注解](../s2/2023-05-04-jackson-annotations.md#jsonunwrapped){:target="_blank"}对@JsonUnwrapped的介绍，
简单来说，该注解的作用就是在json序列化与反序列化时，将嵌套对象的属性平铺到一层。

> **注意**
> 
> JsonUnwrapped仅支持对普通java对象(POJO)展开，类似Map、Map.Entry是不支持的。
{: .block-warning }

JsonUnwrapped提供三个属性配置
- enable：是否启用，jackson注解大多有这个属性，就是注解是否生效
- prefix：展开的属性拼接前缀
- suffix：展开属性拼接后缀

```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Bean {
        @JsonUnwrapped(prefix = "user")
        Name name;
        int age;
    }

    @Data
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Accessors(chain = true)
    static class Name {
        String firstName;
        String lastName;
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        Bean bean = new Bean();
        bean.setName(new Name().setFirstName("张").setLastName("三"));
        bean.setAge(1);
        String json = objectMapper.writeValueAsString(bean);
        // 序列化输出
        System.out.println(json);
        // 反序列化输出
        System.out.println(objectMapper.readValue(json, Bean.class));
    }
}
```

输出结果

```bash
{"userfirstName":"张","userlastName":"三","age":1}
Test.Bean(name=Test.Name(firstName=张, lastName=三), age=1)
```

当我们用到多个内嵌对象，内嵌对象存在相同属性名称时，这时候需要配合前缀/后缀来区分展开的属性属于哪个内嵌对象的属性。
但jackson在加前缀或者后缀时，并未对命名策略支持，当然，这个并不影响json本身的序列化与反序列化，非强迫症患者可以忽略以下内容。

## @JsonUnwrapped是怎么实现的？

在[PropertyBuilder](https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/ser/PropertyBuilder.java#L235){:target="_blank"}和[BeanDeserializerBase](https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/deser/BeanDeserializerBase.java#L560){:target="_blank"}
中都使用了来自AnnotationIntrospector的方法[findUnwrappingNameTransformer](https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/AnnotationIntrospector.java#L616){:target="_blank"}。 
该方法返回了一个[NameTransformer](https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/util/NameTransformer.java#L104-L114){:target="_blank"}，如果为null则表示不进行展开序列化/反序列化，否则按照返回的转换器进行名称转换。
即如何将未展开的属性转换为展开后的属性名称方式以及如何将已展开的属性还原为未展开的属性名称。

我们看看默认的命名转换是怎么定义的。

```java
// com.fasterxml.jackson.databind.introspect.JacksonAnnotationIntrospector
public class JacksonAnnotationIntrospector extends AnnotationIntrospector implements java.io.Serializable{
    @Override
    public NameTransformer findUnwrappingNameTransformer(AnnotatedMember member)
    {
        // 找一下存不存在JsonUnwrapped注解
        JsonUnwrapped ann = _findAnnotation(member, JsonUnwrapped.class);
        // if not enabled, just means annotation is not enabled; not necessarily
        // that unwrapping should not be done (relevant when using chained introspectors)
        // 注解不存在或者未启用 返回null 即不做unwrap
        if (ann == null || !ann.enabled()) {
            return null;
        }
        String prefix = ann.prefix();
        String suffix = ann.suffix();
        // 拿到前缀和后缀 构造名称转换器
        return NameTransformer.simpleTransformer(prefix, suffix);
    }
}

// com.fasterxml.jackson.databind.util.NameTransformer
public abstract class NameTransformer {
    public static NameTransformer simpleTransformer(final String prefix, final String suffix) {
        // 前缀、后缀是否存在
        boolean hasPrefix = (prefix != null) && !prefix.isEmpty();
        boolean hasSuffix = (suffix != null) && !suffix.isEmpty();

        // 根据前缀、后缀是否存在构造不同的名称转换器
        // 序列化的时候会调用transform生成展开的属性名称
        // 反序列化的时候调用reverse方法将展开的属性名称还原为原属性名称
        if (hasPrefix) {
            if (hasSuffix) {
                return new NameTransformer() {
                    @Override
                    public String transform(String name) {
                        // 这里可以看到 前缀、属性名、后缀是直接拼起来的 并未做命名策略处理
                        return prefix + name + suffix;
                    }

                    @Override
                    public String reverse(String transformed) {
                        if (transformed.startsWith(prefix)) {
                            String str = transformed.substring(prefix.length());
                            if (str.endsWith(suffix)) {
                                return str.substring(0, str.length() - suffix.length());
                            }
                        }
                        return null;
                    }

                    @Override
                    public String toString() {
                        return "[PreAndSuffixTransformer('" + prefix + "','" + suffix + "')]";
                    }
                };
            }
            return new NameTransformer() {
                @Override
                public String transform(String name) {
                    return prefix + name;
                }

                @Override
                public String reverse(String transformed) {
                    if (transformed.startsWith(prefix)) {
                        return transformed.substring(prefix.length());
                    }
                    return null;
                }

                @Override
                public String toString() {
                    return "[PrefixTransformer('" + prefix + "')]";
                }
            };
        }
        if (hasSuffix) {
            return new NameTransformer() {
                @Override
                public String transform(String name) {
                    return name + suffix;
                }

                @Override
                public String reverse(String transformed) {
                    if (transformed.endsWith(suffix)) {
                        return transformed.substring(0, transformed.length() - suffix.length());
                    }
                    return null;
                }

                @Override
                public String toString() {
                    return "[SuffixTransformer('" + suffix + "')]";
                }
            };
        }
        return NOP;
    }
}
```

## Jackson的命名风格

Jackson支持默认支持7种命名风格，参考[PropertyNamingStrategies](https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/PropertyNamingStrategies.java#L36-L89){:target="_blank"}，命名转换的定义。

所有命名规则都是基于LOWER_CAMEL_CASE进行转换，也就是代码里面的属性必须是驼峰的，否则转换可能不是你想要的结果。

| 名称               | 描述      | 示例                                              |
|:-----------------|:--------|:------------------------------------------------|
| LOWER_CAMEL_CASE | 首字母小写驼峰 | numberValue、namingStrategy、theDefiniteProof     |
| UPPER_CAMEL_CASE | 首字母大写驼峰 | NumberValue、NamingStrategy、TheDefiniteProof     |
| SNAKE_CASE       | 小写下划线分隔 | number_value、naming_strategy、the_definite_proof |
| UPPER_SNAKE_CASE | 大写下划线分隔 | NUMBER_VALUE、NAMING_STRATEGY、THE_DEFINITE_PROOF |
| LOWER_CASE       | 全小写     | numbervalue、namingstrategy、thedefiniteproof     |
| KEBAB_CASE       | 小写中线分隔  | number-value、naming-strategy、the-definite-proof |
| LOWER_DOT_CASE   | 小写点分隔   | number.value、naming.strategy、the.definite.proof |


## 自定义JsonUnwrapped命名实现

基于Jackson本身的属性命名策略实现，做自定义增强JsonUnwrapped注解，自定义AnnotationIntrospector重写
findUnwrappingNameTransformer方法，在定义ObjectMapper时设置我们自定义的AnnotationIntrospector即可。

### 自定义增强JsonUnwrapped注解

```java
@Target({ElementType.FIELD, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@JacksonAnnotationsInside
public @interface EnhancedJsonUnwrapped {
    /**
     * 展开前缀
     * @return 前缀
     */
    String prefix() default "";
    /**
     * 展开属性后缀
     * @return 后缀
     */
    String suffix() default "";
    /**
     * 命名策略 默认为驼峰
     * @return {@link Class}
     */
    Class<? extends PropertyNamingStrategies.NamingBase> strategy() default PropertyNamingStrategies.LowerCamelCaseStrategy.class;
}
```

### 自定义NameTransformer

```java
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EnhancedUnwrappedNameTransformer extends NameTransformer {
    /**
     * 前缀
     */
    String prefix;
    /**
     * 后缀
     */
    String suffix;
    /**
     * 命名策略
     */
    PropertyNamingStrategies.NamingBase strategy;

    public EnhancedUnwrappedNameTransformer(String prefix, String suffix,
                                            Class<? extends PropertyNamingStrategies.NamingBase> klass) {
        this.prefix = prefix;
        this.suffix = suffix;
        this.strategy = ClassUtil.createInstance(klass, true);
    }

    @Override
    public String transform(String name) {
        StringBuilder sb = new StringBuilder(name);

        // 存在前缀
        if (StringUtils.isNotEmpty(this.prefix)) {
            // 只要存在前缀 则将当前name第一个字母变大写 保证前缀+name为小写驼峰
            sb.setCharAt(0, Character.toUpperCase(sb.charAt(0)));
            // 开始位置插入前缀
            sb.insert(0, prefix);
        }

        // 存在后缀 
        if (StringUtils.isNotEmpty(suffix)) {
            // 将后缀转为小写驼峰
            sb.append(Character.toUpperCase(suffix.charAt(0))).append(suffix.substring(1));
        }

        return this.strategy.translate(sb.toString());
    }

    @Override
    public String reverse(String transformed) {
        // jackson reverse方法并没有使用 序列化的时候 直接使用transform方法
        // 反序列化的时候 会先把属性名按照transform结果先rename一次
        // 参考 https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/deser/impl/UnwrappedPropertyHandler.java#L33-L51
        // 原样返回
        return transformed;
    }
}
```

### 自定义AnnotationIntrospector

```java
public class EnhancedJacksonAnnotationIntrospector extends JacksonAnnotationIntrospector {
    @Override
    public NameTransformer findUnwrappingNameTransformer(AnnotatedMember member) {
        EnhancedJsonUnwrapped annotation = super._findAnnotation(member, EnhancedJsonUnwrapped.class);
        // 没有EnhancedJsonUnwrapped注解 按照JsonUnwrapped注解规则处理
        if (Objects.isNull(annotation)) {
            return super.findUnwrappingNameTransformer(member);
        }

        // 返回增强的unwrap命名转换
        return new EnhancedUnwrappedNameTransformer(annotation.prefix(), annotation.suffix(), annotation.strategy());
    }
}
```

### ObjectMapper初始化配置

```java
// 设置注解内省为我们自定义的 最好在全局实例上设置
objectMapper.setAnnotationIntrospector(new EnhancedJacksonAnnotationIntrospector());
```

## 效果展示

### LOWER_CAMEL_CASE(默认)
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Bean {
        // 默认命名风格就是小写驼峰
        @EnhancedJsonUnwrapped(prefix = "user")
        Name name;
        int age;
    }

    @Data
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Accessors(chain = true)
    static class Name {
        String firstName;
        String lastName;
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.setAnnotationIntrospector(new EnhancedJacksonAnnotationIntrospector());
        Bean bean = new Bean();
        bean.setName(new Name().setFirstName("张").setLastName("三"));
        bean.setAge(1);
        String json = objectMapper.writeValueAsString(bean);
        // 序列化输出
        System.out.println(json);
        // 反序列化输出
        System.out.println(objectMapper.readValue(json, Bean.class));
    }
}
```

输出结果

```bash
{"userFirstName":"张","userLastName":"三","age":1}
TestController.Bean(name=TestController.Name(firstName=张, lastName=三), age=1)
```

### LOWER_DOT_CASE

```java
@FieldDefaults(level = AccessLevel.PRIVATE)
@Data
static class Bean {
    // 指定unwrap命名风格
    @EnhancedJsonUnwrapped(prefix = "user", strategy = PropertyNamingStrategies.LowerDotCaseStrategy.class)
    Name name;
    int age;
}
```

输出结果

```bash
{"user.first.name":"张","user.last.name":"三","age":1}
TestController.Bean(name=TestController.Name(firstName=张, lastName=三), age=1)
```

其他命名风格不在一一展示，主要目的是为了实现JsonUnwrapped支持小写驼峰，其他命名规则只是jackson刚好支持，就默认做了这个扩展。

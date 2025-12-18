---
title:  Jackson注解
tags: [jackson, java]
---

Jackson的注解主要在[jackson-annotations](https://github.com/FasterXML/jackson-annotations)
及[jackson-databind](https://github.com/FasterXML/jackson-databind)中，主要分为以下几种类型

| 类型         | 作用                             | 示例                        |
|:-----------|:-------------------------------|:--------------------------|
| 序列化、反序列化注解 | 同时影响序列化和反序列化过程                 | @JsonIgnore、@JsonProperty |
| 仅序列化注解     | 仅影响对象序列化过程                     | @JsonGetter、@JsonValue    |
| 仅反序列化注解    | 仅影响json反序列化对象过程                | @JonsSetter、@JsonCreator  | 
| 元注解        | 用于将多个注解组合为一个容器注解的元注解或仅有标记作用的注解 | @JacksonAnnotationsInside |

## 序列化、反序列化注解

序列化、反序列化注解有的是一个注解就同时影响序列化与反序列化，有的是一对注解分别来分别控制。

### @JsonAnyGetter/@JsonAnySetter

- [@JsonAnyGetter](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonAnyGetter.java)：将带有JsonAnyGetter注解的方法返回map序列化为json的其他属性(平铺)
    - 一个bean中`只能有一个属性/方法`带有@JsonAnyGetter注解，多个会报错
    - 方法`只能返回Map类型`
- [@JsonAnySetter](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonAnySetter.java)：将json中bean不能匹配的属性使用注解方法、pojo字段或map类型字段反序列化
    - 一个bean中`只能有一个属性/方法`带有@JsonAnySetter注解，多个会报错

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Bean {
        String name;
        /**
         * 必须在getter方法上 且返回的必须是Map类型
         * 这里借助lombok在getter上添加@JsonAnyGetter注解
         */
        @Getter(onMethod_ = @JsonAnyGetter)
        @JsonAnySetter
        Map<String, Object> map = new HashMap<>();

        /**
         * 也可以使用一个属性设置方法
         */
//        @JsonAnySetter
//        public void setProperty(String key, Object value) {
//            this.map.put(key, value);
//        }
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        Bean bean = new Bean();
        bean.setName("test");
        Map<String, Object> map = new HashMap<>();
        map.put("attr1", 1);
        map.put("attr2", false);
        map.put("attr3", "attribute");

        bean.setMap(map);
        String json = objectMapper.writeValueAsString(bean);
        // 序列化输出
        System.out.println(json);
        // 反序列化输出
        System.out.println(objectMapper.readValue(json, Bean.class));
    }
}
```

输出结果

```console
{"name":"test","attr2":false,"attr1":1,"attr3":"attribute"}
Test.Bean(name=test, map={attr2=false, attr1=1, attr3=attribute})
```

:::

### @JsonAutoDetect

[@JsonAutoDetect](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonAutoDetect.java)可以在序列化、反序列化时包含不可访问的属性，即使没有getter、setter，**需要bean有默认构造方法**。

::: details 代码示例
```java
public class Test {
    // 借助lombok私有属性
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @ToString
    @JsonAutoDetect(fieldVisibility = JsonAutoDetect.Visibility.ANY)
    static class Bean {
        String name;
        int age;

        /**
         * 工厂方法
         * @param name name
         * @param age  age
         * @return {@link Bean}
         */
        public static Bean of(String name, int age) {
            Bean bean = new Bean();
            bean.name = name;
            bean.age = age;

            return bean;
        }
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        Bean bean = Bean.of("张三", 1);
        String json = objectMapper.writeValueAsString(bean);
        // 序列化输出
        System.out.println(json);
        // 反序列化输出
        System.out.println(objectMapper.readValue(json, Bean.class));
    }
}
```

输出结果

```console
{"name":"张三","age":1}
Test.Bean(name=张三, age=1)
```

:::

### @JsonValue/@JsonCreator

- [@JsonValue](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonValue.java)：使用单个方法/字段序列化对象
    - 一个bean中`只能有一个属性/方法`带有@JsonValue注解，多个会报错
- [@JsonCreator](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonCreator.java)：指定反序列化使用的构造方法或工厂方法，如果是对象类型可以结合@JsonProperty使用

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Bean {
        String name;
        int age;
        Sex sex;
    }

    enum Sex {
        MALE,
        FEMALE;

        @JsonValue
        public int value() {
            return super.ordinal();
        }

        @JsonCreator
        public static Sex of(int index) {
            return Sex.values()[index];
        }
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        Bean bean = new Bean();
        bean.setName("张三");
        bean.setAge(1);
        bean.setSex(Sex.MALE);
        String json = objectMapper.writeValueAsString(bean);
        // 序列化输出
        System.out.println(json);
        // 反序列化输出
        System.out.println(objectMapper.readValue(json, Bean.class));
    }
}
```

输出结果

```console
{"name":"张三","age":1,"sex":0}
Test.Bean(name=张三, age=1, sex=MALE)
```

:::

### @JsonFormat

[@JsonFormat](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonFormat.java)用于指定任意类型序列化和反序列化格式，常用于日期(Date**不是java8的time**)、枚举。

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Bean {
        String name;
        int age;
        Sex sex;
        State state;
        @JsonFormat(pattern = "yyyy-MM-dd")
        Date birthDate;
        Date hireDate;
    }

    @JsonFormat(shape = JsonFormat.Shape.NUMBER)
    enum Sex {
        MALE,
        FEMALE
    }

    @JsonFormat(shape = JsonFormat.Shape.OBJECT)
    @FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
    @RequiredArgsConstructor
    @Getter
    enum State {
        ENABLE(1, "可用"),
        DISABLE(0, "不可用");

        int code;
        String name;

        /**
         * 枚举反序列化 如果是对象类型结合@JsonProperty使用
         * @param code code
         * @return {@link State}
         */
        @JsonCreator
        public static State valueOf(@JsonProperty("code") int code) {
            return code == 1 ? ENABLE : DISABLE;
        }
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        Bean bean = new Bean();
        bean.setName("张三");
        bean.setAge(1);
        bean.setSex(Sex.MALE);
        bean.setState(State.ENABLE);
        // yyyy-MM-dd格式 会有时区问题
        bean.setBirthDate(new Date());
        // 默认时间戳格式
        bean.setHireDate(new Date());
        String json = objectMapper.writeValueAsString(bean);
        // 序列化输出
        System.out.println(json);
        // 反序列化输出
        System.out.println(objectMapper.readValue(json, Bean.class));
    }
}
```

结果输出

```console
{"name":"张三","age":1,"sex":0,"state":{"code":1,"name":"可用"},"birthDate":"2023-05-19","hireDate":1684466029274}
Test.Bean(name=张三, age=1, sex=MALE, state=ENABLE, birthDate=Fri May 19 08:00:00 CST 2023, hireDate=Fri May 19 11:13:49 CST 2023)
```

:::

### @JsonGetter/@JsonSetter

- [@JsonGetter](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonGetter.java): 指定一个非静态、无参、返回值非void的方法为序列化的getter方法
- [@JsonSetter](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonSetter.java): 指定一个非静态、单个参数的方法为反序列化的setter方法

::: details 代码示例
```java
public class Test {
    // 借助lombok私有属性
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @ToString
    static class Bean {
        String name;
        int age;

        @JsonGetter("name")
        public String getUserName() {
            return this.name;
        }

        @JsonGetter("age")
        public int getUserAge() {
            return age;
        }

        @JsonSetter("name")
        public void setUserName(String userName) {
            this.name = userName;
        }

        @JsonSetter("age")
        public void setUserAge(int userAge) {
            this.age = userAge;
        }
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        Bean bean = new Bean();
        bean.setUserName("张三");
        bean.setUserAge(10);
        String json = objectMapper.writeValueAsString(bean);
        // 序列化输出 以@JsonGetter序列化
        System.out.println(json);
        // 反序列化输出 以@JsonSetter反序列化
        System.out.println(objectMapper.readValue(json, Bean.class));
    }
}
```

结果输出

```console
{"age":10,"name":"张三"}
Test.Bean(name=张三, age=10)
```

:::

### @JsonIgnore

[@JsonIgnore](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonIgnore.java)用于忽略序列化及反序列化，可将注解放在字段、setter、getter上都可以达到忽略的目的。

::: details 代码示例
```java
public class Test {
    // 借助lombok私有属性
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Bean {
        // 借助getter添加注解
        @Getter(onMethod_ = @JsonIgnore)
        String name;
        // 借助setter添加注解
        @Setter(onMethod_ = @JsonIgnore)
        Integer age;
        // 作用于字段
        @JsonIgnore
        String sex;
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        // 若序列化对象没有属性 不抛异常
        objectMapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
        Bean bean = new Bean();
        bean.setName("张三");
        bean.setAge(10);
        bean.setSex("male");
        String json = objectMapper.writeValueAsString(bean);
        // 序列化输出
        System.out.println(json);
        // 反序列化输出
        System.out.println(objectMapper.readValue("{\"name\": \"张三\", \"age\": 1, \"sex\": \"male\"}", Bean.class));
    }
}
```

输出结果

```console
{}
Test.Bean(name=null, age=null, sex=null)
```

:::

### @JsonIgnoreProperties

[@JsonIgnoreProperties](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonIgnoreProperties.java)作用于class用于忽略多个字段的序列化与反序列化

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    // 借助lombok定义字段名
    @FieldNameConstants
    @JsonIgnoreProperties({Bean.Fields.name, Bean.Fields.age})
    static class Bean {
        String name;
        Integer age;
        String sex;
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        Bean bean = new Bean();
        bean.setName("张三");
        bean.setAge(10);
        bean.setSex("male");
        String json = objectMapper.writeValueAsString(bean);
        // 序列化输出
        System.out.println(json);
        // 反序列化输出
        System.out.println(objectMapper.readValue(json, Bean.class));
    }
}
```

结果输出

```console
{"age":10,"sex":"male"}
Test.Bean(name=null, age=10, sex=male)
```

:::

### @JsonIgnoreType

[@JsonIgnoreType](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonIgnoreType.java)用于标记某个类型忽略其序列化与反序列化

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Bean {
        String name;
        int age;
        Sex sex;
    }

    @JsonIgnoreType
    enum Sex {
        MALE,
        FEMALE
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        Bean bean = new Bean();
        bean.setName("张三");
        bean.setAge(1);
        bean.setSex(Sex.MALE);
        String json = objectMapper.writeValueAsString(bean);
        // 序列化输出
        System.out.println(json);
        // 反序列化输出
        System.out.println(objectMapper.readValue("{\"name\":\"张三\",\"age\":1, \"sex\": \"MALE\"}", Bean.class));
    }
}
```

输出结果

```console
{"name":"张三","age":1}
Test.Bean(name=张三, age=1, sex=null)
```

:::

### @JsonProperty

[@JsonProperty](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonProperty.java)
用于标记非静态方法、字段作为json属性

- 标记属性时，表示序列化、反序列化都使用给定属性
- 标记getter方法时，表示序列化使用给定属性
- 标记setter方法时，表示反序列化使用给定属性
- 标记枚举实例时，表示序列化、反序列化枚举都使用给定属性

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Bean {
        @JsonProperty("realName")
        String name;
        int age;
        Sex sex;

        @JsonProperty("myAge")
        public int getAge() {
            return age;
        }

        @JsonProperty("age")
        public void setAge(int age) {
            this.age = age;
        }
    }

    enum Sex {
        @JsonProperty("男") MALE,
        @JsonProperty("女") FEMALE
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        Bean bean = new Bean();
        bean.setName("张三");
        bean.setAge(1);
        bean.setSex(Sex.MALE);
        String json = objectMapper.writeValueAsString(bean);
        // 序列化输出
        System.out.println(json);
        // 反序列化输出
        System.out.println(objectMapper.readValue("{\"sex\":\"男\",\"realName\":\"张三\",\"age\":1}", Bean.class));
    }
}
```

输出结果

```console
{"sex":"男","realName":"张三","myAge":1}
Test.Bean(name=张三, age=1, sex=MALE)
```

:::

### @JsonUnwrapped

[@JsonUnwrapped](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonUnwrapped.java)
在序列化时将嵌套对象属性放到父对象，反序列化时将父对象属性解析到嵌套对象属性，支持属性的前缀、后缀，但扩展的前缀不支持驼峰

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Bean {
        @JsonUnwrapped
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

```console
{"firstName":"张","lastName":"三","age":1}
Test.Bean(name=Test.Name(firstName=张, lastName=三), age=1)
```

:::

### @JsonSerialize/@JsonDeserialize

- [@JsonSerialize](https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/annotation/JsonSerialize.java)用于自定义序列化，针对特定类型作为属性、map的key、map的value定义
- [@JsonDeserialize](https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/annotation/JsonDeserialize.java)用于自定义反序列化，针对特定类型作为属性、map的key、map的value定义

::: details 代码示例
以简单的Date序列化与反序列化为例

```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Bean {
        String name;
        int age;
        @JsonSerialize(using = DateSerializer.class)
        @JsonDeserialize(using = DateDeserializer.class)
        Date birthDate;
    }

    static class DateSerializer extends StdSerializer<Date> {
        public DateSerializer() {
            super(Date.class);
        }

        @Override
        public void serialize(Date value, JsonGenerator gen, SerializerProvider provider) throws IOException {
            gen.writeString(new SimpleDateFormat("yyyy-MM-dd").format(value));
        }
    }

    static class DateDeserializer extends StdDeserializer<Date> {
        public DateDeserializer() {
            super(Date.class);
        }

        @Override
        public Date deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JsonProcessingException {
            try {
                return new SimpleDateFormat("yyyy-MM-dd").parse(p.getValueAsString());
            } catch (ParseException e) {
                return null;
            }
        }
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        Bean bean = new Bean();
        bean.setName("张三");
        bean.setAge(18);
        bean.setBirthDate(new Date(System.currentTimeMillis()));
        String json = objectMapper.writeValueAsString(bean);
        // 序列化输出
        System.out.println(json);
        // 反序列化输出
        System.out.println(objectMapper.readValue(json, Bean.class));
    }
}
```

输出结果

```console
{"name":"张三","age":18,"birthDate":"2023-06-02"}
Test.Bean(name=张三, age=18, birthDate=Fri Jun 02 00:00:00 CST 2023)
```

:::

## 仅序列化注解

### @JsonInclude

[@JsonInclude](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonInclude.java)
用与在序列化时排除一些具有`NULL`/`EMPTY`/`DEFAULT`/自定义条件的属性

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Bean {
        String name;
        // 忽略基本类型的默认值
        @JsonInclude(JsonInclude.Include.NON_DEFAULT)
        int age;
        // 忽略null
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Date birthDate;
        List<Integer> list = Arrays.asList(1, 2, 3);
        // 忽略空集合
        @JsonInclude(JsonInclude.Include.NON_EMPTY)
        List<Integer> list1 = Collections.emptyList();
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper withoutAnnotation = new ObjectMapper(), origin = new ObjectMapper();
        // 禁用注解
        withoutAnnotation.disable(MapperFeature.USE_ANNOTATIONS);
        Bean bean = new Bean();
        bean.setName("张三");
        // 禁用注解序列化输出
        System.out.println(withoutAnnotation.writeValueAsString(bean));
        // 包含注解序列化输出
        System.out.println(origin.writeValueAsString(bean));
    }
}
```

输出结果

```console
{"name":"张三","age":0,"birthDate":null,"list":[1,2,3],"list1":[]}
{"name":"张三","list":[1,2,3]}
```

:::

### @JsonIncludeProperties

[@JsonIncludeProperties](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonIncludeProperties.java)
用于一个类型序列化时仅包含给定的属性

- 如果使用了@JsonInclude，结果是@JsonIncludeProperties属性列表的子集

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    @JsonIncludeProperties({"age", "list1", "name", "birthDate"})
    static class Bean {
        String name;
        // 忽略基本类型的默认值
        @JsonInclude(JsonInclude.Include.NON_DEFAULT)
        int age;
        Date birthDate;
        List<Integer> list = Arrays.asList(1, 2, 3);
        // 忽略空集合
        @JsonInclude(JsonInclude.Include.NON_EMPTY)
        List<Integer> list1 = Collections.emptyList();
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper withoutAnnotation = new ObjectMapper(), origin = new ObjectMapper();
        // 禁用注解
        withoutAnnotation.disable(MapperFeature.USE_ANNOTATIONS);
        Bean bean = new Bean();
        bean.setName("张三");
        // 禁用注解序列化输出
        System.out.println(withoutAnnotation.writeValueAsString(bean));
        // 包含注解序列化输出
        System.out.println(origin.writeValueAsString(bean));
    }
}
```

输出结果

```console
{"name":"张三","age":0,"birthDate":null,"list":[1,2,3],"list1":[]}
# age为默认值被排除 list1为空被排除
{"name":"张三","birthDate":null}
```

:::

### @JsonKey

[@JsonKey](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonKey.java)
用于当对象作为map的key时，使用标记的字段作为key

- 一个对象中，`只能有一个`@JsonKey注解在字段或者getter上，多个会报错。

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Bean {
        @JsonKey
        @JsonValue
        String name;
        int age;
        Date birthDate;
    }

    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Outer {
        Bean bean;
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        Bean bean = new Bean();
        bean.setName("张三");
        bean.setAge(11);
        Outer outer = new Outer();
        outer.setBean(bean);
        // 包含注解序列化输出
        System.out.println(mapper.writeValueAsString(outer));
        // 当作为map的key时
        System.out.println(mapper.writeValueAsString(Collections.singletonMap(bean, "value")));
    }
}
```

输出结果

```console
{"bean":"张三"}
{"张三":"value"}
```

:::

### @JsonPropertyOrder

[@JsonPropertyOrder](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonPropertyOrder.java)
用于控制序列化时属性顺序

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    @JsonPropertyOrder(value = "name", alphabetic = true)
    static class Bean {
        int age;
        String name;
        @JsonInclude
        Date birthDate;
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper withoutAnnotation = new ObjectMapper(), origin = new ObjectMapper();
        // 禁用注解
        withoutAnnotation.disable(MapperFeature.USE_ANNOTATIONS);
        Bean bean = new Bean();
        bean.setName("张三");
        bean.setAge(11);
        // 默认按照字段顺序
        System.out.println(withoutAnnotation.writeValueAsString(bean));
        // name排第一，剩余按照字母顺序
        System.out.println(origin.writeValueAsString(bean));
    }
}
```

输出结果

```console
{"age":11,"name":"张三","birthDate":null}
{"name":"张三","age":11,"birthDate":null}
```

:::

### @JsonRawValue

[@JsonRawValue](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonRawValue.java)
按照属性原始值直接序列化，不做任何改变

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Bean {
        int age;
        @JsonRawValue
        String name;
        @JsonInclude
        Date birthDate;
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper withoutAnnotation = new ObjectMapper(), origin = new ObjectMapper();
        // 禁用注解
        withoutAnnotation.disable(MapperFeature.USE_ANNOTATIONS);
        Bean bean = new Bean();
        bean.setName("{\"firstName\": \"张\", \"lastName\": \"三\"}");
        bean.setAge(11);
        // 当作字符串处理
        System.out.println(withoutAnnotation.writeValueAsString(bean));
        // 不做任何处理
        System.out.println(origin.writeValueAsString(bean));
    }
}
```

输出结果

```console
{"age":11,"name":"{\"firstName\": \"张\", \"lastName\": \"三\"}","birthDate":null}
{"age":11,"name":{"firstName": "张", "lastName": "三"},"birthDate":null}
```

:::

## 仅反序列化注解

### @JsonAlias

[@JsonAlias](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonAlias.java)
用于一个属性可以使用一个或多个别名反序列化，若json中存在多个别名属性，按照json读取顺序覆盖，即使是null

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Bean {
        int age;
        @JsonAlias("anotherName")
        String name;
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        // null的时候正常反序列化
        System.out.println(mapper.readValue("{\"age\":11,\"anotherName\":\"张三\"}", Bean.class));
        // 当不能反序列化时 使用默认枚举实例填充
        System.out.println(mapper.readValue("{\"age\":11,\"name\":\"张三\",\"anotherName\": \"张小三\"}", Bean.class));
    }
}
```

输出结果

```console
Test.Bean(age=11, name=张三)
Test.Bean(age=11, name=张小三)
```

:::

### @JsonMerge

[@JsonMerge](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonMerge.java)
用于在反序列化时，若属性本身非空，将json字符串的值和已有值做合并

- 基础类型不做合并
- 普通对象，按照属性依次合并
- map类型，按照entry依次合并
- 集合类型，追加输入元素合并
- 数组类型，创建新的数组追加输入元素合并

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Bean {
        // 按照entry叠加
        @JsonMerge
        Map<String, String> map = new HashMap<>(ImmutableMap.of("a", "a", "c", "c"));
        @JsonMerge
        List<Integer> list = new ArrayList<>(Arrays.asList(3, 2, 1));
        @JsonMerge
        int[] array = {1, 2, 3};
        // 基本类型直接被覆盖
        @JsonMerge
        String name = "张三";
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        String json = "{" +
            "\"map\": { \"b\": \"b\", \"a\": \"A\"}, " +
            "\"list\": [0], " +
            "\"array\": [-1], " +
            "\"name\": \"n\"" +
            "}";
        System.out.println(mapper.readValue(json, Bean.class));
    }
}
```

输出结果

```console
Test.Bean(map={a=A, b=b, c=c}, list=[3, 2, 1, 0], array=[1, 2, 3, -1], name=n)
```

:::

### @JsonPOJOBuilder

[@JsonPOJOBuilder](https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/annotation/JsonPOJOBuilder.java)
用于序列化时使用构造器来实例化，lombok的[`@Jacksonized`](https://projectlombok.org/features/experimental/Jacksonized)注解就是通过这个注解实现的

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @ToString
    @Builder
    @Jacksonized
    static class Bean {
        String name;
        int age;
    }

    @JsonDeserialize(builder = Bean1.Builder.class)
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @ToString
    static class Bean1 {
        String name;
        int age;

        private Bean1(String name, int age) {
            this.name = name;
            this.age = age;
        }

        @JsonPOJOBuilder(withPrefix = "")
        public static class Builder {
            String name;
            int age;

            private Builder() {

            }

            public Builder name(String name) {
                this.name = name;
                return this;
            }

            public Builder age(int age) {
                this.age = age;
                return this;
            }

            public Bean1 build() {
                return new Bean1(this.name, this.age);
            }
        }
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        String json = "{\"name\": \"张三\", \"age\": 18}";
        // 自定义builder
        System.out.println(mapper.readValue(json, Bean1.class));
        // 使用lombok注解
        System.out.println(mapper.readValue(json, Bean.class));
    }
}
```

输出结果

```console
Test.Bean1(name=张三, age=18)
Test.Bean(name=张三, age=18)
```

:::

## 特殊注解

一般不常用或需要搭配[ObjectMapper](https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/ObjectMapper.java)配置使用，也可能需要多个注解搭配使用。

### @JsonEnumDefaultValue

[@JsonEnumDefaultValue](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonEnumDefaultValue.java)
用于反序列化枚举时值未知时，使用标记的枚举实例作为默认值

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Bean {
        int age;
        String name;
        Sex sex;
    }

    enum Sex {
        MALE,
        FEMALE,
        @JsonEnumDefaultValue UNKNOWN
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        // 开启枚举默认值特性
        mapper.enable(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE);
        // null的时候正常反序列化
        System.out.println(mapper.readValue("{\"age\":11,\"name\":\"张三\",\"sex\": null}", Bean.class));
        // 当不能反序列化时 使用默认枚举实例填充
        System.out.println(mapper.readValue("{\"age\":11,\"name\":\"张三\",\"sex\": \"aaa\"}", Bean.class));
    }
}
```

输出结果

```console
Test.Bean(age=11, name=张三, sex=null)
Test.Bean(age=11, name=张三, sex=UNKNOWN)
```

:::

### @JacksonInject

[@JacksonInject](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JacksonInject.java)
用于在反序列化时注入属性值，值来源并非json

- 若以class注入，则注入值名称为class的全名，否则名称就是注入名
- JacksonInject不指定名称，则默认为属性字段class为名称

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Bean {
        String name;
        int age;
        @JacksonInject
        Long major;
        @JacksonInject("abc")
        Long minor;
        @JacksonInject
        long revision;
    }


    public static void main(String[] args) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        String json = "{\"name\": \"张三\", \"age\": 18}";
        // 需要在反序列化的时候指定待注入的值
        System.out.println(
            mapper.reader(
                    new InjectableValues.Std()
                        // 以class的全名为注入值key
                        .addValue(Long.class, 1L)
                        // 基本类型和包装类型不兼容
                        .addValue(long.class, 2L)
                        // 自定义key
                        .addValue("abc", 20L)
                )
                .readValue(json, Bean.class)
        );
    }
}
```

输出结果

```console
Test.Bean(name=张三, age=18, major=1, minor=20, revision=2)
```

:::

### @JsonManagedReference、@JsonBackReference

用于解决属性与属性之间相互依赖，避免出现序列化死循环导致SOE(StackOverflowError)
- [@JsonManagedReference](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonManagedReference.java)用于标记引用父对象
- [@JsonBackReference](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonBackReference.java)用于标记引用子对象

如何区分属性是用@JsonManagedReference标记还是@JsonBackReference标记呢?取决于属性之间的归属关系，即按照序列化顺序最开始
出现的属性使用@JsonManagedReference标记，后出现的属性使用@JsonBackReference标记。

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Book {
        String name;
        @JsonBackReference
//        @JsonManagedReference
        User owner;
    }

    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class User {
        String name;
        @JsonManagedReference
//        @JsonBackReference
        List<Book> books;
    }


    public static void main(String[] args) throws IOException {
        User user = new User();
        user.setName("张三");
        Book b1 = new Book();
        b1.setName("java从入门到放弃");
        b1.setOwner(user);
        Book b2 = new Book();
        b2.setName("java编程思想");
        b2.setOwner(user);
        List<Book> books = Arrays.asList(b1, b2);
        user.setBooks(books);
        
        // 如果不使用@JsonManagedReference和@JsonBackReference，以下两种序列化都会报错SOE
        
        // user包含book user用@JsonManagedReference标记，book用@JsonBackReference标记
        System.out.println(new ObjectMapper().writeValueAsString(user));
        
        // book包含user book用@JsonManagedReference标记，user用户@JsonBackReference标记
        // 需要注释掉上面的序列化以及去掉pojo里面的注解交换注释
//        System.out.println(new ObjectMapper().writeValueAsString(books));
    }
}
```

输出结果

```console
{"name":"张三","books":[{"name":"java从入门到放弃"},{"name":"java编程思想"}]}
[{"name":"java从入门到放弃","owner":{"name":"张三"}},{"name":"java编程思想","owner":{"name":"张三"}}]
```

:::

### @JsonClassDescription、@JsonPropertyDescription

用于描述json schema，非用于json的序列化与反序列化
- [@JsonClassDescription](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonClassDescription.java)类型描述（字面意思，实际好像并未生效）
- [@JsonPropertyDescription](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonPropertyDescription.java)属性描述

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    @JsonClassDescription("人员")
    static class Bean {
        @JsonPropertyDescription("姓名")
        String name;
        @JsonPropertyDescription("年龄")
        int age;
    }


    public static void main(String[] args) throws IOException {
        SchemaFactoryWrapper wrapper = new SchemaFactoryWrapper();
        ObjectMapper mapper = new ObjectMapper();
        mapper.acceptJsonFormatVisitor(Bean.class, wrapper);
        JsonSchema jsonSchema = wrapper.finalSchema();
        System.out.println(mapper.writerWithDefaultPrettyPrinter().writeValueAsString(jsonSchema));
        
    }
}
```

输出结果

```json
{
  "type" : "object",
  "id" : "urn:jsonschema:com:hightop:demo:postgres:redis:demo:Test:Bean",
  "properties" : {
    "name" : {
      "type" : "string",
      "description" : "姓名"
    },
    "age" : {
      "type" : "integer",
      "description" : "年龄"
    }
  }
}
```

:::

### @JsonFilter

[@JsonFilter](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonFilter.java)
用于属性过滤自定义过滤器，参考[SimpleBeanPropertyFilter](https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/ser/impl/SimpleBeanPropertyFilter.java)

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    @JsonFilter("filter")
    static class Bean {
        String name;
        int age;
    }


    public static void main(String[] args) throws IOException {
        // 声明过滤器
        FilterProvider filters =
            new SimpleFilterProvider()
                // 只要属性名为name的
                .addFilter("filter", SimpleBeanPropertyFilter.filterOutAllExcept("name"));

        ObjectMapper mapper = new ObjectMapper();
        Bean bean = new Bean();
        bean.setName("张三");
        bean.setAge(19);

        System.out.println(mapper.writer(filters).writeValueAsString(bean));
    }
}
```

输出结果

```console
{"name":"张三"}
```

:::

### @JsonIdentityInfo、@JsonIdentityReference

若同一个对象重复出现时使用指定的属性来序列化对象，而不是序列化整个对象，一般需要两个注解配合使用。

当alwaysAsId为false时类似@JsonManagedReference、@JsonBackReference来解决循环依赖问题

当alwaysAsId为true时，类组合时只想序列化其id而不序列化整个对象，用来简化序列化的内容大小

- [@JsonIdentityInfo](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonIdentityInfo.java)指定序列化方式及属性名称
- [@JsonIdentityReference](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonIdentityReference.java)

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Order {
        String orderId;
        @JsonIdentityReference
        User customer;
        @JsonIdentityReference(alwaysAsId = true)
        Address address;
    }

    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    @JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "userId")
    static class User {
        String userId;
        Order order;
    }

    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    @JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "detail")
    static class Address {
        String detail;
        String province;
        String city;
        String country;
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        Order order = new Order();
        order.setOrderId("o1");
        User user = new User();
        user.setUserId("u1");
        user.setOrder(order);
        order.setCustomer(user);
        
        Order order1 = new Order();
        order1.setOrderId("o1");
        order1.setCustomer(user);
        User user1 = new User();
        user1.setUserId("u2");
        user1.setOrder(order1);

        // 深层级存在依赖 如果存在依赖循环 使用id代替
        System.out.println(mapper.writeValueAsString(user1));
        
        // 简化序列化层级
        Order order2 = new Order();
        order2.setOrderId("o3");
        Address address = new Address();
        address.setDetail("四川省成都市金牛区");
        address.setProvince("四川省");
        address.setCity("成都市");
        address.setCountry("金牛区");
        order2.setAddress(address);

        // 如果不简化输出结果
        // {"orderId":"o3","customer":null,"address":{"detail":"四川省成都市金牛区","province":"四川省","city":"成都市","country":"金牛区"}}
        // 直接以详细地址输出地址信息
        System.out.println(mapper.writeValueAsString(order2));
    }
}
```

输出结果

```console
{"userId":"u2","order":{"orderId":"o1","customer":{"userId":"u1","order":{"orderId":"o1","customer":"u1","address":null}},"address":null}}
{"orderId":"o3","customer":null,"address":"四川省成都市金牛区"}
```

:::

### @JsonRootName
[@JsonRootName](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonRootName.java)
在序列化时添加根节点，只能在类型上添加。

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    @JsonRootName("address")
    static class Address {
        String detail;
        String province;
        String city;
        String country;
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        // 序列化时添加root
        mapper.enable(SerializationFeature.WRAP_ROOT_VALUE);
        // 反序列化时去掉root
        mapper.enable(DeserializationFeature.UNWRAP_ROOT_VALUE);
        Address address = new Address();
        address.setDetail("四川省成都市金牛区");
        address.setProvince("四川省");
        address.setCity("成都市");
        address.setCountry("金牛区");

        // 序列化结果
        String json = mapper.writeValueAsString(address);
        System.out.println(json);
        
        // 反序列化结果
        System.out.println(mapper.readValue(json, Address.class));
    }
}
```

输出结果

```console
{"address":{"detail":"四川省成都市金牛区","province":"四川省","city":"成都市","country":"金牛区"}}
Test.Address(detail=四川省成都市金牛区, province=四川省, city=成都市, country=金牛区)
```

:::


### @JsonAppend

[@JsonAppend](https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/annotation/JsonAppend.java)
在序列化时增加额外属性，可以自定义增加，或由mapper序列化时追加

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    @JsonAppend(
        // 序列化是在mapper中追加的属性
        attrs = @JsonAppend.Attr("id"),
        // 由自定义VirtualBeanPropertyWriter追加属性
        props = @JsonAppend.Prop(name = "iid", value = MyVirtualBeanPropertyWriter.class)
    )
    static class Address {
        String detail;
        String province;
        String city;
        String country;
    }

    @NoArgsConstructor
    static class MyVirtualBeanPropertyWriter extends VirtualBeanPropertyWriter {
        protected MyVirtualBeanPropertyWriter(BeanPropertyDefinition propDef, Annotations contextAnnotations,
                                              JavaType declaredType) {
            super(propDef, contextAnnotations, declaredType);
        }

        @Override
        protected Object value(Object bean, JsonGenerator gen, SerializerProvider prov) throws Exception {
            return 111L;
        }

        @Override
        public VirtualBeanPropertyWriter withConfig(MapperConfig<?> config, AnnotatedClass declaringClass,
                                                    BeanPropertyDefinition propDef, JavaType type) {
            return new MyVirtualBeanPropertyWriter(propDef, declaringClass.getAnnotations(), type);
        }
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        Address address = new Address();
        address.setDetail("四川省成都市金牛区");
        address.setProvince("四川省");
        address.setCity("成都市");
        address.setCountry("金牛区");

        // 序列化结果
        System.out.println(mapper.writerFor(Address.class).withAttribute("id", 1L).writeValueAsString(address));
    }
}
```

输出结果

```console
{"detail":"四川省成都市金牛区","province":"四川省","city":"成都市","country":"金牛区","id":1,"iid":111}
```

:::

### @JsonNaming

[@JsonNaming](https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/annotation/JsonNaming.java)
用于在序列化及反序列化时指定命名方式，支持LOWER_CAMEL_CASE、UPPER_CAMEL_CASE、SNAKE_CASE、LOWER_CASE、KEBAB_CASE、LOWER_DOT_CASE

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    // 指定不同class来限定序列化
    @JsonNaming(PropertyNamingStrategies.UpperCamelCaseStrategy.class)
    static class Address {
        String detail;
        String province;
        String city;
        String country;
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        Address address = new Address();
        address.setDetail("四川省成都市金牛区");
        address.setProvince("四川省");
        address.setCity("成都市");
        address.setCountry("金牛区");

        String json = mapper.writeValueAsString(address);
        // 序列化结果
        System.out.println(json);
        // 反序列化
        System.out.println(mapper.readValue(json, Address.class));
    }
}
```

输出结果

```console
{"Detail":"四川省成都市金牛区","Province":"四川省","City":"成都市","Country":"金牛区"}
Test.Address(detail=四川省成都市金牛区, province=四川省, city=成都市, country=金牛区)
```

:::

### @JsonTypeId、@JsonTypeInfo、@JsonSubTypes、@JsonTypeName

实现反序列化时通过父类反序列化为子类即反序列化的多态，可以通过属性、包装属性或者推断的方式实现

- [@JsonTypeId](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonTypeId.java)标记某个字段为推断标识
- [@JsonTypeName](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonTypeName.java)用在子类上，标记子类推断标识
- [@JsonTypeInfo](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonTypeInfo.java)用于定义及声明推断子类的方式
- [@JsonSubTypes](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonSubTypes.java)用于定义支持推断的子类集合

::: details 代码示例
```java
public class Test {
    @JsonTypeInfo(use = JsonTypeInfo.Id.DEDUCTION)
    @JsonSubTypes({
        @JsonSubTypes.Type(value = Triangle.class, name = "triangle"),
        @JsonSubTypes.Type(value = Square.class, name = "square"),
        @JsonSubTypes.Type(value = Rectangle.class, name = "rectangle"),
    })
    @NoArgsConstructor
    public static abstract class Shape {
    }

    @FieldDefaults(level = AccessLevel.PRIVATE)
    @EqualsAndHashCode(callSuper = true)
    @Data
    @JsonTypeName("triangle")
    public static class Triangle extends Shape {
        double bottom;
        double height;
    }

    @FieldDefaults(level = AccessLevel.PRIVATE)
    @EqualsAndHashCode(callSuper = true)
    @Data
    @JsonTypeName("square")
    public static class Square extends Shape {

        double side;
    }

    @FieldDefaults(level = AccessLevel.PRIVATE)
    @EqualsAndHashCode(callSuper = true)
    @Data
    @JsonTypeName("rectangle")
    public static class Rectangle extends Shape {

        double width;
        double height;
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper mapper = new JsonMapper();
        Triangle triangle = new Triangle();
        triangle.setBottom(2);
        triangle.setHeight(4);

        Square square = new Square();
        square.setSide(5);

        Rectangle rectangle = new Rectangle();
        rectangle.setWidth(2);
        rectangle.setHeight(5);

        // 序列化
        String tj = mapper.writeValueAsString(triangle),
            sj = mapper.writeValueAsString(square),
            rj = mapper.writeValueAsString(rectangle);

        System.out.println(tj);
        System.out.println(sj);
        System.out.println(rj);

        // 反序列化
        System.out.println(mapper.readValue(tj, Shape.class));
        System.out.println(mapper.readValue(sj, Shape.class));
        System.out.println(mapper.readValue(rj, Shape.class));
    }
}
```

结果输出

```console
{"bottom":2.0,"height":4.0}
{"side":5.0}
{"width":2.0,"height":5.0}
Test.Triangle(bottom=2.0, height=4.0)
Test.Square(side=5.0)
Test.Rectangle(width=2.0, height=5.0)
```

:::


### @JsonView

[@JsonView](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonView.java)
用于序列化分组，按照不同的组序列化不同结果，类似hibernate validator的group

::: details 代码示例
```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Address {
        @JsonView(Views.Read.class)
        String detail;
        @JsonView({Views.Read.class, Views.Write.class})
        String province;
        @JsonView(Views.Write.class)
        String city;
        @JsonView(Views.Write.class)
        String country;
    }

    static class Views {
        interface Read {
        }

        interface Write {
        }
    }

    public static void main(String[] args) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        Address address = new Address();
        address.setDetail("四川省成都市金牛区");
        address.setProvince("四川省");
        address.setCity("成都市");
        address.setCountry("金牛区");

        // 序列化Read
        System.out.println(mapper.writerWithView(Views.Read.class).writeValueAsString(address));
        // 序列化Write
        String json = mapper.writerWithView(Views.Write.class).writeValueAsString(address);
        System.out.println(json);
        // 使用Write的序列化json反序列化Read 只会读取到两个的交集属性
        System.out.println(mapper.readerWithView(Views.Read.class).readValue(json, Address.class));
    }
}
```

输出结果

```console
{"detail":"四川省成都市金牛区","province":"四川省"}
{"province":"四川省","city":"成都市","country":"金牛区"}
Test.Address(detail=null, province=四川省, city=null, country=null)
```

:::

## 元注解

主要用于标记注解或类为jackson实现，或自定义组合注解

### @JacksonAnnotation

[@JacksonAnnotation](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JacksonAnnotation.java)
仅用来标记注解是jackson注解，将来可能会用来传递其他泛型注解配置，表名标记的注解是jackson注解的一部分

### @JacksonStdImpl

[@JacksonStdImpl](https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/annotation/JacksonStdImpl.java)
仅用来标记实现类(序列化器、反序列化器等)是jackson官方标准实现

### @JacksonAnnotationsInside

[@JacksonAnnotationsInside](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JacksonAnnotationsInside.java)
用于将多个jackson注解组合成一个jackson识别的用户自定义注解。

比如，现在我要通过jackson序列化实现一个关键字脱敏功能

::: details 代码示例 {open}

```java
public class Test {
    @FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
    @RequiredArgsConstructor(access = AccessLevel.PRIVATE)
    public static class SensitiveDataSerializer extends JsonSerializer<String> implements ContextualSerializer {
        JsonSensitive sensitive;

        public SensitiveDataSerializer() {
            this.sensitive = null;
        }

        @Override
        public void serialize(String value, JsonGenerator gen, SerializerProvider provider) throws IOException {
            if (Objects.nonNull(this.sensitive)) {
                gen.writeString(this.sensitive.value().sensitize(value));
            }
            // 当脱敏注解为空时 兼容默认构造方法问题
        }

        @Override
        public JsonSerializer<?> createContextual(SerializerProvider provider, BeanProperty property)
            throws JsonMappingException {
            // 查找字段或者方法上是否存在注解
            JsonSensitive sensitive =
                Optional.ofNullable(property.getAnnotation(JsonSensitive.class))
                    .orElseGet(() -> property.getContextAnnotation(JsonSensitive.class));
            if (Objects.nonNull(sensitive)) {
                return new SensitiveDataSerializer(sensitive);
            }

            return provider.findValueSerializer(property.getType(), property);
        }
    }

    public enum SensitiveType {
        /**
         * 前缀姓名脱敏
         * 张三 *三
         * 王丽莎 *丽莎
         * 蒙娜丽莎 *丽莎
         */
        PREFIX_NAME {
            @Override
            protected String doSensitize(String s, int len) {
                char[] chars = s.toCharArray();
                chars[0] = SYMBOL;

                return new String(chars);
            }
        },
        /**
         * 中缀姓名脱敏
         * 张三 张*
         * 王丽莎 王*莎
         * 蒙娜丽莎 蒙*莎
         */
        INFIX_NAME {
            /**
             * 名字长度2
             */
            protected static final int NAME_2 = 2;

            @Override
            protected String doSensitize(String s, int len) {
                char[] chars = s.toCharArray();
                IntStream.range(1, len - 1).forEach(it -> chars[it] = SYMBOL);

                if (len == NAME_2) {
                    chars[1] = SYMBOL;
                }

                return new String(chars);
            }
        },
        /**
         * 后缀姓名脱敏
         * 张三 张*
         * 王丽莎 王**
         * 蒙娜丽莎 蒙**
         */
        SUFFIX_NAME {
            @Override
            protected String doSensitize(String s, int len) {
                char[] chars = s.toCharArray();
                IntStream.range(1, len).forEach(it -> chars[it] = SYMBOL);

                return new String(chars);
            }
        },
        /**
         * 身份证号码 脱敏出生年月日
         * 511123199901011234 511123********1234
         */
        IDENTITY_CARD_NUMBER {
            @Override
            protected String doSensitize(String s, int len) {
                // 身份证号码脱敏年月日长度8 开始脱敏位置为6
                return SensitiveType.sensitize(s, len, 8, 6);
            }
        },
        /**
         * 手机号码 脱敏中间4位
         * 13512345678 135****5678
         */
        MOBILE_NUMBER {
            @Override
            protected String doSensitize(String s, int len) {
                // 手机号脱敏中间4位 开始脱敏位置为3
                return SensitiveType.sensitize(s, len, 4, 3);
            }
        };

        /**
         * 脱敏符号
         */
        protected static final char SYMBOL = '*';

        /**
         * 数据脱敏
         * @param s   待脱敏数据
         * @param len 待脱敏数据长度
         * @return 脱敏后数据
         */
        protected abstract String doSensitize(String s, int len);

        /**
         * 数据脱敏
         * @param s 待脱敏数据
         * @return 脱敏后数据
         */
        String sensitize(String s) {
            // 空字符串不做脱敏
            if (StringUtils.isEmpty(s)) {
                return s;
            }

            return this.doSensitize(s, s.length());
        }

        /**
         * 连续脱敏工具方法
         * @param s              待脱敏字符串
         * @param len            字符串长度
         * @param sensitizeLen   脱敏长度
         * @param sensitizeStart 开始脱敏位置
         * @return 脱敏后字符串
         */
        static String sensitize(String s, int len, int sensitizeLen, int sensitizeStart) {
            // 小于等于脱敏长度 不做脱敏 兼容异常数据
            if (len <= sensitizeLen) {
                return s;
            }

            // 剩余不需要隐藏的长度
            int left = len - sensitizeLen;
            char[] chars = s.toCharArray();
            // 
            if (left <= sensitizeStart) {
                // 保证首尾不被脱敏
                int start = (left >> 1) + (len & 1);
                IntStream.range(0, sensitizeLen).forEach(it -> chars[start + it] = SYMBOL);
            } else {
                IntStream.range(0, sensitizeLen).forEach(it -> chars[sensitizeStart + it] = SYMBOL);
            }

            return new String(chars);
        }
    }

    @Target({ElementType.FIELD, ElementType.METHOD})
    @Retention(RetentionPolicy.RUNTIME)
    @JacksonAnnotationsInside
    @JsonSerialize(using = SensitiveDataSerializer.class)
    @Documented
    public @interface JsonSensitive {
        /**
         * 脱敏数据类型
         * @return {@link SensitiveType}
         */
        SensitiveType value();
    }


    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Data
    static class Person {
        @JsonSensitive(SensitiveType.IDENTITY_CARD_NUMBER)
        String id;
        @JsonSensitive(SensitiveType.INFIX_NAME)
        String name;
        @JsonSensitive(SensitiveType.MOBILE_NUMBER)
        String phone;
    }

    public static void main(String[] args) throws JsonProcessingException {
        ObjectMapper mapper = new JsonMapper();
        Person person = new Person();
        person.setId("510101199001010681");
        person.setName("欧阳锋");
        person.setPhone("13888888888");

        System.out.println(mapper.writeValueAsString(person));
    }
}
```

输出结果

```console
{"id":"510101********0681","name":"欧*锋","phone":"138****8888"}
```

:::

## 总结

以上列出了jackson的全部注解，工作中绝大部分可能使用不上，只是作为了解以及某些特殊情况下的json处理能够多一种快速解决方案。

<!-- 参考文章1 https://blog.csdn.net/weixin_44610216/article/details/118978414 -->
<!-- 参考文章2 https://www.imangodoc.com/38956.html -->

---
title:  MyBatis数据字典绑定
tags: [mybatis, java]
---

字典表（也被称为码表或数据字典）是一种常用的数据结构，用于存储键值对的集合。
字典码表通过标准化的方式确保数据的一致性和完整性，并提供了一个集中的位置来管理这些数据。
类似枚举，但是相对枚举来说更灵活，毕竟枚举是“硬编码”，字典可以随时地按需修改。

在后台管理系统中，通常会设置一个页面来管理数据字典，包括添加、删除、修改、查询等功能。
在前台页面中，数据字典的数据主要通过“下拉框”等控件展示，用于展示码表选项‌。

:::: details 字典定义

字典一般会由一张主表和一张子表构成，主表为字典目录索引，子表为字典项，即用于“下拉框”的选项，假如数据库结构定义如下：

::: code-group

```java [实体定义.java]

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@TableName("t_dict")
public class Dict {
    /**
     * 字典id
     */
    Long id;
    /**
     * 字典名称
     */
    String name;
    /**
     * 字典编码
     */
    String code;
    /**
     * 字典描述
     */
    String description;
}

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@TableName("t_dict_item")
public class DictItem {
    /**
     * 字典项id
     */
    Long id;
    /**
     * 字典id
     */
    Long dictId;
    /**
     * 字典项名称
     */
    String name;
    /**
     * 字典项编码
     */
    String code;
    /**
     * 字典项描述
     */
    String description;
    /**
     * 排序号
     */
    Integer sort;
    /**
     * 是否启用
     */
    Boolean isEnable;
}
```

```sql [数据库定义.sql]
CREATE TABLE `t_dict`
(
    `id`          INT PRIMARY KEY AUTO_INCREMENT,
    `code`        VARCHAR(100) NOT NULL, -- 字典编码 一般需要保证唯一性
    `name`        VARCHAR(255) NOT NULL, -- 字典名称
    `description` VARCHAR(255)           -- 字典描述
);

CREATE TABLE `t_dict_item`
(
    `id`          INT PRIMARY KEY AUTO_INCREMENT,
    `dict_id`     INT          NOT NULL, -- 关联字典id
    `code`        VARCHAR(100) NOT NULL, -- 字典项编码
    `name`        VARCHAR(255) NOT NULL, -- 字典项名称
    `description` VARCHAR(255),          -- 字典项描述
    `sort`        INT     DEFAULT 0,     -- 字典项排序
    `is_enable`   BOOLEAN DEFAULT TRUE   -- 是否启用 动态控制是否使用该选项
);
```

:::

::: tip 提示
字典改动频率很小，一般会做缓存。
:::

::::

假如，现在我有用户表定义如下，其中性别可取值为`男/女/未知`，证件类型可取值为`身份证/居住证/军官证/警官证/护照`。

:::: tabs

=== 用户定义.java

```java

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@TableName("t_user")
public class User {
    Long id;
    String code;
    String name;
    // 这个是用户性别的字典项编码
    String sex;
    // 这个是证件类型的字典编码
    String cardType;
    String cardNumber;
}
```

=== 用户数据库定义.sql

```sql
CREATE TABLE `t_user`
(
    `id`          INT PRIMARY KEY AUTO_INCREMENT,
    `code`        VARCHAR(64)  NOT NULL,
    `name`        VARCHAR(128) NOT NULL,
    `sex`         VARCHAR(8)   NOT NULL, -- 用户性别 对应字典USER_SEX
    `card_type`   VARCHAR(8),            -- 证件类型 对应字典CARD_TYPE
    `card_number` VARCHAR(64)
);
```

=== 性别字典

| 字典名称 | 字典编码     |
|:-----|:---------|
| 用户性别 | USER_SEX |

字典项

| 字典项编码   | 字典项名称 | 排序  |
|:--------|:------|:----|
| MALE    | 男     | 0   |
| FEMALE  | 女     | 1   |
| UNKNOWN | 未知    | 2   |

=== 证件类型字典

| 字典名称 | 字典编码      |
|:-----|:----------|
| 证件类型 | CARD_TYPE |

字典项

| 字典项编码             | 字典项名称 | 排序  |
|:------------------|:------|:----|
| ID                | 身份证   | 0   |
| RESIDENCE_PERMIT  | 居住证   | 1   |
| OFFICER_ID        | 军官证   | 2   |
| POLICE_OFFICER_ID | 警官证   | 3   |
| PASSPORT          | 护照    | 4   |

=== 字典DML

```sql
-- 字典
INSERT INTO `t_dict`(`id`, `code`, `name`)
VALUES (1, 'USER_SEX', '用户性别'),
       (2, 'CARD_TYPE', '证件类型');
-- 字典项
INSERT INTO `t_dict_item`(`id`, `dict_id`, `code`, `name`, `sort`)
VALUES (101, 1, 'MALE', '男', 0),
       (102, 1, 'FEMALE', '女', 1),
       (103, 1, 'UNKNOWN', '未知', 2),
       (201, 2, 'ID', '身份证', 0),
       (202, 2, 'RESIDENCE_PERMIT', '居住证', 1),
       (203, 2, 'OFFICER_ID', '军官证', 2),
       (204, 2, 'POLICE_OFFICER_ID', '警官证', 3),
       (205, 2, 'PASSPORT', '护照', 4);
```

::::

::: warning 如何实现字典绑定？
如何在查询用户时，可以查询出性别/证件类型字典编码用于下拉框绑定，性别/证件类型名称用于下拉框显示？
:::

## 想要实现的目标

### 序列化目标

我希望在查询时字典项编码同时携带字典项名称，便于下拉框等回显或者分页列表的展示。

```json
{
  "id": "1001",
  "name": "张三",
  "code": "zhangsan",
  "sex": {
    "value": "MALE",
    "label": "男"
  },
  "cardType": {
    "value": "ID",
    "label": "身份证"
  },
  "cardNumber": "1234567890"
}
```

### 反序列化目标

在新增、修改的时候，这时候我希望字典项编码保持原样，如果还是嵌套对象就显得啰嗦了。

```json
{
  "id": "1001",
  "name": "张三",
  "code": "zhangsan",
  "sex": "MALE",
  "cardType": "ID",
  "cardNumber": "1234567890"
}
```

::: warning 提醒
此功能非MyBatis功能，仅为json反序列化时的特殊处理。
:::

## 实现思路

利用MyBatis拦截器在处理完结果集后拿到结果集的Class，通过反射获取到我们标记为字典项的属性及字典编码，再通过字典项查询获得字典项的名称并赋值结果集对象。

::: danger 注意
这种实现思路本质上还是遍历结果集中的字典项编码，依次再查询数据库来获取字典项名称，使用分页插件（如PageHelper）会受影响，需要特别处理。
:::


## 实现过程

### 定义字典类型
我需要将User的`sex`和`cardType`属性替换为自定义的DictItemEntry类型，实现在查询后可以通过`sex.value`、`sex.label`、`cardType.value`、`cardType.label`分别获得字典项编码及名称。

```java
@FieldDefaults(level = AccessLevel.PACKAGE)
@Data
@NoArgsConstructor
@Accessors(chain = true)
public final class DictItemEntry {
    /**
     * 字典项编码
     */
    String value;
    /**
     * 字典项名称
     */
    String label;

    /**
     * 用于赋值数据库写入 数据库只需存储字典项编码即可
     * @param value 字典项编码
     * @return {@link DictItemEntry}
     */
    public static DictItemEntry of(String value) {
        return new DictItemEntry().setValue(value);
    }
}
```

### 自定义注解绑定字典编码

通过DictItemEntry及MyBatis的TypeHandler能解决写入数据库问题，如何解决读取数据库时通过字典项编码获得字典项名称呢？

考虑添加一个注解`@DictItemBind`，结合MyBatis的拦截器，在ResultSetHandler的`handleResultSets`方法处理完成后通过反射读取映射对象的字段注解来做字典项的名称绑定。

```java
@Target({ElementType.FIELD, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DictItemBind {
    /**
     * 字典编码
     * @return 字典编码
     */
    String value();
}
```

### 数据库实体

最后，用户实体定义修改如下：

```java
// 修改后的用户实体定义
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@TableName("t_user")
public class User {
    /**
     * 用户id
     */
    Long id;
    /**
     * 帐号
     */
    String code;
    /**
     * 名字
     */
    String name;
    /**
     * 用户性别
     */
    @DictItemBind("USER_SEX")
    DictItemEntry sex;
    /**
     * 证件类型
     */
    @DictItemBind("CARD_TYPE")
    DictItemEntry cardType;
    /**
     * 证件号码
     */
    String cardNumber;
}
```

### DictItemEntry类型处理器

类型处理器会在ResultSetHandler中预处理一次DictItemEntry，赋值字典项编码。

```java
public class DictItemEntryTypeHandler extends BaseTypeHandler<DictItemEntry> {
        @Override
    public void setNonNullParameter(PreparedStatement ps, int i, DictItemEntry parameter, JdbcType jdbcType)
        throws SQLException {
        ps.setString(i, parameter.getKey());
    }

    @Override
    public DictItemEntry getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return of(rs.getString(columnName), rs.wasNull());
    }

    @Override
    public DictItemEntry getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return of(rs.getString(columnIndex), rs.wasNull());
    }

    @Override
    public DictItemEntry getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return of(cs.getString(columnIndex), cs.wasNull());
    }

    /**
     * 根据字典项编码创建{@link DictItemEntry}
     * @param key 字典项编码
     * @return {@link DictItemEntry}
     */
    static DictItemEntry of(String key, boolean wasNull) {
        // 保证对象非空 减少前端判断
        DictItemEntry entry = new DictItemEntry();
        if (!wasNull) {
            entry.setValue(key);
        }

        return entry;
    }
}
```

### ResultSetHandler拦截器

由于MyBatis的MyBatis只能针对类型做处理，注解类型只有在结果集才能获取，所以通过结果集拦截器来获取字段注解的字典编码。

```java
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Intercepts(@Signature(type = ResultSetHandler.class, method = "handleResultSets", args = Statement.class))
public class DictItemEntryResultSetInterceptor implements Interceptor {
    /**
     * 字典编码缓存
     */
    private static final Map<Class<?>, Map<Field, String>> BINDER_CACHE = new ConcurrentHashMap<>();

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        List<?> proceed = (List<?>) invocation.proceed();
        if (CollectionUtils.isNotEmpty(proceed)) {
            proceed.stream()
                .filter(Objects::nonNull)
                .map(Object::getClass)
                .findFirst()
                .ifPresent(type -> {
                    Map<Field, String> binders =
                        BINDER_CACHE.computeIfAbsent(
                            type, key -> {
                                // 不满足条件的使用空map代替占位
                                Map<Field, String> map = new HashMap<>(8);
                                // 获得所有非static的字段
                                FieldUtils.fields(type, true, Modifier.STATIC)
                                    .stream()
                                    // 过滤仅为DictItemEntry类型的字段
                                    .filter(it -> it.getType() == DictItemEntry.class)
                                    .forEach(it -> {
                                        DictItemBind annotation = it.getAnnotation(DictItemBind.class);
                                        // 若字段上存在注解 获取并缓存其绑定的字典编码
                                        if (Objects.nonNull(annotation)) {
                                            map.put(it, annotation.value());
                                        }
                                    });

                                return map;
                            });

                    if (CollectionUtils.isNotEmpty(binders)) {
                        proceed.stream()
                            .filter(Objects::nonNull)
                            // 遍历结果集 依次处理字典项类型
                            .forEach(it ->
                                binders.forEach((key, value) -> {
                                    // 已经有TypeHandler处理过一次
                                    DictItemEntry entry = (DictItemEntry) FieldUtils.get(key, it);

                                    // 若不存在字典项编码
                                    if (Objects.isNull(entry.getValue())) {
                                        return;
                                    }

                                    // 跳过分页查询做字典项查询
                                    PageHelper.skipPageThreadLocal(() -> {
                                        // 查询字典
                                        Dict dict = ApplicationContexts.getBean(DictDomainService.class).getByCode(value);
                                        if (Objects.isNull(dict)) {
                                            return;
                                        }

                                        // 查询字典项
                                        DictItem dictItem =
                                            ApplicationContexts.getBean(DictItemDomainService.class)
                                                .getByDictIdAndValue(dict.getId(), entry.getValue());
                                        if (Objects.isNull(dictItem)) {
                                            return;
                                        }

                                        entry.setLabel(dictItem.getLabel());
                                    });
                                })
                            );
                    }
                });
        }

        return proceed;
    }

    @Override
    public Object plugin(Object target) {
        if (target instanceof ResultSetHandler) {
            return Interceptor.super.plugin(target);
        }

        return target;
    }
}
```

### json反序列化问题

这里以jackson为例，其他json处理工具类似，将一个字符串反序列化为一个对象，即DictItemEntry。

::: code-group
```java [DictItemEntryDeserializer.java]
public class DictItemEntryDeserializer extends StdDeserializer<DictItemEntry> {
    protected DictItemEntryDeserializer() {
        super(DictItemEntry.class);
    }

    @Override
    public DictItemEntry deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        // 解析当前字符串或者json对象中的value属性值
        String text = JacksonUtils.getTextValue(p, "value");
        if (StringUtils.isEmpty(text)) {
            return null;
        }

        return DictItemEntry.of(text);
    }
}
```

```java [JacksonUtils.java]
public abstract class JacksonUtils {
    protected static final ObjectMapper OBJECT_MAPPER = new FarioObjectMapper();

    /**
     * 解析json字段值为字符串，若json为对象，则解析某个属性值为字符串
     * @param p         {@link JsonParser}
     * @param fieldName 字段名称
     * @return 字段值
     * @throws IOException IOException
     */
    public static String getTextValue(JsonParser p, String fieldName) throws IOException {
        return getTextValue(OBJECT_MAPPER, p, fieldName);
    }

    /**
     * 解析json字段值为字符串，若json为对象，则解析某个属性值为字符串
     * @param objectMapper {@link ObjectMapper}
     * @param p            {@link JsonParser}
     * @param fieldName    字段名称
     * @return 字段值
     * @throws IOException IOException
     */
    public static String getTextValue(ObjectMapper objectMapper, JsonParser p, String fieldName) throws IOException {
        if (p.isExpectedStartArrayToken()) {
            p.readValueAsTree();
            return null;
        }

        if (p.isExpectedStartObjectToken()) {
            return
                Optional.ofNullable(objectMapper.<ObjectNode>readTree(p))
                    .map(it -> it.get(fieldName))
                    .filter(it -> it instanceof ValueNode)
                    .map(ValueNode.class::cast)
                    .map(JsonNode::asText)
                    .orElse(null);
        }

        // 非对象类型
        return p.getValueAsString();
    }
}
```
:::

### Spring完整配置

```java
@Configuration(proxyBeanMethods = false)
class DictItemBindConfigurer {
    @Bean
    Interceptor dictItemEntryInterceptor() {
        // 结果集拦截器
        return new DictItemEntryResultSetInterceptor();
    }

    @Bean
    ConfigurationCustomizer dictItemEntryConfigurationCustomizer() {
        return
            config -> {
                TypeHandlerRegistry registry = config.getTypeHandlerRegistry();
                // 注册DictItemEntry类型处理器
                registry.register(DictItemEntryTypeHandler.class);
            };
    }

    @Bean
    Jackson2ObjectMapperBuilderCustomizer dictItemEntryJackson2ObjectMapperBuilderCustomizer() {
        // DictItemEntry反序列化处理器
        return it -> it.deserializerByType(DictItemEntry.class, new DictItemEntryDeserializer());
    }
}
```

## 总结

以上，完成了MyBatis的数据字典类型绑定，整个处理过程和[MyBatis枚举类型绑定](./2022-08-09-mybatis-enum-bind.md){:target='_blank' rel="noreferrer"}比较相似，同样还存在一些可能的问题未处理。

- mvc的路径参数处理

  可以结合ConverterFactory、Converter、ConversionService来处理

- swagger对自定义枚举的友好展示

  可以参考[Swagger统一应答类型处理](2022-07-04-swagger-common-response.md){:target='_blank' rel="noreferrer"}实现

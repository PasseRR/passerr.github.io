---
title:  OGNL语法介绍
tags: [java]
---

## 什么是OGNL?

::: tip [**来源官方**](https://commons.apache.org/proper/commons-ognl/index.html)

OGNL stands for Object-Graph Navigation Language; it is an expression language for getting and setting properties of
Java objects,
plus other extras such as list projection and selection and lambda expressions.
:::

OGNL(Object-Graph Navigation Language)是对象导航图语言，是一种用于java对象get、set属性以及其他额外的投影、选择过滤、lambda表达式的的表达式语言。

OGNL读为`orthogonal`[ɔ:'θɒgənl]。

## Java中有哪些常见的框架/项目使用了OGNL?

- [Struts2](https://struts.apache.org/index.html)
- [Spring Web Flow](https://spring.io/projects/spring-webflow)
- [**Mybatis**](https://mybatis.org/mybatis-3/)
- [**FreeMarker**](https://freemarker.apache.org/)
- [**Thymeleaf**](https://www.thymeleaf.org/)
- [**Arthas**](https://arthas.aliyun.com/)

## 常量

### 字符串

单引号或双引号包围，如`"Hello"`、`'World'`

### 字符

单引号包围，如`'a'`、`'1'`

### 数字

在数字后添加特定后缀表示不同的类型

| 后缀      | 类型                   |
|:--------|:---------------------|
| 无       | java.lang.Integer    |
| `l`/`L` | java.lang.Long       |
| `f`/`F` | java.lang.Float      |
| `d`/`D` | java.lang.Double     |
| `b`/`B` | java.math.BigDecimal |
| `h`/`H` | java.math.BigInteger |

### 布尔值

`true`、`false`

### 空值

`null`

## 属性访问及集合索引

### 数组

定义数组`#array=new int[]{1, 2, 3}`

- 获得数组大小

  `#array.length`、`#array["length"]`、`#array["len" + "gth"]`
- 获得索引元素

  `#array[0]`

### List

定义List`#list={1, 2, 3}`

- 获得List大小

  `#list.size`、`#list["size"]`
- 获得索引元素

  `#list[0]`、`#list.get(0)`
- 访问无参方法

  `#list.toArray`、`#list.iterator`

### Map

定义Map`#map=#{"foo": "foo value", "bar": "bar value", "values": "values value"}`

- 获得Map大小

  `#map.size`
- 获得key的值
  `#map.foo`、`#map["foo"]`、`#map.get("foo")`

  ::: danger 注意

  当存在key与map的方法冲突时，使用`#map.values`实际返回结果是map的值集合而非`"values value"`，
  所以精确访问key的值建议使用后两种方式

  :::

- 访问无参方法

  `#map.values`、`#map.keys.iterator`、`#map.isEmpty`

### 普通Java对象

定义普通对象如下:

```java
package demo;

public class Person {
    String name;
    Integer age;
    Sex sex;

    // 省略getter/setter
}

enum Sex {
    MALE,
    FEMALE,
    UNKNOWN
}
```

ognl对象声明脚本`#person = new Person(), #person.name="张三", #person.age=11, #person.sex = @demo.Sex@valueOf("MALE")`

- 属性访问

  `#person.name`、`#person.age`、`#person.sex`
- 方法访问

  `#person.toString()`

### 静态属性访问

需要全名称访问`@fullClassName@fieldName`，如`@java.util.Random@mask`、获得某个类的class`@java.lang.String@class`

## 变量声明定义

`#`后面跟变量定义

::: danger 注意

`#`也用于map定义，`#map=#{"foo": "foo value", "bar": "bar value"}`

:::

- `#integer=1`
- `#big=1H`

## 子表达式

在表达式`.`后面添加括号`()`，括号内则为子表达式，子表达式独立运行且能获得点之前的表达式结果。

`#num=1, (#num + 5).(#this * #this, #this - 5)`

## lambda表达式

通过`:[expression]`定义。

定义一个阶乘lambda表达式，`#fact=:[#this <= 1 ? 1 : #this*#fact(#this-1)], #fact(30H)`

## 集合构造

### 数组

类似java的数组声明，`#array=new int[]{1, 2, 3}`、`#array=new String[]{"a", "b", "c"}`

### List

`#list={1, 2, 3, 4}`，判断是否在list中，`1 in #list`，默认类型为`java.util.ArrayList`

### Map

`#map=#{"key": "value", "key1": "value1"}`，默认类型为`java.util.LinkedHashMap`，
若要修改为其他类型的Map，`#map=#@java.util.HashMap@{ "foo" : "foo value", "bar" : "bar value" }`

## 集合的投影、过滤、选择

类似Java的Stream的map、filter操作。

`#list={1, 2, 3, 4, 5}`

### 投影

将列表中的数据做平方后返回投影list，`#list.{ #this * #this }`

### 过滤

选择列表中的奇数返回list，`#list.{? #this % 2 == 1 }`

### 选择

- 选择第一个匹配的元素

  找到列表中第一个偶数，`#list.{^ #this%2 == 0 }`，返回结果还是list而非object
- 选择最后一个匹配的元素

  制造到列表中最后一个偶数，`#list.{$ #this%2 == 0}`，返回结果还是list而非object

## 类型强转

OGNL可以强制object转为布尔、数字、整数、集合。

### 强转为布尔值

所有需要布尔值的地方(如三元表达式)，object都会相应的转为布尔值

- 对象本身就是布尔类型(boolean)

  则为其本身
- 对象是数字类型(Number)

  **非0**为true，**0**为false
- 对象是字符类型(Character)

  **非0**为true，**0**为false

- 其他类型

  **非空**为true，**空**则为false

### 数字类型转换

数字操作(+、-、*、/)设计到两个参数，将会按照以下方式决定其结果。

- 两个参数类型一样

  结果数字类型则一致，如`1+1`结果为int、`1f+1f`结果为float、`1b+1b`结果为BigDecimal
- 有一个参数是非数字类型

  结果将数字当作double类型处理

- 两个参数都是浮点型

  结果将是较大的浮点类型，如`1+1f`结果为float、`1f+1d`结果为double、`1+1b`结构为BigDecimal

- 两个参数都是整型

  结果将是较大的整型类型，如`'1' + 1`结果为integer、`1+true`结果为integer、`1L+1`结果为long、`1+1h`结果为BigInteger

- 一个为浮点型、另一个为整型

  如果整数比int小结果为double，如果整数比int大结果为BigDecimal

### 强转为整数

位操作只针对整型，如果是BigDecimal或BigInteger结果为BigInteger， 否则保留操作类型相同类型且只取整数部分。

### 强转为集合

**投影**(`e1.{e2}`)、**选择**(`e1.{? e2}`)及**in**(e1 in e2)操作，将强转其中一个参数为集合然后遍历。

- 数组类型

  直接从头到尾遍历，`1 in new int[]{1, 2, 3}`、`new int[]{1, 2, 3}.{ #this + 1 }`
- java.util.Collection子类

  按照迭代器遍历，`1 in {1, 2, 3}`、`{1, 2, 3}.{ #this + 1 }`
- java.util.Map子类

  按照map的值的迭代器遍历，`#{"a":1,"b": 2,"c": 3}.{ #this }`结果为`{1, 2, 3}`
- java.lang.Number

  从0开始遍历，`#num=2, #num.{ #this + 1}`结果为`{1, 2}`、`#num=2.5d, #num.{ #this + 1}`结果为`{1.0d, 2.0d}`
- 其他类型

  将其当做只有一个元素的集合

## 附录(OGNL中的操作符)

| 操作符                                            | 描述               | 结果值描述                                                          | 
|:-----------------------------------------------|:-----------------|:---------------------------------------------------------------|
| e1 `,` e2                                      | 序列               | e1、e2表达式都会执行，结果为e2                                             | 
| e1 `=` e2                                      | 赋值               | 执行e2，赋值e1，结果为e2                                                | 
| e1 `?` e2 `:` e3                               | 三元条件操作符          | 执行e1，根据结果为true/false决定执行并返回结果e2/e3                             |
| e1 <code>&#124;&#124;</code> e2<br> e1 `or` e2 | 逻辑或              | 如果e1为true则只执行e1，否则再执行e2，结果为其中真值                                | 
| e1 `&&` e2<br> e1 `and` e2                     | 逻辑与              | 如果e1为false则只执行e1并返回结果e1，否则再执行e2并返回e2                           | 
| `!` e <br> `not` e                             | 逻辑非              | 将e解释为布尔值后取反则为结果                                                |
| e1 <code>&#124;</code> e2<br> e1 `bor` e2      | 位运算或             | 将e1和e2解释为整型并进行或运算结果                                            |
| e1 `^` e2<br> e1 `xor` e2                      | 位运算异或            | 将e1和e2解释为整型并进行异或运算结果                                           |
| e1 `&` e2<br> e1 `band` e2                     | 位运算与             | 将e1和e2解释为整型并进行与运算结果                                            |
| `~` e                                          | 位运算非             | 将e解释为整型并进行非运算结果                                                |
| e1 `<<` e2 <br> e1 `shl` e2                    | 位运算左移            | 将e1、e2解释为整型并左移运算结果                                             |
| e1 `>>` e2 <br> e1 `shr` e2                    | 位运算右移            | 将e1、e2解释为整型并右移运算结果                                             |
| e1 `>>>` e2 <br> e1 `ushr` e2                  | 位运算无符号右移         | 将e1、e2解释为整型并无符号右移运算结果                                          |
| e1 `+` e2                                      | 和运算              | 将e1、e2解释为整型并求和运算结果，若是字符串则结果为字符串拼接结果                            |
| e1 `-` e2                                      | 差运算              | 将e1、e2解释为整型并求差运算结果                                             |
| e1 `*` e2                                      | 乘运算              | 将e1、e2解释为整型并求乘积运算结果                                            |
| e1 `/` e2                                      | 除运算              | 将e1、e2解释为整型并求商运算结果                                             |
| e1 `%` e1                                      | 余运算              | 将e1、e2解释为整型并求余运算结果                                             |
| `+` e                                          | 正数符号             | 表示正数                                                           |
| `-` e                                          | 负数符号             | 表示负数                                                           |
| e1 `<` e2 <br> e1 `lt` e2                      | 小于               | 将e1、e2通过compareTo方法比较，结果为布尔值                                   |
| e1 `<=` e2 <br> e1 `lte` e2                    | 小于等于             | 将e1、e2通过compareTo方法比较，结果为布尔值                                   |
| e1 `>` e2 <br> e1 `gt` e2                      | 大于               | 将e1、e2通过compareTo方法比较，结果为布尔值                                   |
| e1 `>=` e2 <br> e1 `gte` e2                    | 大于等于             | 将e1、e2通过compareTo方法比较，结果为布尔值                                   |
| e1 `in` e2                                     | 包含               | 集合e2是否包含e1元素，结果为布尔值                                            |
| e1 `not in` e2                                 | 不包含              | 集合e2是否不包含e1元素，结果为布尔值                                           |
| e1 `==` e2 <br> e1 `eq` e2                     | equals           | 同java中Object的equals方法，结果为布尔值                                   |
| e1 `!=` e2 <br> e1 `neq` e2                    | not equals       | 同java中Object的equals方法取反，结果为布尔值                                 |
| e `instanceof` class                           | 判断实例是否是给定class类型 | 结果为布尔值，class必须是全名称                                             |
| e`.`method(args)                               | 方法调用             | 结果为方法返回值                                                       |
| e`.`property                                   | 属性值获取            | 结果为属性值                                                         |
| `@`class_name`@`method(args)                   | 静态方法调用           | 类名为全名，结果为方法调用结果                                                |
| `@`class_name`@`field                          | 静态字段访问           | 类名为全名，结果为字段值                                                   |
| e1`[`e2`]`                                     | 索引               | 获得集合、数组索引位置的值                                                  |
| e1`.{` e2 `}`                                  | 投影               | 集合投影                                                           |
| e1`.{?` e2 `}`                                 | 选择               | 集合选择过滤                                                         |
| e1`.{^` e2 `}`                                 | 选择第一个            | 集合过滤选择满足条件的第一个元素                                               |
| e1`.{$` e2 `}`                                 | 选择最后一个           | 集合过滤选择满足条件的最后一个元素                                              |
| e1`.(` e2, e3, e4 `)`                          | 子表达式             | 执行e1后执行e2、e3、e4子表达式，结果为e4                                      |
| e1`(` e2, e3, e4 `)`                           | 表达式执行            | 执行e1后执行e2、e3、e4子表达式，结果为e1                                      |
| `#`variable                                    | 变量引用/声明          | 变量引用/声明                                                        |
| `new` type`[]{` e, ... `}`                     | 数组创建             | 创建一个数组， type为任意类型                                              |
| `{` e, ... `}`                                 | 列表创建             | 创建一个列表，结果为ArrayList                                            |
| `#{` k1: v1, k2: v2, ... `}`                   | Map创建            | 创建一个Map，结果为LinkedHashMap                                       |
| `#@`class_name`@{`k1: v1, k2: v2, ...`}`       | 指定Map类型创建        | 类名为全名，如<span v-pre>#@java.util.HashMap@{k1: v1, k2: v2}</span> |
| `:[` e `]`                                     | lambda表达式定义      | 如上的阶乘定义                                                        |

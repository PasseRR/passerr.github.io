---
title:  MyBatis Parameter 'xxx' not found
tags: [mybatis, java]
---

报错信息：

```txt
org.mybatis.spring.MyBatisSystemException: nested exception is org.apache.ibatis.binding.BindingException: Parameter 'arg0' not found. Available parameters are [sequence, newTableName, oldTableName, param3, param1, param2]
    at org.mybatis.spring.MyBatisExceptionTranslator.translateExceptionIfPossible(MyBatisExceptionTranslator.java:97)
    at org.mybatis.spring.SqlSessionTemplate$SqlSessionInterceptor.invoke(SqlSessionTemplate.java:439)
    at com.sun.proxy.$Proxy110.update(Unknown Source)
    at org.mybatis.spring.SqlSessionTemplate.update(SqlSessionTemplate.java:288)
    at com.baomidou.mybatisplus.core.override.MybatisMapperMethod.execute(MybatisMapperMethod.java:64)
    at com.baomidou.mybatisplus.core.override.MybatisMapperProxy$PlainMethodInvoker.invoke(MybatisMapperProxy.java:152)
    at com.baomidou.mybatisplus.core.override.MybatisMapperProxy.invoke(MybatisMapperProxy.java:89)
    at com.sun.proxy.$Proxy218.createScopeDetailTable(Unknown Source)
```

笔者的同事曾经有过疑问，为什么有的时候需要[@Param](https://github.com/mybatis/mybatis-3/blob/3.3.x/src/main/java/org/apache/ibatis/annotations/Param.java)注解，有的时候不需要？

接下来，带着这两个问题一起分析一下为什么。

## JDK8 -parameters

::: tip [javac Doc](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/javac.html)

**-parameters**

Stores formal parameter names of constructors and methods in the generated class file so that the method java.lang.reflect.Executable.getParameters from the Reflection API can retrieve them.

:::

从JDK8开始，新增`-parameters`编译参数，它的作用是保留构造方法、成员方法的参数名称，便于通过java.lang.reflect.Executable#getParameters来获取参数名称，
这会增大一点点class文件的大小，但是对于反射来说，这是一个非常有用的特性。

### 配置-parameters编译参数

::: code-group
```xml [maven]
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <version>3.10.1</version>
    <configuration>
        <!-- 方式1 -->
        <parameters>true</parameters>
        <!-- 方式2 -->
        <compilerArgs>
            <arg>-parameters</arg>
        </compilerArgs>
    </configuration>
</plugin>
```

```groovy [gradle]
tasks.withType(JavaCompile) {
    options.encoding = 'UTF-8'
    // 方式1：显式参数
    options.compilerArgs << '-parameters'
    // 方式2：直接启用（优先）
    options.parameters = true
}
```
:::

### 编译示例

::: code-group

```java [ParametersTest.java]
public class ParametersTest {
    public static void main(String[] args) throws NoSuchMethodException {
        Parameter[] params =
            ParametersTest.class
                .getDeclaredMethod("test", Integer.class, boolean.class, String.class)
                .getParameters();

        for (Parameter param : params) {
            System.out.println(param.getName());
        }
    }

    public void test(Integer value, boolean flag, String name) {
        // do nothing
    }
}
```

:::

```console
javac ParametersTest.java
java ParametersTest
arg0
arg1
arg2

javac ParametersTest.java -parameters
java ParametersTest
value
flag
name
```

我们可以看到，在没有`-parameters`参数的情况下，参数名称是`arg0、arg1、arg2`，
而在有`-parameters`参数的情况下，参数名称是`value、flag、name`。
Mybatis正是利用这个特性，来辅助获取参数名称的。

## Mybatis参数名处理过程

1. 在Mybatis动态代理中将所有传入参数传入拦截方法
2. **参数名解析**，本文的答案就在这里
    - 优先@Param注解，若存在注解，直接使用指定名称
    - 若编译启用了`-parameters`编译参数，直接使用参数名，否则回退为arg0、arg1、arg2/param1、param2、param3等
    - 特殊对象处理，如果是Map类型使用key作为参数名，如果是POJO类型，直接访问属性名
3. 参数名映射，将解析后的参数名与SQL中的`#{xxx}`做匹配
4. 将参数值设置到PreparedStatement中

### 3.4- 版本

在Mybatis3.4以前是通过[MapperMethod](https://github.com/mybatis/mybatis-3/blob/3.3.x/src/main/java/org/apache/ibatis/binding/MapperMethod.java#L240-L260)做的参数处理，
不支持`-parameters`编译参数，所以需要`@Param`注解指定的参数名，否则会按照param1、param2、param3等作为默认参数。

::: code-group
```java [MapperMethod.java]{25-31,43-50}
public class MapperMethod {
    public static class MethodSignature {
        public MethodSignature(Configuration configuration, Method method) {
            // 省略其他代码...
            // 初始化代理方法的参数索引和参数名称的映射关系
            this.params = Collections.unmodifiableSortedMap(getParams(method, this.hasNamedParameters));
        }

        public Object convertArgsToSqlCommandParam(Object[] args) {
            final int paramCount = params.size();
            // 无参数
            if (args == null || paramCount == 0) {
                return null;
            } 
            // 没有@Param注解且只有一个参数
            else if (!hasNamedParameters && paramCount == 1) {
                return args[params.keySet().iterator().next().intValue()];
            } 
            // 有@Param注解或者有多个参数
            else {
                final Map<String, Object> param = new ParamMap<Object>();
                int i = 0;
                for (Map.Entry<Integer, String> entry : params.entrySet()) {
                    param.put(entry.getValue(), args[entry.getKey().intValue()]);
                    // issue #71, add param names as param1, param2...but ensure backward compatibility
                    // 自动生成param1、param2、param3等参数并向后兼容，索引从1开始
                    final String genericParamName = "param" + String.valueOf(i + 1);
                    // 若刚好有@Param注解命名规则也是param1、param2、param3等，那么就不覆盖
                    if (!param.containsKey(genericParamName)) {
                        param.put(genericParamName, args[entry.getKey()]);
                    }
                    i++;
                }
                return param;
            }
        }

        private SortedMap<Integer, String> getParams(Method method, boolean hasNamedParameters) {
            final SortedMap<Integer, String> params = new TreeMap<Integer, String>();
            final Class<?>[] argTypes = method.getParameterTypes();
            for (int i = 0; i < argTypes.length; i++) {
                if (!RowBounds.class.isAssignableFrom(argTypes[i]) && !ResultHandler.class.isAssignableFrom(argTypes[i])) {
                    // 参数索引key、value值，key为方法参数索引
                    // value为参数名称，mybatis需要的参数索引字符串或者@Param指定的参数名称
                    String paramName = String.valueOf(params.size());
                    if (hasNamedParameters) {
                        paramName = getParamNameFromAnnotation(method, i, paramName);
                    }
                    params.put(i, paramName);
                }
            }
            return params;
        }
    }
}
```
:::

### 3.4+ 版本

在3.4以后是通过[ParamNameResolver](https://github.com/mybatis/mybatis-3/blob/master/src/main/java/org/apache/ibatis/reflection/ParamNameResolver.java#L78-L128)做的参数处理，
支持`-parameters`编译参数，所以不强制需要`@Param`注解指定的参数名；若未开启`-parameters`编译参数，会按照arg0、arg1、arg2/param1、param2、param3等作为默认参数。

::: code-group
```java [ParamNameResolver.java]{23-28,80-86}
public class ParamNameResolver {
    public ParamNameResolver(Configuration config, Method method, Class<?> mapperClass) {
        // 省略其他代码...
        // get names from @Param annotations
        for (int paramIndex = 0; paramIndex < paramCount; paramIndex++) {
            if (isSpecialParameter(paramTypes[paramIndex])) {
                // skip special parameters
                continue;
            }
            String name = null;
            for (Annotation annotation : paramAnnotations[paramIndex]) {
                // 如果存在@Param注解 则直接使用注解指定的参数名 并且使用ParamMap
                if (annotation instanceof Param) {
                    hasParamAnnotation = true;
                    useParamMap = true;
                    name = ((Param) annotation).value();
                    break;
                }
            }
            // 不存在@Param注解
            if (name == null) {
                // @Param was not specified.
                // 使用class文件中实际参数名称 默认是开启的
                // 若开启了-parameters 则为实际参数名
                // 若未开启-parameters 则为arg0、arg1、arg2等
                if (useActualParamName) {
                    name = getActualParamName(method, paramIndex);
                }
                // 若未开启useActualParamName 则使用参数索引
                if (name == null) {
                    // use the parameter index as the name ("0", "1", ...)
                    // gcode issue #71
                    name = String.valueOf(map.size());
                }
            }
            map.put(paramIndex, name);
            typeMap.put(name, actualParamTypes[paramIndex]);
        }
        names = Collections.unmodifiableSortedMap(map);
        // 参数个数多于1个 则使用ParamMap
        if (names.size() > 1) {
            useParamMap = true;
        }
        // 若只有一个参数 且参数是集合 则直接使用集合作为参数
        if (names.size() == 1) {
            Type soleParamType = actualParamTypes[0];
            if (soleParamType instanceof GenericArrayType) {
                typeMap.put("array", soleParamType);
            } else {
                Class<?> soleParamClass = null;
                if (soleParamType instanceof ParameterizedType) {
                    soleParamClass = (Class<?>) ((ParameterizedType) soleParamType).getRawType();
                } else if (soleParamType instanceof Class) {
                    soleParamClass = (Class<?>) soleParamType;
                }
                if (Collection.class.isAssignableFrom(soleParamClass)) {
                    typeMap.put("collection", soleParamType);
                    if (List.class.isAssignableFrom(soleParamClass)) {
                        typeMap.put("list", soleParamType);
                    }
                }
            }
        }
    }

    public Object getNamedParams(Object[] args) {
        final int paramCount = names.size();
        if (args == null || paramCount == 0) {
            return null;
        }
        // 没有@Param注解且只有一个参数 若参数是集合转为Map
        if (!hasParamAnnotation && paramCount == 1) {
            Object value = args[names.firstKey()];
            return wrapToMapIfCollection(value, useActualParamName ? names.get(names.firstKey()) : null);
        } else {
            final Map<String, Object> param = new ParamMap<>();
            int i = 0;
            for (Map.Entry<Integer, String> entry : names.entrySet()) {
                param.put(entry.getValue(), args[entry.getKey()]);
                // add generic param names (param1, param2, ...)
                // 自动生成param1、param2、param3等参数并向后兼容，索引从1开始 最多10个
                final String genericParamName = i < 10 ? GENERIC_NAME_CACHE[i] : GENERIC_NAME_PREFIX + (i + 1);
                // ensure not to overwrite parameter named with @Param
                if (!names.containsValue(genericParamName)) {
                    param.put(genericParamName, args[entry.getKey()]);
                }
                i++;
            }
            return param;
        }
    }
}
```
:::

## 总结

- 问题1：为什么会出现`Parameter 'arg0' not found`

  因为开启了`-parameters`编译参数，所以Mybatis会按照参数名来解析参数，而不是按照参数索引来解析参数，所以修改Mapper中的SQL参数引用为实际参数名或者关闭`-parameters`编译参数即可。
- 问题2：为什么有的时候需要`@Param`注解，有的时候不需要？

  在开启了`-parameters`编译参数的情况下，不需要`@Param`注解，按照方法参数名引用；在未开启`-parameters`编译参数的情况下，需要`@Param`注解，且按照指定的参数名引用，否则只能通过arg0、arg1、arg2/param1、param2、param3引用。

SpringMvc中`@PathVariable`注解也是类似的，在开启了`-parameters`编译参数的情况下，不需要`@PathVariable`注解值(需要注解)，否则需要在注解中指定参数名称。

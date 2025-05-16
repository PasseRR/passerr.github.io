# vitepress使用技巧

## 代码块行号

~~~md
关闭行号
```java:no-line-numbers

```

开启行号
```java:line-numbers

```

开启行号并从10行开始
```java:line-numbers=10

```
~~~

## code-group

```md
::: code-group
<<< @/.vitepress/config.ts{2}

<<< @/.vitepress/config.ts{2}

<<< @/.vitepress/config.ts{2}
:::
```

代码块可以支持代码import语法

## 链接

可以通过{}添加链接属性
- 内链

```md
只需指定文档路径即可，不能使用相对路径如 
[MyBatis枚举类型绑定](/2022-08-09-mybatis-enum-bind){:target='_blank' rel="noreferrer"}
```

- 文件下载
```md
[pmd包](/assets/2022/01-20/p3c-pmd-2.1.1-jar-with-dependencies.jar){download}
```

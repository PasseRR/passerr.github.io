---
title:  MyBatis Plus基于注解的数据权限
tags: [mybatis, mybatis-plus, java]
cbf: false
---

## 概述

在日常项目开发中，很多时候会用到一些数据权限，比如部门、营业点、地区等。这里以部门为例，假设存在以下表：

### 1. 部门表(department)

| 字段           | 含义                |
|:-------------|:------------------|
| `id`         | 部门id              |
| name         | 部门名称              |
| parent_id    | 部门父id             |
| full_id_path | 部门id全路径(用于查询下属部门) |

### 2. 用户表(user)

| 字段   | 含义   |
|:-----|:-----|
| `id` | 用户id |
| code | 用户帐号 |
| name | 用户姓名 |

### 3. 用户部门关系表(user_department)

| 字段              | 含义   |
|:----------------|:-----|
| `user_id`       | 用户id |
| `department_id` | 部门id |

### 4. 业务订单表(order)

| 字段            | 含义   |
|:--------------|:-----|
| id            | 订单id |
| amount        | 订单金额 |
| department_id | 所属部门 |

忽略以上表字段的严谨性，假如用户需求为：`根据登录用户所在部门(可能为多个)查询所在部门(或所有在部门及下级部门)的订单列表`，
倘若只有一个这样的需求，你可能只需要用order关联user_department就可以了，
若要查询下级部门再关联department的full_id_path前缀匹配，若项目上的业务数据大多都与department相关，就需要写很多个这样的关联。

## 准备工作

笔者开发时基于mybatis-plus的[3.4.3.2](https://github.com/baomidou/mybatis-plus/tree/v3.4.3.2)

### mp本身提供了一个[DataPermissionInterceptor](https://github.com/baomidou/mybatis-plus/blob/v3.4.3.2/mybatis-plus-extension/src/main/java/com/baomidou/mybatisplus/extension/plugins/inner/DataPermissionInterceptor.java)数据权限拦截器

```java
public class DataPermissionInterceptor extends JsqlParserSupport implements InnerInterceptor {
    // 数据权限过滤Where条件语句生成    
    private DataPermissionHandler dataPermissionHandler;

    @Override
    public void beforeQuery(Executor executor, MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
        // 只要没有@InterceptorIgnore注解中dataPermission为true都会执行数据权限
        if (InterceptorIgnoreHelper.willIgnoreDataPermission(ms.getId())) return;
        PluginUtils.MPBoundSql mpBs = PluginUtils.mpBoundSql(boundSql);
        mpBs.sql(parserSingle(mpBs.sql(), ms.getId()));
    }

    @Override
    protected void processSelect(Select select, int index, String sql, Object obj) {
        SelectBody selectBody = select.getSelectBody();
        if (selectBody instanceof PlainSelect) {
            this.setWhere((PlainSelect) selectBody, (String) obj);
        } else if (selectBody instanceof SetOperationList) {
            SetOperationList setOperationList = (SetOperationList) selectBody;
            List<SelectBody> selectBodyList = setOperationList.getSelects();
            selectBodyList.forEach(s -> this.setWhere((PlainSelect) s, (String) obj));
        }
    }

    /**
     * 设置 where 条件
     *
     * @param plainSelect  查询对象
     * @param whereSegment 查询条件片段
     */
    protected void setWhere(PlainSelect plainSelect, String whereSegment) {
        // 数据权限的核心就在过滤条件 这里是根据msId的sql追加过滤条件
        Expression sqlSegment = dataPermissionHandler.getSqlSegment(plainSelect.getWhere(), whereSegment);
        if (null != sqlSegment) {
            plainSelect.setWhere(sqlSegment);
        }
    }
}
```

由源码可知，mp集成jsqlparser(继承JsqlParserSupport实现)运行时根据条件动态追加过滤条件

## 开发过程

笔者希望通过在mapper的方法上添加一个数据权限注解，来实现无感知的数据权限开发

### 1. 注解定义
    
```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DepartmentDataPermission {
    /**
     * 查询主数据字段 若存在别名 自行拼接
     * @return 字段名称
     */
    String value();
    /**
     * 是否包含子部门数据 若用户所属上级部门 true则表示所有下级部门数据都能看 否则只能看所属部门数据
     * @return true/false
     */
    boolean includeChildren() default false;
}
```

### 2. 拦截器定义

```java
public class DataPermissionInterceptor extends JsqlParserSupport implements InnerInterceptor {
    /**
    * 不存在数据权限注解标识
    */
    private static final Object NOT_EXISTS = Void.class;
    /**
    * 数据权限注解缓存
    */
    private static final Map<String, Object> CACHE = new HashMap<>(16);
    /**
    * 分页查询统计后缀
    */
    private static final String PAGE_COUNT_SUFFIX = "_COUNT";
    /**
     * 固定的SELECT 1元素
     */
    private static final List<SelectItem> SELECT_1_ITEM =
    Collections.singletonList(new SelectExpressionItem(new LongValue(1)));

    @Override
    public void beforeQuery(Executor executor, MappedStatement ms, Object parameter, RowBounds rowBounds,
                            ResultHandler resultHandler, BoundSql boundSql) {
        String msId = ms.getId();
        if (InterceptorIgnoreHelper.willIgnoreDataPermission(msId)) {
            return;
        }

        // page helper分页查询统计sql
        if (msId.endsWith(PAGE_COUNT_SUFFIX)) {
            msId = msId.substring(0, msId.length() - PAGE_COUNT_SUFFIX.length());
        }

        // mybatis-plus-join查询 直接返回 若要使用这种查询 default方法重写
        if (msId.contains(StringConstants.UNDER_SCORE)) {
            return;
        }

        // 不存在注解 直接返回
        if (CACHE.computeIfAbsent(msId, DataPermissionInterceptor::touchAnnotation) == NOT_EXISTS) {
            return;
        }

        PluginUtils.MPBoundSql mpBs = PluginUtils.mpBoundSql(boundSql);
        mpBs.sql(parserSingle(mpBs.sql(), msId));
    }

    @Override
    protected void processSelect(Select select, int index, String sql, Object obj) {
        SelectBody selectBody = select.getSelectBody();
        if (!(selectBody instanceof PlainSelect)) {
            log.warn("数据权限查询类型为不支持的类型{}", selectBody.getClass().getName());
            throw new MaginaException("数据权限仅支持简单查询语句");
        }

        // 缓存的权限注解
        DepartmentDataPermission annotation = (DepartmentDataPermission) CACHE.get(String.valueOf(obj));

        PlainSelect plainSelect = (PlainSelect) selectBody;
        // where后面的条件
        List<Expression> conditions = new ArrayList<>();
        Optional.ofNullable(plainSelect.getWhere()).ifPresent(conditions::add);
        // 根据会话获取用户id 根据项目实际修改
        Long userId = 1L;
        // 关联列名
        String field = annotation.value();
        if(annotation.includeChildren()) {
            // 所在部门及子级部门
            conditions.add(resolveDepartmentIncludeChildren(userId, field));
        } else {
            // 只查询所在部门
            conditions.add(resolveDepartmentExcludeChildren(userId, field));
        }
        
        plainSelect.setWhere(new MultiAndExpression(conditions));
    }

    static Expression resolveDepartmentIncludeChildren(Long userId, String field) {
       // 业务数据关联部门表
       Table sourceDept = new Table().withName("department").withAlias(new Alias("d1", false));
       // 用户部门用户关系表
       Table targetDeptUsr = new Table().withName("user_department").withAlias(new Alias("ud", false));
       // 用户部门表
       Table targetDept = new Table().withName("department").withAlias(new Alias("d2", false));

       return
           // 使用连续的连个exist子句 这里未考虑效率问题
           // 生成的sql形如 
           // exists(select 1 from department d1 where d1.id = field 
           // and exists(select 1 from user_department ud inner join department d2 
           // on ud.department_id = d2.id and ud.user_id = 1 
           // where d1.full_id_path like concat(d2.full_id_path, '%')))
           new ExistsExpression().withRightExpression(
               new SubSelect().withSelectBody(
                   new PlainSelect().withSelectItems(SELECT_1_ITEM)
                       .withFromItem(sourceDept)
                       .withWhere(
                           new MultiAndExpression(
                               Arrays.asList(
                                   new EqualsTo(
                                       new Column(sourceDept, "id"),
                                       new Column(field)
                                   ),
                                   new ExistsExpression().withRightExpression(
                                       new SubSelect().withSelectBody(
                                           new PlainSelect().withSelectItems(SELECT_1_ITEM)
                                               // 查询登录用户的部门信息
                                               .withFromItem(targetDeptUsr)
                                               .addJoins(
                                                   new Join().withInner(true).withRightItem(targetDept)
                                                       .addOnExpression(
                                                           new MultiAndExpression(
                                                               Arrays.asList(
                                                                   new EqualsTo(
                                                                       new Column(targetDeptUsr, "department_id"),
                                                                       new Column(targetDept, "id")
                                                                   ),
                                                                   new EqualsTo(
                                                                       new Column(targetDeptUsr, "id"),
                                                                       new LongValue(userId)
                                                                   )
                                                               )
                                                           )
                                                       )
                                               )
                                               .withWhere(
                                                   // 根据使用数据库情况拼接like表达式
                                                   new LikeExpression()
                                                       .withLeftExpression(
                                                           new Column(sourceDept, "full_id_path")
                                                       )
                                                       .withRightExpression(
                                                           new Function().withName("CONCAT")
                                                                .withParameters(
                                                                    new ExpressionList(
                                                                        new Column(targetDept, "full_id_path"),
                                                                        new StringValue("%")
                                                                   )
                                                                )
                                                           )
                                                       )
                                               )
                                       )
                                   )
                               )
                           )
                       )
               );
    }
    
    // 只查询所在部门的条件生成
    static Expression resolveDepartmentExcludeChildren(Long userId, String field) {
        // 外层exist部门用户关系表
        Table outerDeptUsr = new Table().withName("user_department").withAlias(new Alias("ud", false));

        return
            // 登录用户部门关系中存在业务数据部门id即可
            // 生成sql形如 exists(select 1 from user_department ud where ud.user_id = 1 and ud.department_id = field)
            new ExistsExpression().withRightExpression(
                new SubSelect().withSelectBody(
                    new PlainSelect().withSelectItems(SELECT_1_ITEM)
                        // 查询登录用户的部门信息
                        .withFromItem(outerDeptUsr)
                        .withWhere(
                            new MultiAndExpression(
                                Arrays.asList(
                                    new EqualsTo(
                                        new Column(outerDeptUsr, "user_id"),
                                        new LongValue(userId)
                                    ),
                                    new EqualsTo(
                                        new Column(outerDeptUsr, "department_id"),
                                        new Column(field)
                                    )
                                )
                            )
                        )
                )
            );
    }

    /**
     * 获取方法或mapper接口上的注解
     * @param mappedStatementId 方法id
     * @return 注解
     */
    static Object touchAnnotation(Object mappedStatementId) {
        // 根据msId反射获取mapper的方法
        Method method = MappedStatementUtils.method(String.valueOf(mappedStatementId));
        
        return 
            Optional.ofNullable(AnnotationUtils.getMethodOrClassAnnotation(method, DepartmentDataPermission.class))
                .orElse(NOT_EXISTS);
    }
}   
```

### 3. 配置拦截器

```java
@Configuration
public class MyBatisPlusConfigurer {
    @Bean
    public InnerInterceptor dataPermissionInnerInterceptor(){
        // 数据权限拦截器
        return new DataPermissionInterceptor();
    }

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor(ObjectProvider<List<InnerInterceptor>> provider) {
        // 主拦截器配置
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        provider.getIfAvailable(ArrayList::new).forEach(interceptor::addInnerInterceptor);
        return interceptor;
    }
}
```

### 4. 代码使用

```java
public interface OrderMapper extends BaseMapper<Order> {
    // 可以重写BaseMapper的方法 加DataPermission注解同样生效
    // 不包括子级部门
    @DepartmentDataPermission("department_id")
    List<Order> listStrict();
    // 包括子级部门
    @DepartmentDataPermission(value = "department_id", includeChildren = true)
    List<Order> listAll();
}
```

## 结语

多租户、动态的数据权限都可以通过这种方式实现，只要能拼sql，剩下的工作我相信你都会了，只是需要多熟悉下jsqlparser的API用法。

::: danger 注意

在结合[PageHelper](https://github.com/pagehelper/Mybatis-PageHelper)
做带有数据权限的分页时遇到过一个问题，
jsqlparser版本过低导致分页的`LIMIT`和`OFFSET`两个关键字位置不一样导致分页不生效，
处理方法更新PageHelper使得和MP的jsqlparser的版本一致。

:::

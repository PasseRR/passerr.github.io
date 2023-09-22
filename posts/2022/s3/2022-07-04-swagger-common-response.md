---
title:  Swagger统一应答类型处理
tags: [java]
---

## 需求描述
在rest接口定义统一应答时，我们通常会定义code、message、以及一个泛型的data，有时候泛型参数过长，会导致controller
方法很长，我借助Spring的`ResponseBodyAdvice`来做统一应答拦截，但是，swagger只会读取实际的方法返回类型作为应答。
如何使用swagger来实现类似ResponseBodyAdvice的功能呢？

## Spring报文统一拦截定义

### 应答状态定义
```java
@Getter
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public enum RestState implements Stateful {
    /**
     * 正常应答
     */
    OK(200, "ok"),
    /**
     * 参数解析异常
     */
    BAD_REQUEST(400, "参数解析失败"),
    /**
     * 未授权
     */
    UNAUTHORIZED(401, "认证失败"),
    /**
     * 禁止访问
     */
    FORBIDDEN(403, "禁止访问"),
    /**
     * 方法不支持
     */
    METHOD_NOT_ALLOWED(405, "Http方法不支持"),
    /**
     * 未被接受的
     */
    NOT_ACCEPTABLE(406, "未被接受"),
    /**
     * 不支持媒体类型
     */
    UNSUPPORTED_MEDIA_TYPE(415, "媒体类型不支持"),
    /**
     * 内部错误 需要额外指定错误消息
     */
    INTERNAL_SERVER_ERROR(500, "系统错误"),
    /**
     * 网关错误
     */
    BAD_GATEWAY(502, "网关错误"),
    /**
     * 服务不可用
     */
    SERVICE_UNAVAILABLE(503, "服务不可用");

    /**
     * 状态码
     */
    int code;
    /**
     * 默认业务信息
     */
    String message;

    /**
     * 根据给定错误码获取{@link RestState}
     * @param code         错误码
     * @param defaultState 若未获取到默认状态
     * @return {@link RestState}
     */
    public static RestState getOrDefault(int code, RestState defaultState) {
        return Optional.ofNullable(Enumerable.get(RestState.class, code)).orElse(defaultState);
    }
}
```

### 统一应答实体定义
```java
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder(access = AccessLevel.PROTECTED)
@ApiModel(description = "Rest响应信息")
@AllArgsConstructor
@NoArgsConstructor
public class RestResponse<T> {
    /**
     * 状态码
     */
    @ApiModelProperty(value = "响应码", example = "200")
    Integer code;
    /**
     * 业务消息
     */
    @ApiModelProperty(value = "业务消息", example = "ok")
    String message;
    /**
     * debug消息
     */
    @ApiModelProperty("开发调试消息")
    String developerMessage;
    /**
     * 业务实体
     */
    @ApiModelProperty("业务数据")
    T data;

    /**
     * 正常应答
     * @param data 应答实体
     * @param <T>  实体类型
     * @return {@link RestResponse}
     */
    public static <T> RestResponse<T> ok(T data) {
        return RestResponse.ok(data, null);
    }

    /**
     * 正常应答
     * @param message 应答消息
     * @return {@link RestResponse}
     */
    public static RestResponse<Void> ok(String message) {
        return RestResponse.ok(null, message);
    }

    /**
     * 正常应答
     * @param data    应答实体
     * @param message 应答消息
     * @param <T>     实体类型
     * @return {@link RestResponse}
     */
    public static <T> RestResponse<T> ok(T data, String message) {
        return RestState.OK.response(data, message);
    }

    /**
     * 应答码是否是200
     * @return true/false
     */
    @Transient
    public boolean isOk() {
        return Objects.equals(this.code, RestState.OK.getCode());
    }
}
```

### 报文拦截定义
```java
@RestControllerAdvice
public class GlobalResponseBodyAdvice implements ResponseBodyAdvice<Object> {
    /**
     * 需要忽略的controller
     */
    private static final Set<String> IGNORE_CLASSES = Collections.unmodifiableSet(
        new HashSet<>(
            Arrays.asList(
                "springfox.documentation.swagger.web.ApiResourceController",
                "springfox.documentation.swagger2.web.Swagger2ControllerWebMvc"
            )
        )
    );

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        // 不对swagger的rest接口做包装
        if (IGNORE_CLASSES.contains(returnType.getDeclaringClass().getName())) {
            return false;
        }

        return
            // 本身就是RestResponse或子类
            !returnType.getParameterType().isAssignableFrom(RestResponse.class)
                // void返回类型 一般文件下载
                && void.class != returnType.getParameterType();
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest request, ServerHttpResponse response) {
        // 自动添加包装
        return RestResponse.ok(body);
    }
}
```

## Swagger插件处理应答拦截

### 模型提供插件
```java
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class FarioOperationModelsProviderPlugin implements OperationModelsProviderPlugin {
    TypeResolver typeResolver;

    @Override
    public void apply(RequestMappingContext ctx) {
        Class<?> clazz = ctx.getReturnType().getErasedType();
        // 若返回类型是void或RestResponse则不做包装 根据需要进行调整
        boolean needWrapperReturnType = SpringFoxUtils.needWrapperReturnType(clazz);
        if (needWrapperReturnType) {
            // 注册统一包装类型
            ctx.operationModelsBuilder().addReturn(this.typeResolver.resolve(RestResponse.class, clazz));
        }
    }


    @Override
    public boolean supports(DocumentationType documentationType) {
        return true;
    }
}
```

### Operation构建插件
```java
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class FarioOperationBuilderPlugin implements OperationBuilderPlugin {
    TypeResolver typeResolver;
    SchemaPluginsManager schemaPluginsManager;
    DocumentationPluginsManager documentationPluginsManager;
    ModelSpecificationFactory modelSpecificationFactory;

    @Override
    public void apply(OperationContext ctx) {
        Class<?> clazz = ctx.getReturnType().getErasedType();
        // 若返回类型是void或RestResponse则不做包装 根据需要进行调整
        boolean needWrapperReturnType = SpringFoxUtils.needWrapperReturnType(clazz);
        if (needWrapperReturnType) {
            this.doWrapper(ctx, this.typeResolver.resolve(RestResponse.class, clazz));
        }
    }

    protected void doWrapper(OperationContext ctx, ResolvedType returnType) {
        int httpStatusCode = ResponseMessagesReader.httpStatusCode(ctx);
        String message = ResponseMessagesReader.message(ctx);
        ResponseContext responseContext = new ResponseContext(ctx.getDocumentationContext(), ctx);
        ViewProviderPlugin viewProvider =
            this.schemaPluginsManager.viewProvider(
                ctx.getDocumentationContext().getDocumentationType());
        if (!isVoid(returnType)) {
            ModelContext modelContext = ctx.operationModelsBuilder()
                .addReturn(returnType, viewProvider.viewFor(ctx));

            Set<MediaType> produces = new HashSet<>(ctx.produces());
            if (produces.isEmpty()) {
                produces.add(MediaType.ALL);
            }
            produces
                .forEach(mediaType ->
                    responseContext.responseBuilder()
                        .representation(mediaType)
                        .apply(r ->
                            r.model(m ->
                                m.copyOf(this.modelSpecificationFactory.create(modelContext, returnType))
                            )
                        )
                );
        }

        responseContext.responseBuilder().description(message).code(String.valueOf(httpStatusCode));
        ctx.operationBuilder()
            .responses(Collections.singleton(this.documentationPluginsManager.response(responseContext)));
    }

    @Override
    public boolean supports(DocumentationType documentationType) {
        return true;
    }
}
```

### 插件配置

```java
@Configuration(proxyBeanMethods = false)
class SwaggerPluginConfiguration {
    @Bean
    FarioOperationModelsProviderPlugin farioOperationModelsProviderPlugin(TypeResolver typeResolver) {
        return new FarioOperationModelsProviderPlugin(typeResolver);
    }

    @Bean
    FarioOperationBuilderPlugin farioOperationBuilderPlugin(TypeResolver typeResolver,
                                                            SchemaPluginsManager schemaPluginsManager,
                                                            DocumentationPluginsManager documentationPluginsManager,
                                                            ModelSpecificationFactory modelSpecificationFactory) {
        return 
            new FarioOperationBuilderPlugin(
                typeResolver, 
                schemaPluginsManager, 
                documentationPluginsManager, 
                modelSpecificationFactory
            );
    }
}
```

## 测试

### 接口代码
```java
@RestController
@RestController
@RequestMapping("/test")
@Api(tags = "测试")
public static class TestController {
    @Data
    @ApiModel
    @Accessors(chain = true)
    static class Person {
        @ApiModelProperty("姓名")
        String name;
        @ApiModelProperty("年龄")
        Integer age;
    }

    @GetMapping
    @ApiOperation("get")
    public Person get() {
        return new Person().setName("张三").setAge(10);
    }

    @PutMapping
    @ApiOperation("put")
    public RestResponse<Boolean> update() {
        return RestResponse.ok(true);
    }
}
```

### 测试结果
- get方法 自动添加统一应答包装

  [![p1][1]][1]{target=_blank class=no-icon}
- put方法 使用默认返回

  [![p2][2]][2]{target=_blank class=no-icon}

[1]: /assets/2022/07-04/get.png "get"
[2]: /assets/2022/07-04/put.png "put"
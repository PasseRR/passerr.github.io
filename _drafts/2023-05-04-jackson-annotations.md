---
layout: post
title:  Jackson注解
categories: [java]
last_modified_at: 2023-05-04
toc: true
---

## 介绍

Jackson的注解主要在[jackson-annotations](https://github.com/FasterXML/jackson-annotations){:target="_blank"}
及[jackson-databind](https://github.com/FasterXML/jackson-databind){:target="_blank"}中，主要分为以下几种类型

| 类型         | 作用                   | 示例                        |
|:-----------|:---------------------|:--------------------------|
| 序列化、反序列化注解 | 同时影响序列化和反序列化过程       | @JsonIgnore、@JsonProperty |
| 仅序列化注解     | 仅影响对象序列化过程           | @JsonGetter、@JsonValue    |
| 仅反序列化注解    | 仅影响json反序列化对象过程      | @JonsSetter、@JsonCreator  | 
| 元注解        | 用于将多个注解组合为一个容器注解的元注解 | @JacksonAnnotationsInside |

## 序列化、反序列化注解
序列化、反序列化注解有的是一个注解就同时影响序列化与反序列化，有的是一对注解分别来分别控制。

### [@JsonAnyGetter](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonAnyGetter.java){:target="_blank"}/[@JsonAnySetter](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonAnySetter.java){:target="_blank"}

### [@JsonAutoDetect](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonAutoDetect.java){:target="_blank"}

### [@JsonValue](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonValue.java){:target="_blank"}/[@JsonCreator](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonCreator.java){:target="_blank"}

### [@JsonFormat](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonFormat.java){:target="_blank"}

### [@JsonGetter](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonGetter.java){:target="_blank"}/[@JsonSetter](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonSetter.java){:target="_blank"}

### [@JsonIgnore](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonIgnore.java){:target="_blank"}

### [@JsonIgnoreProperties](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonIgnoreProperties.java){:target="_blank"}

### [@JsonIgnoreType](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonIgnoreType.java){:target="_blank"}

### [@JsonProperty](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonProperty.java){:target="_blank"}

### [@JsonUnwrapped](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonUnwrapped.java){:target="_blank"}

### [@JsonSerialize](https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/annotation/JsonSerialize.java){:target="_blank"}/[@JsonDeserialize](https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/annotation/JsonDeserialize.java){:target="_blank"}

## 仅序列化注解

### [@JsonEnumDefaultValue](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonEnumDefaultValue.java){:target="_blank"}

### [@JsonInclude](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonInclude.java){:target="_blank"}

### [@JsonIncludeProperties](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonIncludeProperties.java){:target="_blank"}

### [@JsonKey](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonKey.java){:target="_blank"}

一个对象中，只能有一个@JsonKey注解在字段或者getter上，多个会报错。

### [@JsonPropertyOrder](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonPropertyOrder.java){:target="_blank"}

### [@JsonRawValue](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonRawValue.java){:target="_blank"}

### [@]


## 仅反序列化注解

### [@JsonAlias](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonAlias.java){:target="_blank"}

### [@JsonMerge](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonMerge.java){:target="_blank"}

- 基础类型不做合并
- 普通对象，按照属性依次合并
- map类型，按照entry依次合并
- 集合类型，追加输入元素合并
- 数组类型，创建新的数组追加输入元素合并

## 特殊注解

一般不常用或需要搭配[ObjectMapper](https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/ObjectMapper.java){:target="_blank"}使用，也可能需要多个注解搭配使用。

### [@JacksonInject](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JacksonInject.java){:target="_blank"}

### [@JsonBackReference](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonBackReference.java){:target="_blank"}、[@JsonManagedReference](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonManagedReference.java){:target="_blank"}

### [@JsonClassDescription](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonClassDescription.java){:target="_blank"}、[@JsonPropertyDescription](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonPropertyDescription.java){:target="_blank"}

### [@JsonFilter](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonFilter.java){:target="_blank"}

### [@JsonIdentityInfo](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonIdentityInfo.java){:target="_blank"}、[@JsonIdentityReference](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonIdentityReference.java){:target="_blank"}

### [@JsonRootName](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonRootName.java){:target="_blank"}

需要配置mapper.enable(SerializationFeature.WRAP_ROOT_VALUE)使用，反序列化不生效

### [@JsonTypeId](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonTypeId.java){:target="_blank"}、[@JsonTypeInfo](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonTypeInfo.java){:target="_blank"}、[@JsonSubTypes](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonSubTypes.java){:target="_blank"}、[@JsonTypeName](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonTypeName.java){:target="_blank"}

### [@JsonView](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JsonView.java){:target="_blank"}

## 元注解

### [@JacksonAnnotation](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JacksonAnnotation.java){:target="_blank"}

### [@JacksonStdImpl](https://github.com/FasterXML/jackson-databind/blob/2.16/src/main/java/com/fasterxml/jackson/databind/annotation/JacksonStdImpl.java){:target="_blank"}
标记注解 用于标记实现是jackson自用的标准实现

### [@JacksonAnnotationsInside](https://github.com/FasterXML/jackson-annotations/blob/2.16/src/main/java/com/fasterxml/jackson/annotation/JacksonAnnotationsInside.java){:target="_blank"}

用户自定义注解

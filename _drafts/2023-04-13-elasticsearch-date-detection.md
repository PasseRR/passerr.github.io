---
layout: post
title:  记一次ElasticSearch自动将字符串转日期类型问题
categories: [java]
last_modified_at: 2023-04-07
toc: true
---

字符串形如年月格式，`2021-12`、`2021-55`，
若第一条数据满足日期格式，则mapping会被处理为`date`类型，再入库`2021-55`就会报日期解析错误。

https://www.elastic.co/guide/en/elasticsearch/reference/8.7/dynamic-field-mapping.html#date-detection

https://www.elastic.co/guide/en/elasticsearch/reference/8.7/mapping-date-format.html#strict-date-time

```java
CreateIndexRequest.of(c -> c
        .index(index)
        .settings(s -> s.numberOfShards("2").numberOfReplicas("1"))
        .mappings(m -> m
            .properties("location", v -> v.geoPoint(GeoPointProperty.of(p -> p.ignoreZValue(true))))
            // text 会分词，然后索引 支持模糊，精确搜索 不支持聚合
            // keyword 直接索引 支持模糊，精确搜索 支持聚合
            .properties("id", v -> v.keyword(KeywordProperty.of(p -> p.index(true))))
            .properties("pripid", v -> v.keyword(KeywordProperty.of(p -> p.index(true))))
            .properties("industry_phy", v -> v.keyword(KeywordProperty.of(p -> p.index(true))))
            .properties("industry_co", v -> v.keyword(KeywordProperty.of(p -> p.index(true))))
            .properties("est_date", v -> v.date(DateProperty.of(p -> p.index(true))))
            .properties("can_date", v -> v.date(DateProperty.of(p -> p.index(true))))
            .properties("rev_date", v -> v.date(DateProperty.of(p -> p.index(true))))
            .properties("mo_date", v -> v.date(DateProperty.of(p -> p.index(true))))
            .properties("mi_d_code", v -> v.keyword(KeywordProperty.of(p -> p.index(true))))
            .properties("mo_d_code", v -> v.keyword(KeywordProperty.of(p -> p.index(true))))
            .properties("d_code", v -> v.keyword(KeywordProperty.of(p -> p.index(true))))
            .properties("d_code4", v -> v.keyword(KeywordProperty.of(p -> p.index(true))))
            .properties("ent_type", v -> v.keyword(KeywordProperty.of(p -> p.index(true))))
            .properties("label_10", v -> v.keyword(KeywordProperty.of(p -> p.index(true))))
            // 1：东部地区，2：中部地区，3-西部地区，4：东北地区
            .properties("label_4", v -> v.keyword(KeywordProperty.of(p -> p.index(true))))
            // "1": "长三角","2": "珠三角","3": "京津冀","4": "环渤海","5": "中原经济区"
            .properties("label_5", v -> v.keyword(KeywordProperty.of(p -> p.index(true))))
            .properties("name", v -> v.text(TextProperty.of(p -> p.fielddata(true))))
            // 1-企业、2-个体、3-外资
            .properties("type", v -> v.keyword(KeywordProperty.of(p -> p.index(true))))
            .dateDetection(false)
        )
    );
```
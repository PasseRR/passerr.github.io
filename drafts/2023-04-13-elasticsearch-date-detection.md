---
title:  记一次ElasticSearch自动将字符串转日期类型问题
tags: [java]
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

在Elasticsearch中，字段类型可以根据索引的数据动态自动转换。这意味着如果你在索引中插入一个新文档，Elasticsearch会尝试根据插入的值自动确定字段的类型，并将其保存为该类型。

默认情况下，Elasticsearch的字段类型自动转换功能是开启的，它会根据以下规则尝试自动推断字段类型：

如果字段第一次出现并包含一个整数类型的值，则该字段将被推断为整数类型（"integer"或"long"）。
如果字段第一次出现并包含一个浮点类型的值，则该字段将被推断为浮点类型（"float"或"double"）。
如果字段第一次出现并包含一个日期类型的值，则该字段将被推断为日期类型（"date"）。
如果字段第一次出现并包含一个布尔类型的值（"true"或"false"），则该字段将被推断为布尔类型（"boolean"）。
如果字段第一次出现并包含一个字符串类型的值，则该字段将被推断为字符串类型（"text"或"keyword"）。
自动字段类型转换在一定程度上可以简化索引数据的过程，但也可能会导致数据类型不一致的问题。如果数据类型在索引的过程中发生了变化，可能会导致搜索、聚合和排序等操作出现问题。

为了确保数据的一致性和正确性，建议在索引数据之前显式地定义字段的类型，并且尽量避免在同一字段中存储不同数据类型的值。你可以通过映射(mapping)明确指定字段的类型，以及设置日期字段的日期格式，避免不必要的自动类型转换。

需要注意的是，Elasticsearch的行为可能因版本不同而有所变化。
因此，建议查阅当前版本的官方文档以了解字段类型自动转换的最新信息。

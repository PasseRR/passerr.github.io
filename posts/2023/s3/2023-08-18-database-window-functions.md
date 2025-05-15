---
title:  数据库窗口函数
tags: [postgresql, 数据库]
---

::: tip 什么是数据库窗口函数(Window Functions)?

数据库窗口函数(在Oracle数据库中被称作分析函数，即Analytic Functions)
是一种用于在SQL查询中执行分析和聚合操作的功能。它们允许您在查询结果集中的特定“窗口”或“分区”上执行计算，并返回结果集中的每一行与该窗口的计算结果相关联。
窗口函数通常与`OVER`子句一起使用，以定义窗口的大小和排序方式。

数据库窗口函数用于执行各种分析任务，如排名、累积总和、平均值、比较当前行与前一行的值等。它们通常用于数据仓库、分析和报表等应用中，以便更灵活地处理数据。
:::

- [Oracle分析函数](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Analytic-Functions.html)
- [MySQL窗口函数](https://dev.mysql.com/doc/refman/8.0/en/window-functions.html) (8+)
- [PostgreSQL窗口函数](https://www.postgresql.org/docs/current/tutorial-window.html) (11+)

以下代码示例以均为`PostgreSQL`。

## 窗口函数有哪些使用场景？

- 排名和排名分组  
  可以使用窗口函数来为数据集中的行分配排名、密度排名或分组排名。这对于查找前N项、查找排名最高或最低的数据行非常有用
- 移动平均和累积总计  
  窗口函数可以用于计算移动平均或累积总计，例如计算销售额的滚动平均值或累积销售额
- 比较行与前一行或下一行  
  可以使用窗口函数来比较当前行与前一行或下一行的值，以便检测变化或趋势
- 分组计算统计信息  
  窗口函数允许你在不破坏原始数据行的情况下进行分组计算，例如计算每个组的平均值、最大值、最小值等
- 累积百分位数  
  使用窗口函数可以计算某一列的百分位数，例如，你可以找到每天的销售额中位数
- 时间序列分析  
  在时间序列数据中，窗口函数可以用于计算滞后、领先和时间窗口内的统计数据
- 数据间的比较  
  你可以使用窗口函数来比较不同数据行之间的值，以查找异常值或识别与平均值的偏差
- 分析复杂查询  
  当需要在查询中执行多个聚合操作时，窗口函数可以避免重复扫描数据，提高查询性能

## 窗口函数语法

一般窗口函数只会用在`SELECT`子句中，`OVER`子句是窗口函数的核心部分，它定义了窗口分区规则、窗口范围和排序规则，
参考[PostgreSQL Window Function Calls](https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-WINDOW-FUNCTIONS)。

```sql
SELECT "窗口函数名称1"("argument") OVER (
    -- 分区
    PARTITION BY partition_column(s)
    -- 排序
    ORDER BY order_column(s)
    -- 窗口大小定义
    frame_clause
),
"窗口函数名称2"("argument") OVER (w)
FROM "your_table"
-- 可重复使用的窗口定义
WINDOW w AS(PARTITION BY column1 ORDER BY column2),
    -- 基于前面定义的窗口进一步追加
    w1 AS(w CURRENT ROW)
```

### PARTITION BY子句

可选项，用于定义窗口函数分区，按照分区的列划分为多个分区，窗口函数将在每个分区内独立计算。

### ORDER BY子句

可选项，用于定义窗口内数据的排序。 

### 窗口大小(frame_clause)子句

```sql
{ RANGE | ROWS | GROUPS } frame_start [ frame_exclusion ]
{ RANGE | ROWS | GROUPS } BETWEEN frame_start AND frame_end [ frame_exclusion ]
```

#### 窗口模式

`RANGE`是指值(排序值)范围，`ROWS`是指记录行范围，`GROUPS`是指值(排序值)分组范围。

::: warning 注意
在使用`RANGE`、`GROUPS`定义   窗口时必须存在排序字段，当使用`RANGE`时只能有一个排序字段。
:::

#### frame_start/frame_end

- `UNBOUNDED PRECEDING`：当前行前面所有
- *`offset`*` PRECEDING`：前offset条
- `CURRENT ROW`：当前行位置
- *`offset`*` FOLLOWING`：后offset条
- `UNBOUNDED FOLLOWING`：当前行后面所有

::: warning 注意
- *offset*必须是一个不包含变量、聚合函数、窗口函数的表达式
- 在ROWS、GROUPS模式下，*offset*必须为一个`非空且非负整数`
- 在RANGE模式下，*offset*表达式依赖于`排序字段的类型`，且必须`非空`

    ```sql
    -- 假如当前行的值为c
    -- date/timestamp类型 表示范围[c - '2 days', c + '2 weeks']
    RANGE BETWEEN INTERVAL '2 days' PRECEDING AND INTERVAL '2 weeks' FOLLOWING
    -- 数字类型 表示范围[c - 1, c + 2]
    RANGE BETWEEN 1 PRECEDING AND 2 FOLLOWING
    ```
- 在GROUPS模式下，*offset*表示按照排序字段分组后的偏移量，即根据当前值在分组中的位置，向前后偏移量范围
:::

结合ARRAY_AGG，详细区分ROWS、RANGE、GROUPS示例

```sql
WITH "t"("id", "v") AS (VALUES (1, 1), (2, 1), (3, 5), (4, 3), (5, 6), (6, 5), (7, 6))
SELECT "id",
    "v",
    ARRAY_AGG("id") OVER "rows"   AS "rows_id",
    ARRAY_AGG("v") OVER "rows"    AS "rows_v",
    ARRAY_AGG("id") OVER "range"  AS "range_id",
    ARRAY_AGG("v") OVER "range"   AS "range_v",
    ARRAY_AGG("id") OVER "groups" AS "groups_id",
    ARRAY_AGG("v") OVER "groups"  AS "groups_v"
FROM "t"
    WINDOW
        -- 按照值排序
        "o" AS (ORDER BY "v"),
        -- 行记录范围 当前值所在行及前后1行
        "rows" AS ("o" ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING),
        -- 值范围 当前行值减一到当前行值加一
        "range" AS ("o" RANGE BETWEEN 1 PRECEDING AND 1 FOLLOWING),
        -- 分组范围 当前行值分组及前后1分组
        "groups" AS ("o" GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING)
```
![mode][1]
::: details 结果解释

记录值分组后结果为{1, 3, 5, 6}，只取id为1、4、5、7的行记录解释

- id为1的行
    - 前一行id为NULL，后一行id为2，所以rows_id为`{1, 2}`，rows_v为`{1, 1}`
    - 当前行值为1，范围取值为`[0, 2]`， 值满足范围的range_id为`{1, 2}`，rows_v为`{1, 1}`
    - 当前行值为1，前一个分组值为NULL，后一个分组值为3，满足值为1、3的groups_id为`{1, 2, 4}`，groups_v为`{1, 1, 3}`
- id为4的行
    - 前一行id为2，后一行id为3，所以rows_id为`{2, 4, 3}`，rows_v为`{1, 3, 5}`
    - 当前行值为3，范围取值为`[2, 4]`，值满足范围的range_id为`{4}`，range_v为`{3}`
    - 当前行值为3，前一个分组值为1，后一个分组值为5，满足值为1、3、5的groups_id为`{1, 2, 4, 3, 6}`，groups_v为`{1, 1, 3, 5, 5}`
- id为5的行
    - 前一行id为6，后一行id为7，所以rows_id为`{6, 5, 7}`，rows_v为`{5, 6, 6}`
    - 当前行值为6，范围取值为`[5, 7]`，值满足范围的range_id为`{3, 6, 5, 7}`，range_v为`{5, 5, 6, 6}`
    - 当前行值为6，前一个分组值为5，后一个分组值为NULL，满足值为5、6的groups_id为`{3, 6, 5, 7}`，groups_v为`{5, 5, 6, 6}`
- id为7的行
    - 前一行id为5，后一行id为NULL，所以rows_id为`{5, 7}`，rows_v为`{6, 6}`
    - 当前行值为6，范围取值为`[5, 7]`，值满足范围的range_id为`{3, 6, 5, 7}`，range_v为`{5, 5, 6, 6}`
    - 当前行值为6，前一个分组值为5，后一个分组值为NULL，满足值为5、6的groups_id为`{3, 6, 5, 7}`，groups_v为`{5, 5, 6, 6}`
:::
#### frame_exclusion

- `EXCLUDE CURRENT ROW`: 排除当前行
- `EXCLUDE GROUP`：排除与当前行值一样的记录
- `EXCLUDE TIES`：排除与当前行值一样的记录，但不包含当前行
- `EXCLUDE NO OTHERS`：不排除，默认行为

::: warning 注意
排除语句`不能单独使用`，必须存在窗口大小定义。
:::

简单的RANGE模式排除比较示例
```sql
WITH "t"("id", "v") AS (VALUES (1, 1), (2, 1), (3, 3), (4, 5), (5, 5), (6, 5), (7, 6))
SELECT "id",
    "v",
    ARRAY_AGG("id") OVER ("o" RANGE BETWEEN 1 PRECEDING AND 1 FOLLOWING EXCLUDE CURRENT ROW) AS "current_row_id",
    ARRAY_AGG("v") OVER ("o" RANGE BETWEEN 1 PRECEDING AND 1 FOLLOWING EXCLUDE CURRENT ROW) AS "current_row_v",
    ARRAY_AGG("id") OVER ("o" RANGE BETWEEN 1 PRECEDING AND 1 FOLLOWING EXCLUDE GROUP)       AS "group_id",
    ARRAY_AGG("v") OVER ("o" RANGE BETWEEN 1 PRECEDING AND 1 FOLLOWING EXCLUDE GROUP)       AS "group_v",
    ARRAY_AGG("id") OVER ("o" RANGE BETWEEN 1 PRECEDING AND 1 FOLLOWING EXCLUDE TIES)        AS "ties_id",
    ARRAY_AGG("v") OVER ("o" RANGE BETWEEN 1 PRECEDING AND 1 FOLLOWING EXCLUDE TIES)        AS "ties_v",
    ARRAY_AGG("id") OVER ("o" RANGE BETWEEN 1 PRECEDING AND 1 FOLLOWING EXCLUDE NO OTHERS)   AS "no_others_id",
    ARRAY_AGG("v") OVER ("o" RANGE BETWEEN 1 PRECEDING AND 1 FOLLOWING EXCLUDE NO OTHERS)   AS "no_others_v"
FROM "t"
    WINDOW "o" AS (ORDER BY "v")
```

![exclude][2]

::: details 结果解释
只取id为1、3、5、7的行记录解释
- id为1的行
    - 当前行值为1，取值范围为`[0, 2]`，满足条件的id即no_others_id为`{1, 2}`，no_others_v为`{1, 1}`
    - 排除当前行(id为1)后，current_row_id为`{2}`，current_row_v为`{1}`
    - 排除当前分组值1，group_id为`NULL`，group_v为`NULL`
    - 排除与当前行值一样id为2的行，ties_id为`{1}`，ties_v为`{1}`
- id为3的行
    - 当前行值为3，取值范围为`[2, 4]`，满足条件的id即no_others_id为`{3}`，no_others_v为`{3}`
    - 排除当前行(id为3)后，current_row_id为`NULL`，current_row_v为`NULL`
    - 排除当前分组值3，group_id为`NULL`，group_v为`NULL`
    - 排除与当前行值一样的行(无满足条件的记录)，ties_id为`{3}`，ties_v为`{3}`
- id为5的行
    - 当前行值为5，取值范围为`[4, 6]`，满足条件的id即no_others_id为`{4, 5, 6, 7}`，no_others_v为`{5, 5, 5, 6}`
    - 排除当前行(id为5)后，current_row_id为`{4, 6, 7}`，current_row_v为`{5, 5, 6}`
    - 排除当前分组值5，group_id为`{7}`，group_v为`{6}`
    - 排除与当前行值一样id为4、6的行，ties_id为`{5, 7}`，ties_v为`{5, 6}`
- id为7的行
    - 当前行值为6，取值范围为`[5, 7]`，满足条件的id即no_others_id为`{4, 5, 6, 7}`，no_others_v为`{5, 5, 5, 6}`
    - 排除当前行(id为6)后，current_row_id为`{4, 5, 6}`，current_row_v为`{5, 5, 5}`
    - 排除当前分组值6，group_id为`{4, 5, 6}`，group_v为`{5, 5, 5}`
    - 排除与当前行值一样的行(无满足条件的记录)，ties_id为`{4, 5, 6, 7}`，ties_v为`{5, 5, 5, 6}`
:::

## 有哪些窗口函数？

| 窗口函数                             | 作用描述                               |
|:---------------------------------|:-----------------------------------|
| `CUME_DIST()                   ` | 返回分区数值累计百分比                        |
| `DENSE_RANK()                  ` | 返回分区排名，若相同排名不占用排名                  |
| `FIRST_VALUE(column)           ` | 返回分区第一个记录值                         |
| `LAG(column [, N [, default]]) ` | 返回当前记录所在分区的前驱第N条记录值，若不存在返回default值 |
| `LAST_VALUE(column)            ` | 返回分区最后一个记录值                        |
| `LEAD(column [, N [, default]])` | 返回当前记录所在分区的后继第N条记录值，若不存在返回default值 |
| `NTH_VALUE(column, N)          ` | 返回分区第N个记录值                         |
| `NTITLE(N)                     ` | 将分区分为N组，返回记录所在组的编号                 |
| `PERCENT_RANK()                ` | 返回区间某个数值在数据集中的百分比排位，对顺序敏感          |
| `RANK()                        ` | 返回分区排名，若相同排名占用排名                   |
| `ROW_NUMBER()                  ` | 返回分区行号，类似排名，但是相同值排名递增              |

**`AVG`**、**`COUNT`**、**`MAX`**、**`MIN`**、**`SUM`** 等其他常用的聚合函数也可以作为窗口函数使用。

### ROW_NUMBER、RANK、DENSE_RANK的区别

以学生成绩为例，学生成绩表有`id`、`student_id`、`subject_id`、`score`，我们可以做总分排名或者单科排名。

::: code-group

```sql [排名查询.sql]
-- 总分排名
SELECT "s3"."name" AS "studentName",
       "s1"."score",
       ROW_NUMBER() OVER("w") AS "rowNumber", 
       RANK() OVER("w") AS "rank", 
       DENSE_RANK() OVER("w") AS "denseRank"
FROM (SELECT SUM("score") AS "score", "student_id" FROM "score" GROUP BY "student_id") "s1"
         INNER JOIN "student" "s3" ON "s1"."student_id" = "s3"."id"
    WINDOW "w" AS (ORDER BY "s1"."score" DESC)

-- 语文单科排名
SELECT "s3"."name" AS "studentName",
       "s2"."name" AS "subjectName",
       "s1"."score",
       ROW_NUMBER() OVER("w") AS "rowNumber", 
       RANK() OVER("w") AS "rank", 
       DENSE_RANK() OVER("w") AS "denseRank"
FROM "score" "s1"
         INNER JOIN "subject" "s2" ON "s1"."subject_id" = "s2"."id"
         INNER JOIN "student" "s3" ON "s1"."student_id" = "s3"."id"
WHERE "s1"."subject_id" = 1
    WINDOW "w" AS (ORDER BY "s1"."score" DESC)
```

```sql [表定义.sql]
-- 学生
CREATE TABLE "student"
(
    "id"   BIGINT PRIMARY KEY,
    "name" VARCHAR(32)
);

-- 科目
CREATE TABLE "subject"
(
    "id"   BIGINT PRIMARY KEY,
    "name" VARCHAR(64)
);

-- 成绩
CREATE TABLE "score"
(
    "id"         BIGINT PRIMARY KEY,
    "student_id" BIGINT,
    "subject_id" BIGINT,
    "score"      DECIMAL
);
```

```sql [数据.sql]
INSERT INTO "student"
VALUES (1, '张三'),
       (2, '李四'),
       (3, '王五'),
       (4, '赵六'),
       (5, '燕七');

INSERT INTO "subject"
VALUES (1, '语文'),
       (2, '数学'),
       (3, '英语'),
       (4, '物理'),
       (5, '化学');

INSERT INTO "score"
VALUES (1, 1, 1, 60),
       (2, 1, 2, 67),
       (3, 1, 3, 90),
       (4, 1, 4, 48),
       (5, 1, 5, 90),
       (6, 2, 1, 60),
       (7, 2, 2, 92),
       (8, 2, 3, 79),
       (9, 2, 4, 58),
       (10, 2, 5, 66),
       (11, 3, 1, 90),
       (12, 3, 2, 95),
       (13, 3, 3, 85),
       (14, 3, 4, 88),
       (15, 3, 5, 99),
       (16, 4, 1, 55),
       (17, 4, 2, 47),
       (18, 4, 3, 36),
       (19, 4, 4, 0),
       (20, 4, 5, 52),
       (21, 5, 1, 90),
       (22, 5, 2, 98),
       (23, 5, 3, 100),
       (24, 5, 4, 99),
       (25, 5, 5, 93);
```

:::

![sum][3]
![single][4]

可以看到，`ROW_NUMBER`不会管分数是否一样，排名不重复，`RANK`当排名重复时，重复次数会占用后续排名，`DENSE_RANK`
当排名重复时，不会占用后续排名。

### CUME_DIST、PERCENT_RANK的区别

我们以上边成绩表的score值来做CUME_DIST和PERCENT_RANK的区别

```sql [分析]
SELECT "s"."score",
       ROW_NUMBER() OVER ("w") AS "rowNumber", 
       CUME_DIST() OVER ("w") AS "cumeDist", 
       PERCENT_RANK() OVER ("w") AS "percentRank"
FROM "score" "s"
WHERE "s"."score" >= 75
    WINDOW "w" AS (ORDER BY "s"."score" DESC)
```

![cume][5]

`CUME_DIST`统计大于等于(或小于等于， 跟值排序有关)当前值个数在所有记录数中的占比(`cnt / N`)，
`PERCENT_RANK`比较值在其他记录数(排除当前记录)中的占比(`(rank - 1)/(rows - 1)`)

## 综合实例

### 班级、年级成绩排名

```sql
WITH "grades" ("student_name", "grade", "class", "score")
         AS (VALUES ('张三', 2022, '一班', 90),('李四', 2022, '一班', 85),
                    ('王五', 2022, '二班', 88),('赵六', 2022, '二班', 92),
                    ('燕七', 2023, '一班', 78),('丘八', 2023, '一班', 80),
                    ('刁九', 2023, '二班', 75),('冉十', 2023, '二班', 85))
SELECT "student_name",
       "grade",
       "class",
       "score",
       -- 按照ROW_NUMBER不重复排名
       -- 班级排名
       ROW_NUMBER() OVER (PARTITION BY "grade", "class" ORDER BY "score" DESC) AS "class_rank",
       -- 年级排名
       ROW_NUMBER() OVER (PARTITION BY "grade" ORDER BY "score" DESC)          AS "grade_rank"
FROM "grades"
ORDER BY "grade", "score" DESC
```
![score][6]

### 月销售额、同比、环比

```sql
-- 基础销售额数据
WITH "sales" ("sale_date", "revenue")
         AS (VALUES ('2023-01-01'::DATE, 500.00), ('2023-01-02', 600.00), ('2023-02-01', 780.00),
                    ('2023-02-02', 900.00), ('2023-03-01', 1199.00), ('2023-03-02', 599.00),
                    ('2023-04-01', 499.00), ('2023-04-02', 399.00), ('2023-05-01', 299.00),
                    ('2023-05-02', 199.00), ('2023-06-02', 199.00), ('2023-07-02', 199.00),
                    ('2023-08-02', 199.00), ('2023-09-02', 199.00), ('2023-10-02', 199.00),
                    ('2023-11-02', 199.00), ('2023-11-02', 199.00), ('2024-01-01', 1200.00),
                    ('2024-01-02', 1500.00), ('2024-02-01', 1300.00), ('2024-03-01', 1100.00),
                    ('2024-03-02', 1700.00), ('2024-04-01', 1800.00), ('2024-05-01', 1400.00),
                    ('2024-03-02', 1700.00), ('2024-04-01', 1800.00), ('2024-06-01', 1400.00),
                    ('2024-07-01', 1400.00), ('2024-08-01', 1400.00), ('2024-09-01', 1400.00),
                    ('2024-10-01', 1400.00), ('2024-11-01', 1400.00), ('2024-12-01', 1400.00)),
     -- 按照年月汇总，通过lag函数获得上一月，上一年月销售额
     "growth" AS (SELECT EXTRACT(YEAR FROM "sale_date")                AS "year",
                         EXTRACT(MONTH FROM "sale_date")               AS "month",
                         -- 月销售额
                         SUM("revenue")                                AS "month_revenue",
                         -- 上一月销售额 可能为NULL
                         COALESCE(LAG(SUM("revenue")) OVER "w", 0)     AS "last_month_revenue",
                         -- 上一年月销售额 可能为NULL
                         COALESCE(LAG(SUM("revenue"), 12) OVER "w", 0) AS "last_year_month_revenue"
                  FROM "sales"
                  GROUP BY EXTRACT(YEAR FROM "sale_date"), EXTRACT(MONTH FROM "sale_date")
                      WINDOW "w" AS (ORDER BY EXTRACT(YEAR FROM "sale_date"), EXTRACT(MONTH FROM "sale_date"))
                  ORDER BY 1, 2)
SELECT "year",
       "month",
       "month_revenue",
       "last_month_revenue",
       "last_year_month_revenue",
       -- 若上一月销售额为0 则固定环比为100%
       ROUND(CASE
                 WHEN "last_month_revenue" = 0
                     THEN 100
                 ELSE
                     ("month_revenue" - "last_month_revenue") / "last_month_revenue" * 100
                 END, 2) || '%' AS "monthly_growth",
       -- 若上一年月销售额为0 则固定同比为100%
       ROUND(CASE
                 WHEN "last_year_month_revenue" = 0
                     THEN 100
                 ELSE
                             ("month_revenue" - "last_year_month_revenue") /
                             "last_year_month_revenue" * 100
                 END, 2) || '%' AS "yearly_growth"
FROM "growth"
```

![growth][7]

[1]: /assets/2023/08-18/mode.png
[2]: /assets/2023/08-18/exclude.png
[3]: /assets/2023/08-18/sum.jpg
[4]: /assets/2023/08-18/single.jpg
[5]: /assets/2023/08-18/cume_percent.jpg
[6]: /assets/2023/08-18/score.png
[7]: /assets/2023/08-18/growth.png

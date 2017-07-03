---
layout: post
title:  "Postgresql联合主键left join查询"
date:   2017-07-03 14:15:46 +0800
categories: [db]
---
# 问题及环境
1.有两张数据库表exception_invoice_status_log和invoice_exception_status，其中exception_invoice_status_log数据量10w左右，invoice_exception_status数据量可以忽略   
2.两张表数据库结构如下   
```mysql
CREATE TABLE IF NOT EXISTS exception_invoice_status_log(
  invoice_status_log_id BIGINT,
  exception_status_id BIGINT,
  CONSTRAINT pk_eisl_invoice_status_id_exception_status_id PRIMARY KEY(invoice_status_log_id, exception_status_id),
  CONSTRAINT fk_eisl_exception_status_id FOREIGN KEY(exception_status_id) REFERENCES invoice_exception_status(id)
);

CREATE TABLE IF NOT EXISTS invoice_exception_status(
  id INT NOT NULL,
  name VARCHAR(20) NOT NULL,
  CONSTRAINT pk_invoice_exception_status PRIMARY KEY (id)
);
```
3.现有数据库查询如下，查询效率非常低下   
```mysql
SELECT ies.name
  FROM exception_invoice_status_log eisl LEFT JOIN invoice_exception_status ies
    ON (eisl.invoice_status_log_id = 1000 AND eisl.exception_status_id = ies.id)
ORDER BY eisl.exception_status_id;
```
# 原因分析
1.先分析查询语句   
![EXPLAIN_LEFT_JOIN](/images/2017-07-03/explain_left_join.png)   
发现LEFT JOIN的条件并没有走索引 而是过滤条件   
2.将LEFT JOIN修改为JOIN分析   
{% highlight mysql %}
SELECT ies.name
  FROM exception_invoice_status_log eisl, invoice_exception_status ies
 WHERE eisl.invoice_status_log_id = 1000 
   AND eisl.exception_status_id = ies.id
ORDER BY eisl.exception_status_id;
{% endhighlight %}
![EXPLAIN_JOIN](/images/2017-07-03/explain_join.png)   
发现使用JOIN后查询条件走的是主键索引

# 结论
在postgresql中，若非联合主键，使用LEFT JOIN且条件为主键关联时，会使用主键索引。   
若是联合主键，LEFT JOIN用主键关联不会走主键索引，使用JOIN会。   
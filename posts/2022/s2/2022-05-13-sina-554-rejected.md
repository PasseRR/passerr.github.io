---
title:  新浪邮箱554退信
tags: [mail, 运维]
---

## 问题描述
自己搭建的邮箱服务器，发送邮件到新浪邮箱，结果被拒收了。
![554][554]

## 发送邮件到新浪服务器基本条件
1. 邮件系统的出口有多个IP的需要做反向解析
2. 系统里有多个域名的需要做spf记录  
   在域名解析中添加一条主机记录为空或@，记录值为`v=spf1 a mx ~all`的记录，然后在windows下验证；

    ```bat
    nslookup -q=txt a.com
    ```

## 邮件服务器在线检测
1. [SPF及DKIM检测](https://www.appmaildev.com/cn/dkim)
2. [邮件服务器评分](https://www.mail-tester.com/)

## 错误原因
[spamhaus](https://check.spamhaus.org/)查询公网ip和域名是否被加入黑名单，
若被加入黑名单直接填写邮箱申述，申述成功后再检测ip发现已经被移除。

```txt
Please remove my ip address xxx.xxx.xxx.xxx, the domain name is xxx.com, 
I promise we don't send any spam, thank you. 
```

黑名单移除后，再重试邮件发送，成功了。

[554]: /assets/2022/05-13/554.png

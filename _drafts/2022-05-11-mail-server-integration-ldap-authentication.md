---
layout: post
title:  基于postfix、dovecot、roundcube的邮件服务器搭建及ldap认证集成
categories: [operation]
last_modified_at: 2022-05-11
---

## 整体环境介绍

|模块|作用|
|:---|:---|
|[postfix](http://www.postfix.org/){:target="_blank"}|发邮件|
|[dovecot](https://www.dovecot.org/){:target="_blank"}|收/存邮件，ldap用户认证(基于dovecot-ldap)|
|[roundcube](https://roundcube.net/){:target="_blank"}|web邮箱ui|
|[php7.4](https://www.php.net/){:target="_blank"}|roundcube运行环境|
|mysql|web邮箱信息存储|
|[apache2](https://httpd.apache.org/){:target="_blank"}|web服务器|
|[OpenLdap](https://www.openldap.org/){:target="_blank"}|用户目录|

![架构图](https://cdn.jsdelivr.net/gh/PasseRR/passerr.github.io/assets/2022/05-11/architecture.png)

## 服务安装
### postfix
centos默认安装

### dovecot

```shell
yum install -y dovecot
```

### roundcube
[参考官方安装](https://github.com/roundcube/roundcubemail/wiki/Installation) {:target="_blank"}

### php

### mysql

```shell
yum install -yum mysql57-community-release-el7-10.noarch.rpm
systemctl start mysqld
systemctl enable mysqld
```

### apache2
centos默认安装

### OpenLdap
[参考](../s1/2022-03-09-centos-install-openldap.md){:target="_blank"}

## 服务配置

### 虚拟用户配置

### postfix配置
```shell
# 查看Postfix支持SASL实现
postconf -a
```

### dovecot配置

### roundcube配置
- 数据库配置
  ```mysql
  USE mysql;
  CREATE USER 'roundcube'@'localhost' IDENTIFIED BY 'mypassword';
  GRANT USAGE ON * . * TO 'roundcube'@'localhost' IDENTIFIED BY 'mypassword';
  CREATE DATABASE IF NOT EXISTS `roundcube`;
  GRANT ALL PRIVILEGES ON `roundcube` . * TO 'roundcube'@'localhost';
  FLUSH PRIVILEGES;
  ```

[comment]:<>(参考文章 https://www.jianshu.com/p/aa9c48aa0aa8)

---
layout: post 
title:  CentOs下安装配置OpenLdap 
categories: [operation]
last_modified_at: 2022-03-09
---

## 简介
> [引用自](https://blog.51cto.com/moerjinrong/2149584){:target="_blank"}

## 安装LDAP

```shell
yum -y install openldap compat-openldap openldap-clients openldap-servers openldap-servers-sql openldap-devel
# 启动服务
systemctl start slapd
# 开启自启动
systemctl enable slapd
# 验证端口
netstat -antup | grep -i 389
```

## 配置LDAP

1. 创建跟目录密码
    ```shell
    # 记录生成的密码
    slappasswd -h {SSHA} -s ldppassword
    ```
   
2. 配置root dn及密码

   替换`olcSuffix`为你的域，替换`olcRootDN`为你的访问权限控制dn，替换`olcRootPW`为第一步生成的密码
    ```shell
    # /etc/openldap/slapd.d/cn=config/olcDatabase={2}hdb.ldif
    dn: olcDatabase={2}hdb,cn=config
    changetype: modify
    replace: olcSuffix
    olcSuffix: dc=51cto,dc=com
    
    dn: olcDatabase={2}hdb,cn=config
    changetype: modify
    replace: olcRootDN
    olcRootDN: cn=ldapadm,dc=51cto,dc=com
    
    dn: olcDatabase={2}hdb,cn=config
    changetype: modify
    replace: olcRootPW
    olcRootPW: {SSHA}d/thexcQUuSfe3rx3gRaEhHpNJ52N8D3
    # 将以上内容保存为`db.ldif` 然后执行下边命令
    ldapmodify -Y EXTERNAL  -H ldapi:/// -f db.ldif
    ```
   
3. 设置访问用户限制 

    修改`dn.base`为第二步中的`olcRootDN`
    ```shell
    # /etc/openldap/slapd.d/cn=config/olcDatabase={1 }monitor.ldi
    dn: olcDatabase={1}monitor,cn=config
    changetype: modify
    replace: olcAccess
    olcAccess: {0}to * by dn.base="gidNumber=0+uidNumber=0,cn=peercred,cn=external, cn=auth" read by dn.base="cn=ldapadm,dc=51cto,dc=com" read by * none
    # 将以上内容保存为monitor.ldif 然后执行下边命令
    ldapmodify -Y EXTERNAL  -H ldapi:/// -f monitor.ldif
    ```
   
4. 配置LDAP数据库
    ```shell
    cp /usr/share/openldap-servers/DB_CONFIG.example /var/lib/ldap/DB_CONFIG
    chown ldap:ldap /var/lib/ldap/*
    ```
5. 使用LDAP客户端登录验证

    至此，LDAP安装配置完成

---
layout: post
title:  Windows安装sshd服务
categories: [ci, operation]
last_modified_at: 2022-01-12
toc: true
---

## 概述
在做ci或者运维的时候，有时候必须连到windows服务器，虽然mstsc也也可以连接，但必然没有命令行来得快捷。

## sshd安装
powershell下执行命令如下
```powershell
# 查询本地安装的OpenSSH服务
Get-WindowsCapability -Online | ? Name -like 'OpenSSH*'
# 安装ssh服务端
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
# 启动sshd服务
Start-Service sshd
# 查看sshd服务情况
Get-Service sshd
# 设置服务自启动或者services.msc设置
Set-Service -Name sshd -StartupType 'Automatic'
# 然后就可以使用ssh命令连接了
ssh username@host
```

## ssh免密登录windows问题
linux使用ssh免密登录windows的时候，将public key加入windows的.ssh/authorized_keys中，
但ssh还是需要密码登录。

解决办法，修改`%ProgramData%/ssh/sshd_config`文件最后部分

```text
Match Group administrators
    AuthorizedKeysFile .ssh/authorized_keys
```

然后重启sshd服务。
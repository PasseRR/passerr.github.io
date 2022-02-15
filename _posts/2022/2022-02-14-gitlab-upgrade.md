---
layout: post
title:  Gitlab跨版本升级计划
mermaid: true
categories: [operation]
last_modified_at: 2022-02-14
---

## 概述
Gitlab不能随意升级，需要按照官方[升级路线](https://docs.gitlab.com/ee/update/index.html#upgrade-paths){:target="_blank"}进行。
比如当前Gitlab版本为`10.0.0`，要升级到最新版本`14.2.6`，那么升级路径如下：  
10.0.0 -> 10.8.7 -> 11.11.8 -> 12.0.12 -> 12.1.17 -> 12.10.14 -> 13.0.14 -> 13.1.11 -> 13.8.8 -> 13.12.15 -> 14.0.11 -> 14.1.8 -> 14.2.6

这是官方给出的，如果不按此路线进行升级可能会出现未知异常，其他版本升级请参照官方升级路线。

## 升级方法

1. [Linux包安装](https://docs.gitlab.com/ee/update/package/){:target="_blank"}
2. 源代码安装
3. Docker安装
4. k8s(Helm)安装

本文将使用第一种方法安装升级。

## 准备工作

[参考官网备份恢复文档](https://docs.gitlab.com/ee/raketasks/backup_restore.html){:target="_blank"}

### 备份
1.备份gitlab
```shell
# 12.2及之后版本
sudo gitlab-backup create
# 12.1及之前版本
gitlab-rake gitlab:backup:create
# 源码安装
sudo -u git -H bundle exec rake gitlab:backup:create RAILS_ENV=production
```

2.备份配置文件

直接安装
- /etc/gitlab/gitlab-secrets.json
- /etc/gitlab/gitlab.rb

源码安装

- /home/git/gitlab/config/secrets.yml
- /home/git/gitlab/config/gitlab.yml

### 恢复
1.恢复gitlab

确保备份文件在`gitlab.rb`配置的`gitlab_rails['backup_path']`目录下
```shell
# 备份文件准备
sudo cp 11493107454_2018_04_25_10.6.4-ce_gitlab_backup.tar /var/opt/gitlab/backups/
sudo chown git:git /var/opt/gitlab/backups/11493107454_2018_04_25_10.6.4-ce_gitlab_backup.tar

# 停止写数据服务
sudo gitlab-ctl stop puma
sudo gitlab-ctl stop sidekiq
# Verify
sudo gitlab-ctl status

# 恢复命令
sudo gitlab-backup restore BACKUP=11493107454_2018_04_25_10.6.4-ce
```

2.恢复gitlab-secrets.json

覆盖备份的`gitlab-secrets.json`文件

3.检查
```shell
sudo gitlab-ctl reconfigure
sudo gitlab-ctl restart
sudo gitlab-rake gitlab:check SANITIZE=true
```
ps: 若没有完全的把握升级，建议使用一台备用服务器做升级模拟。

## 升级过程
### [配置yum源](https://packages.gitlab.com/gitlab/gitlab-ce/install#manual-rpm){:target="_blank"}

```shell
curl -s https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.rpm.sh | sudo bash
```

### 升级过程

```shell
# 每次升级建议都做升级检查及备份对应版本
yum install -y gitlab-ce-10.8.7
yum install -y gitlab-ce-11.11.8
yum install -y gitlab-ce-12.0.12
yum install -y gitlab-ce-12.1.17
yum install -y gitlab-ce-12.10.14
yum install -y gitlab-ce-13.0.14
yum install -y gitlab-ce-13.1.11
yum install -y gitlab-ce-13.8.8
yum install -y gitlab-ce-13.12.15
yum install -y gitlab-ce-14.0.11
yum install -y gitlab-ce-14.1.8
yum install -y gitlab-ce-14.2.6
```

## 升级前后检查
1.检测基础配置
```shell
sudo gitlab-rake gitlab:check
```

2.检查加密
```shell
sudo gitlab-rake gitlab:doctor:secrets
```

3.UI检查
- 用户是否能登录
- 项目列表可见
- 项目issue和merge可访问
- 用户可以clone项目
- 用户可以push

4.CI检查
- runner可以运行job
- docker镜像可以push和pull

5.如果使用了GEO
```shell
sudo gitlab-rake gitlab:geo:check
```

6.如果使用了Elasticsearch，检查查询结果

7.如果使用了邮件，手动更新`gitlab-mail_room`
```shell
gem install gitlab-mail_room
```
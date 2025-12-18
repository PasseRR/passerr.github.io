---
title:  Gitlab跨版本升级计划
tags: [gitlab, 运维]
---

Gitlab不能随意升级，需要按照[官方升级路线](https://docs.gitlab.com/ee/update/index.html#upgrade-paths)进行。
比如当前Gitlab版本为`10.0.0`，要升级到最新版本`14.7.3`，那么升级路径如下：  
10.0.0 -> 10.8.7 -> 11.11.8 -> 12.0.12 -> 12.1.17 -> 12.10.14 -> 13.0.14 -> 13.1.11 -> 13.8.8 -> 13.12.15 -> 14.0.11 -> 14.1.8 -> 14.7.3

这是官方给出的，如果不按此路线进行升级可能会出现未知异常，其他版本升级请参照官方升级路线。

## 升级方法

- [Linux包安装](https://docs.gitlab.com/ee/update/package/)
- 源代码安装
- Docker安装
- k8s(Helm)安装

本文将使用第一种方法安装升级。

## 准备工作

[参考官网备份恢复文档](https://docs.gitlab.com/ee/raketasks/backup_restore.html)

### 备份
#### 备份gitlab
```shell
# 12.2及之后版本
sudo gitlab-backup create
# 12.1及之前版本
gitlab-rake gitlab:backup:create
# 源码安装
sudo -u git -H bundle exec rake gitlab:backup:create RAILS_ENV=production
```

#### 备份配置文件

直接安装
- /etc/gitlab/gitlab-secrets.json
- /etc/gitlab/gitlab.rb

源码安装

- /home/git/gitlab/config/secrets.yml
- /home/git/gitlab/config/gitlab.yml

### 恢复
#### 恢复gitlab

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

# 目录权限 确保根目录有git用户权限
chown git /root
chown git:git /var/opt/gitlab/backups/11493107454_2018_04_25_10.6.4-ce_gitlab_backup.tar

# 恢复命令
# 12.1之后版本
sudo gitlab-backup restore BACKUP=11493107454_2018_04_25_10.6.4-ce
# 12.1及之前版本
gitlab-rake gitlab:backup:restore BACKUP=1644908390_2022_02_15_10.0.0
```

#### 恢复gitlab-secrets.json

覆盖备份的`gitlab-secrets.json`文件

#### 检查
```shell
sudo gitlab-ctl reconfigure
sudo gitlab-ctl restart
sudo gitlab-rake gitlab:check SANITIZE=true
```
ps: 若没有完全的把握升级，建议使用一台备用服务器做升级模拟。

## 升级过程
### [配置yum源](https://packages.gitlab.com/gitlab/gitlab-ce/install#manual-rpm)

```shell
curl -s https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.rpm.sh | sudo bash
```

### 升级过程

```shell
# 以下版本每次升级成功后需要手动执行reconfigure
# 每次升级成功保证能正常访问才进行下一个版本升级
gitlab-ctl reconfigure
# 每次升级建议都做升级检查及备份对应版本
yum install -y gitlab-ce-10.8.7
yum install -y gitlab-ce-11.11.8
yum install -y gitlab-ce-12.0.12
yum install -y gitlab-ce-12.1.17

# 从以下版本开始 无需再执行reconfigure 升级包里面会自动执行
yum install -y gitlab-ce-12.10.14
yum install -y gitlab-ce-13.0.14
yum install -y gitlab-ce-13.1.11
yum install -y gitlab-ce-13.8.8
yum install -y gitlab-ce-13.12.12
yum install -y gitlab-ce-14.0.11
yum install -y gitlab-ce-14.1.8

yum install -y gitlab-ce-14.7.3
# 若db升级失败 手动执行以下命令
gitlab-rake gitlab:background_migrations:finalize[CopyColumnUsingBackgroundMigrationJob,push_event_payloads,event_id,'[["event_id"]\, ["event_id_convert_to_bigint"]]']
gitlab-rake gitlab:background_migrations:finalize[CopyColumnUsingBackgroundMigrationJob,events,id,'[["id"]\, ["id_convert_to_bigint"]]']
gitlab-rake gitlab:background_migrations:finalize[CopyColumnUsingBackgroundMigrationJob,ci_stages,id,'[["id"]\, ["id_convert_to_bigint"]]']
gitlab-rake gitlab:background_migrations:finalize[CopyColumnUsingBackgroundMigrationJob,taggings,id,'[["id"\, "taggable_id"]\, ["id_convert_to_bigint"\, "taggable_id_convert_to_bigint"]]']
gitlab-rake gitlab:background_migrations:finalize[CopyColumnUsingBackgroundMigrationJob,ci_builds,id,'[["id"\, "stage_id"]\, ["id_convert_to_bigint"\, "stage_id_convert_to_bigint"]]']
gitlab-rake gitlab:background_migrations:finalize[CopyColumnUsingBackgroundMigrationJob,ci_job_artifacts,id,'[["id"\, "job_id"]\, ["id_convert_to_bigint"\, "job_id_convert_to_bigint"]]']
gitlab-rake gitlab:background_migrations:finalize[CopyColumnUsingBackgroundMigrationJob,ci_builds_metadata,id,'[["id"]\, ["id_convert_to_bigint"]]']
gitlab-ctl reconfigure
```

## 升级前后检查
### 检测基础配置
```shell
sudo gitlab-rake gitlab:check
```

### 检查加密
```shell
sudo gitlab-rake gitlab:doctor:secrets
```

### UI检查
- 用户是否能登录
- 项目列表可见
- 项目issue和merge可访问
- 用户可以clone项目
- 用户可以push

### CI检查
- runner可以运行job
- docker镜像可以push和pull

### 其他检查

- 如果使用了GEO
```shell
sudo gitlab-rake gitlab:geo:check
```

- 如果使用了Elasticsearch，检查查询结果

- 如果使用了邮件，手动更新`gitlab-mail_room`
```shell
gem install gitlab-mail_room
```

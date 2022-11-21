---
layout: post
title:  Gitlab安装Gitlab Runner
categories: [ci]
last_modified_at: 2022-03-01
toc: true
---

## 更新yum源
```shell
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.rpm.sh | sudo bash
```

## 安装gitlab-runner
```shell
yum install -y gitlab-runner
# 确保存在/home/gitlab-runner目录 且目录是gitlab-runner用户权限 若不存在按照如下命令创建
mkdir /home/gitlab-runner
chown gitlab-runner:gitlab-runner /home/gitlab-runner
# 注册runner到gitlab
gitlab-runner register
# 启动runner
gitlab-runner start
```

## 配置ssh
```shell
su gitlab-runner
# 复制/home/gitlab-runner/.ssh/id_rsa.pub内容为Deploy Keys
ssh-keygen
```
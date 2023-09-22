---
title:  Gitlab Runner介绍
tags: [ci/cd]
---

## Gitlab Runner 安装

### Linux下安装

#### 更新yum源

```shell
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.rpm.sh | sudo bash
```

#### 安装gitlab-runner

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

#### 配置ssh

```shell
su gitlab-runner
# 复制/home/gitlab-runner/.ssh/id_rsa.pub内容为Deploy Keys
ssh-keygen
```

### Windows下安装

[64位下载](https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-windows-amd64.exe)

[32位下载](https://gitlab-runner-downloads.s3.amazonaws.com/latest/binaries/gitlab-runner-windows-386.exe)

```
# 以默认用户安装
.\gitlab-runner.exe install
# 以指定用户安装 用户是域帐号 需要加.\ 如Administrator 则 --user .\Administrator
.\gitlab-runner.exe install --user ".\ENTER-YOUR-USERNAME" --password "ENTER-YOUR-PASSWORD"
# 启动runner
.\gitlab-runner.exe start
```

#### windows乱码问题

```toml
[[runners]]
  # 设置编码为UTF8
  pre_clone_script = "chcp 65001"
```

## config.toml配置

详细配置参考[官方文档](https://docs.gitlab.com/runner/configuration/advanced-configuration.html)

```toml
# 最大并发任务数
concurrent = 5
# 日志级别 可选值debug, info, warn, error, fatal, panic
log_level = "warning"
# 日志格式 可选值runner, text, json
log_format = "runner"
# 检测新job的时间间隔(秒) 默认3秒
check_interval = 0
# 普罗米修斯地址
listen_address = "host:port"

# runner配置
[[runners]]
  # runner名字
  name = "name"
  # gitlab地址
  url = "http://gitlab.abc.com"
  # 代码clone地址 若配置默认使用gitlab的clone地址 
  # 加入gitlab是公网地址 想要clone代码用局域网地址
  clone_url = "http://192.168.x.x"
  # gitlab 授权token
  token = "token"
  # 执行器
  executor = "shell"
  # 环境变量定义或覆盖
  environment = ["A=a", "B=1"]
  # 任务并发限制
  limit = 0
  # clone代码前后执行脚本
  pre_clone_script = ""
  post_clone_script = ""
  # 任务build前后执行脚本
  pre_build_script = ""
  post_build_script = ""

# 多个runner配置
[[runners]]
...
```
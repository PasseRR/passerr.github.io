---
layout: post
title:  CentOs升级Git版本
categories: [operation]
last_modified_at: 2022-03-01
toc: true
---

## gitlab-ci报错
```text
fatal: git fetch-pack: expected shallow list
fatal: The remote end hung up unexpectedly
```
原因是git客户端版本太低，不支持git fetch-pack，所以需要升级CentOs下的git客户端版本。

## 升级过程
```shell
# 安装依赖
yum install -y gcc zlib-devel autoconf libcurl-devel curl-devel
# 下载源代码
wget https://github.com/git/git/archive/refs/tags/v2.35.0.tar.gz
tar zxvf v2.35.0.tar.gz
cd git-2.35.0
# 检验相关依赖，设置安装路径
make configure
./configure --prefix=/usr/local/git
# 编译安装
make && make install

# 删除git
rpm -e --nodeps git
# 或者
yum remove git

# 配置环境变量
vi /etc/profile
export PATH=$PATH:/usr/local/git/bin
# 刷新
source /etc/profile

# 校验版本号
git --version
```
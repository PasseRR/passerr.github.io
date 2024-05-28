---
title:  Ngrok使用及自己搭建服务器
tags: [centos, ngrok, 运维]
---

## Ngrok作用

将本地的端口服务，通过Ngrok映射生成公网地址提供访问，类似于反向代理的作用。

## 公有云Ngrok的使用

1. [帐号注册](https://ngrok.com)并登录
2. 下载响应的ngrok客户端

   ![p1][1]

3. 复制授权码并在终端执行以下命令

   ![p2][2]

    ```shell
    ngrok config add-authtoken token
    ngrok.exe config add-authtoken token
    ```
4. 端口代理

    ```shell
    ngrok http 15432
    # 帮助
    ngrok help
    ```

   ![p3][3]

   通过终端的域名地址直接访问本地服务，由于使用的是免费版本，不能自定义域名，每次启动服务域名地址都不一样。

## 基于CentOs的私有Ngrok服务搭建

### 1. 准备工作

#### 1.1 git安装

```shell
yum install git
```

#### 1.2 [go sdk](https://go.dev/dl/)安装

```shell
# sdk下载、解压
wget https://go.dev/dl/go1.19.4.linux-amd64.tar.gz
tar zxvf go1.19.4.linux-amd64.tar.gz
mv ./go /usr/local
# 环境变量设置
export GOROOT=/usr/local/go
export $PATH:$GOROOT/bin
# go sdk验证
go version
go env
```

#### 1.3 gcc安装

```shell
yum install gcc
```

### 2. 源代码打包

#### 2.1 [ngrok](https://github.com/inconshreveable/ngrok)代码克隆

```shell
git clone git@github.com:inconshreveable/ngrok.git
```

#### 2.2 证书准备

```bash
# clone代码后的目录
cd ngrok
# 设置你的ngrok域名
NGROK_DOMAIN="ngrok.yourcompany.com"
openssl genrsa -out base.key 2048
openssl req -new -x509 -nodes -key base.key -days 10000 -subj "/CN=$NGROK_DOMAIN" -out base.pem
openssl genrsa -out server.key 2048
openssl req -new -key server.key -subj "/CN=$NGROK_DOMAIN" -out server.csr
# 客户端只通过域名连接
openssl x509 -req -in server.csr -CA base.pem -CAkey base.key -CAcreateserial -days 10000 -out server.crt

# 证书覆盖
cp base.pem assets/client/tls/ngrokroot.crt
cp server.crt assets/server/tls/snakeoil.crt
cp server.key assets/server/tls/snakeoil.key
```

#### 2.3 打包服务端及客户端

打包后的文件在bin目录下，其中ngrokd为服务端执行文件，ngrok为客户端执行文件。

```shell
# 服务端打包
make release-server
# 客户端打包
# Linux 平台 32 位系统：GOOS=linux GOARCH=386
# Linux 平台 64 位系统：GOOS=linux GOARCH=amd64
#  
# Windows 平台 32 位系统：GOOS=windows GOARCH=386
# Windows 平台 64 位系统：GOOS=windows GOARCH=amd64
#  
# MAC 平台 32 位系统：GOOS=darwin GOARCH=386
# MAC 平台 64 位系统：GOOS=darwin GOARCH=amd64
#  
# ARM 平台：GOOS=linux GOARCH=arm
GOOS=linux GOARCH=amd64 make release-client
GOOS=windows GOARCH=amd64 make release-client
GOOS=darwin GOARCH=amd64 make release-client
GOOS=linux GOARCH=arm make release-client
```

#### 2.4 打包过程中遇到的问题

1. package code.google.com/p/log4go: unrecognized import path "code.google.com/p/log4go":
   parse https://code.google.com/p/log4go?go-get=1: no go-import meta tags ()

   [参考](https://www.cnblogs.com/52php/p/6810115.html)
    ```shell
    cd ngrok
    mkdir -p code.google.com/p
    cd code.google.com/p
    # 备用站一
    git clone git@github.com:alecthomas/log4go.git
    # 备用站二
    git clone git@github.com:thinkboy/log4go.git
    ```
2. make: *** [deps] Error 1

   升级go版本，改为go 1.19.4版本后编译通过

3. 客户端想通过ip连接ngrok服务端

    ```shell
    # 客户端支持局域网ip加端口连接
    echo subjectAltName = IP:192.168.xx.xx > extfile.cnf
    openssl x509 -req -in server.csr -CA base.pem -CAkey base.key -CAcreateserial -days 10000 -out server.crt -extfile extfile.cnf
    ```

### 3. 部署服务端

```shell
# 直接运行
ngrokd -domain "$NGROK_DOMAIN" -httpAddr=":80" -httpsAddr=":443" -tunnelAddr=":4443" -log="none"
# 后台运行
nohup ngrokd -domain "$NGROK_DOMAIN" -httpAddr=":80" -httpsAddr=":443" -tunnelAddr=":4443" -log="none" > /root/ngrok/out.file 2>&1 &
# 以systemd方式运行
cd /usr/lib/systemd/system
vi ngrokd.service
[Unit]
Description=ngrok
After=syslog.target
[Service]
ExecStart=/opt/ngrok/ngrokd -domain ngrok.your.domain -httpAddr ":80" -httpsAddr ":443" -tunnelAddr ":4443" -log "none"
Restart=always
[Install]
WantedBy=multi-user.target

systemctl enable ngrokd
systemctl daemon-reload
systemctl start ngrokd
```

### 4. 客户端连接

#### 4.1 客户端配置文件

```yaml
# 新建ngrok.cfg文件
# 若设置了ip支持可以为ip 否则使用域名
server_addr: "ngrok.your.domain:4443"
# 自发布证书设置为false CA设置为true
trust_host_root_cert: false
```

#### 4.2 启动客户端

```shell
# 默认代理http和https协议 随机子域名
ngrok.exe -config=ngrok.cfg 80
# 指定子域名 访问地址为web.ngrok.your.domain
ngrok.exe -subdomain web -config=ngrok.cfg 80
```

![p4][4]

图片中ngrokd仅开启了http协议，以上，完成了私有ngrok的编译部署。

[1]: /assets/2023/01-06/ngrok-cloud-download.png "cloud-download"
[2]: /assets/2023/01-06/ngrok-cloud-token.png "cloud-token"
[3]: /assets/2023/01-06/ngrok-cloud-terminal.png "cloud-terminal"
[4]: /assets/2023/01-06/ngrok.png "ngrok"

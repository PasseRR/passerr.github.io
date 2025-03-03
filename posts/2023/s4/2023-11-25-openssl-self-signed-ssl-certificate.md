---
title: OpenSSL自签发SSL证书
tags: [ ssl, nginx, 运维 ]
---

[OpenSSL](https://www.openssl.org/)是一个功能强大的开源工具包，广泛用于实现SSL/TLS协议以及各种加密操作，OpenSSL的主要用途有：

- 生成SSL/TLS证书
- SSL/TLS通信
- 证书管理
- 密钥对管理
- 加密和解密
- 数字签名/验证

这里介绍一下基于OpenSSL的SSL自签发证书方法。

## 生成私钥
   
首先，生成一个2048位的RSA私钥：

```bash
openssl genrsa -out server.key 2048
```
这会在当前目录生成一个名为server.key的文件，包含你的私钥。

## 生成证书签名请求 (CSR)

接下来，使用生成的私钥创建证书签名请求 (CSR)。CSR 将包含证书的信息，如国家、组织、通用名称 (Common Name, CN) 等。

```bash
openssl req -new -key server.key -out server.csr
```

执行这条命令后，OpenSSL 会提示你输入一些信息来生成 CSR：

Country Name (2 letter code): 例如 US 或 CN
State or Province Name (full name): 例如 California
Locality Name (eg, city): 例如 Los Angeles
Organization Name (eg, company): 例如 My Company
Organizational Unit Name (eg, section): 例如 IT
Common Name (eg, fully qualified domain name): 例如 example.com
Email Address: 例如 admin@example.com
其他字段可以留空，直接回车跳过。

## 生成自签名证书

现在，你可以使用CSR和私钥生成自签名证书。这里，我们生成一个有效期为365天的证书：

```bash
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
```

这会生成一个名为server.crt的证书文件。

## 配置HTTPS服务器

在配置Web服务器（如 Nginx、Apache）时，将生成的私钥 (server.key) 和证书 (server.crt) 文件路径指向相应的配置项。

例如，在Nginx中：

```nginx
server {
listen 443 ssl;
server_name example.com;

    ssl_certificate /path/to/server.crt;
    ssl_certificate_key /path/to/server.key;

    # 其他配置项...
}
```

## （可选）合并证书和私钥

有时，你可能需要将证书和私钥合并成一个.pem文件：

```bash
cat server.crt server.key > server.pem
```

这个文件可以在一些需要单个文件的应用程序或服务中使用。

## （客户端）信任自签名证书

因为这是一个自签名证书，客户端访问该服务器时通常会收到“不受信任的证书”警告。如果你想在本地开发环境中消除这个警告，可以将server.crt文件导入到操作系统或浏览器的受信任证书存储中。

上述步骤完成后，你的服务器应该能够使用HTTPS协议与客户端安全通信。如果是生产环境，建议使用受信任的证书颁发机构 (CA) 签发的证书，而不是自签名证书。

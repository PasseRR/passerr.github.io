---
layout: post
title: RTSP转WebRTC流播放
categories: [js,operation]
last_modified_at: 2023-05-25
toc: true
---
## RTSP播放方案

1. ffmpeg + nginx + video.js，rtsp转rtmp播放
   - 优点：延迟一般(1秒以上)
   - 缺点：依赖flash，但现代浏览器大多禁用或不能使用flash
   - [参考方案](https://blog.csdn.net/xu_xu_0924/article/details/111984672){:target="_blank"}

2. ffmpeg + video.js，rtsp转hls播放
   - 优点：不同码率无缝切换
   - 缺点1：延迟较高
   - 缺点2：切片文件碎片化
   - [参考方案](https://mp.weixin.qq.com/s/ZQkjlkfo7zmOo2mjDRTmbg){:target="_blank"}

3. ffmpeg + websocket + flv.js，rtsp转flv播放
   - 优点1：延迟较低(1秒左右)
   - 优点2：无需安装插件
   - 缺点：额外的ws支持
   - [参考方案](https://www.cnblogs.com/liuqin-always/p/13853100.html){:target="_blank"}

4. [VLC](https://github.com/videolan/vlc){:target="_blank"}插件播放
   - 优点：延迟低(毫秒级别)
   - 缺点1：需要安装VLC插件
   - 缺点2：不支持H265编码
   - 缺点3：仅支持IE浏览器或低版本Chrome
   - [参考方案](https://blog.csdn.net/zyhse/article/details/113771661){:target="_blank"}

5. [SmartPlayer](https://github.com/daniulive/SmarterStreaming){:target="_blank"}插件播放
   - 优点1：延迟低(毫秒级别)
   - 优点2：支持H265、MJPEG编码
   - 缺点：需要商用授权

6. rtsp转webrtc播放
   - 优点1：延迟低(毫秒级别)
   - 优点2：无需安装插件
   - 缺点1：linux下webrtc-streamer依赖的glibc版本较高，升级困难
   - 缺点2：不支持H265编码
   - [参考方案](https://blog.csdn.net/qq_20937557/article/details/129879697){:target="_blank"}

综合以上方案，最终选择使用webrtc播放，使用webrtc-streamer将rtsp转为webrtc播放。

## [webrtc-streamer](https://github.com/mpromonet/webrtc-streamer){:target="_blank"}

在github的[发布记录](https://github.com/mpromonet/webrtc-streamer/releases){:target="_blank"}中找到合适的版本，下载相应操作系统的可执行文件，本文使用的版本为[v0.8.0](https://github.com/mpromonet/webrtc-streamer/releases/tag/v0.8.0){:target="_blank"}。

### window下安装

#### 1. 下载windows版本的webrtc-streamer

[点击下载v0.6.5](https://github.com/mpromonet/webrtc-streamer/releases/download/v0.6.5/webrtc-streamer-v0.6.5-Windows-AMD64-Release.tar.gz)，
其他版本下载启动后转流就自动停止，暂时未做问题分析。

#### 2. 启动服务

```bash
# 默认监听0.0.0.0:8000
.\webrtc-streamer.exe -o -s-
```

### centos下安装

#### 1. 下载linux版本的webrtc-streamer

[点击下载v0.8.0](https://github.com/mpromonet/webrtc-streamer/releases/download/v0.8.0/webrtc-streamer-v0.8.0-Linux-x86_64-Release.tar.gz)

```bash
wget https://github.com/mpromonet/webrtc-streamer/releases/download/v0.8.0/webrtc-streamer-v0.8.0-Linux-x86_64-Release.tar.gz
tar -zxvf webrtc-streamer-v0.8.0-Linux-x86_64-Release.tar.gz
cd webrtc-streamer-v0.8.0-Linux-x86_64-Release
./webrtc-streamer
```

#### 2. 缺少库

```bash
# ./webrtc-streamer: error while loading shared libraries: libXcomposite.so.1: cannot open shared object file: No such file or directory
yum install -y libXcomposite

# ./webrtc-streamer: error while loading shared libraries: libXrandr.so.2: cannot open shared object file: No such file or directory
yum install -y libXrandr.x86_64

# ./webrtc-streamer: error while loading shared libraries: libXtst.so.6: cannot open shared object file: No such file or directory
yum install -y libXtst

# ./webrtc-streamer: error while loading shared libraries: libX11.so.6: cannot open shared object file: No such file or directory
yum install -y libX11

# ./webrtc-streamer: error while loading shared libraries: libXext.so.6: cannot open shared object file: No such file or directory
yum install -y libXext

# ./webrtc-streamer: error while loading shared libraries: libXdamage.so.1: cannot open shared object file: No such file or directory
yum install -y libXdamage

# ./webrtc-streamer: error while loading shared libraries: libXcomposite.so.1: cannot open shared object file: No such file or directory
yum install -y libXcomposite

# ./webrtc-streamer: error while loading shared libraries: libXrandr.so.2: cannot open shared object file: No such file or directory
yum install -y libXrandr

# ./webrtc-streamer: error while loading shared libraries: libXtst.so.6: cannot open shared object file: No such file or directory
yum install -y libXtst

# 汇总
yum install -y libXcomposite libXrandr.x86_64 libXtst libX11 libXext libXdamage libXcomposite libXrandr libXtst
```

#### 3.glibc版本过低升级

需要升级[glibc](https://mirrors.aliyun.com/gnu/glibc/){:target="_blank"}至少`2.35`及以上版本

```bash
# glibc版本过低提示信息
# ./webrtc-streamer: /lib64/libm.so.6: version `GLIBC_2.27' not found (required by ./webrtc-streamer)
# ./webrtc-streamer: /lib64/libm.so.6: version `GLIBC_2.29' not found (required by ./webrtc-streamer)
# ./webrtc-streamer: /lib64/libm.so.6: version `GLIBC_2.35' not found (required by ./webrtc-streamer)
# ./webrtc-streamer: /lib64/libc.so.6: version `GLIBC_2.25' not found (required by ./webrtc-streamer)
# ./webrtc-streamer: /lib64/libc.so.6: version `GLIBC_2.32' not found (required by ./webrtc-streamer)
# ./webrtc-streamer: /lib64/libc.so.6: version `GLIBC_2.35' not found (required by ./webrtc-streamer)
# ./webrtc-streamer: /lib64/libc.so.6: version `GLIBC_2.34' not found (required by ./webrtc-streamer)
# ./webrtc-streamer: /lib64/libc.so.6: version `GLIBC_2.28' not found (required by ./webrtc-streamer)
# ./webrtc-streamer: /lib64/libc.so.6: version `GLIBC_2.33' not found (required by ./webrtc-streamer)

# 查看glibc版本
ldd --version
```

参考[CentOs升级gcc、glibc](./2023-05-24-centos-gcc-glibc-upgrade.md)，升级过程会比较漫长。

#### 4.启动服务

```bash
# 默认监听0.0.0.0:8000
./webrtc-streamer -o -s-
```

### 遇到的问题

#### 1. 视频不能播放

检查视频编码是否是`H264`，webrtc当前不支持**H265**编码，大多数摄像机默认编码均是H265。

#### 2. 同屏多个视频播放CPU占用率高

[参考](https://github.com/mpromonet/webrtc-streamer/issues/401#issuecomment-813301063){:target="_blank"}，启动参数添加`-o`即可。

#### 3. 视频出现绿屏、花屏

禁用浏览器硬件加速，以google为例。

[![][1]][1]{:target="_blank"}

#### 4. 公网播放问题

[参考](https://github.com/mpromonet/webrtc-streamer/issues/314#issuecomment-615135937){:target="_blank"}，使用webrtc-streamer内嵌的`TURN`server

```bash
# 本机存在公网地址
./webrtc-streamer -o -s- -T0.0.0.0:3478 -tturn:turn@$(curl ifconfig.me -s):3478

# 使用公网映射需要TCP和UDP协议都支持 假如将本机3478端口映射到公网turn.abc.com:13478端口
./webrtc-streamer -o -s- -T0.0.0.0:3478 -tturn:turn@turn.abc.com:13478
```

## demo

配置webrtc-streamer的Http服务地址即可，[参考Github](https://github.com/mpromonet/webrtc-streamer-html){:target="_blank"}

[comment]:<>(关于VLC和SmartPlayer的比较 http://www.taodudu.cc/news/show-1128355.html?action=onClick)
[comment]:<>(史上最详细的webrtc-streamer访问摄像机视频流教程 https://blog.csdn.net/qq_20937557/article/details/129879697)
[1]: {{ site.cdn }}/assets/2023/05-25/chrome.png
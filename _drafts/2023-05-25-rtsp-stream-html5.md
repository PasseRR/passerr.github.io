---
layout: post
title:  HTML5播放RTSP视频流
categories: [java]
last_modified_at: 2023-05-25
toc: true
---

要点
1. webrtc、[webrtc-streamer](https://github.com/mpromonet/webrtc-streamer)
2. H264编码
3. webrtc-streamer需要添加`-o`参数避免CPU占用率过高

centos下使用

```shell
# ./webrtc-streamer: error while loading shared libraries: libXcomposite.so.1: cannot open shared object file: No such file or directory
yum install libXcomposite

# ./webrtc-streamer: error while loading shared libraries: libXrandr.so.2: cannot open shared object file: No such file or directory
yum install libXrandr.x86_64

# ./webrtc-streamer: error while loading shared libraries: libXtst.so.6: cannot open shared object file: No such file or directory
yum install libXtst

# glibc版本过低

```
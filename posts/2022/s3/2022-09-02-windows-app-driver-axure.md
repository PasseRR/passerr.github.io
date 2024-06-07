---
title:  使用WindowsAppDriver将axure的rp文件转为html
tags: [axure, java, 其他]
---

公司产品经理现状，原型开发产出rp文件，若开发同事想要看到原型需要将rp文件转为html，通过ftp或者文件共享的方式浏览。
若把rp文件也当作源代码或者源代码的一部分，版本控制rp文件，结合`gitlab ci`及`gitlab pages`来实现自动将rp文件转为html，然后发布到pages，
开发同事通过pages地址就可以愉快的浏览原型了。

我以为axure会提供以命令行的方式将rp文件转为html，然而咨询了官方，并未提供该功能，于是便有了本篇文章的尝试。

![p1][1]

## [WinAppDriver](https://github.com/microsoft/WinAppDriver)
做过web自动化的应该都知道Selenium，WinAppDriver其实是一个类似Selenium的UI自动化驱动服务框架。
因为Axure没有提供命令行方式，所以我就想到了通过自动化测试方式来模拟实现rp文件转换。

### 1. [下载](https://github.com/microsoft/WinAppDriver/releases)最新的驱动安装
### 2. 设置开发者模式

![p2][2]

### 3. 驱动安装目录以powershell启动WinAppDriver服务，**不能以后台服务的方式运行**
```bat
# 默认localhost 4723
.\WinAppDriver.exe
# 仅指定端口
.\WinAppDriver.exe 4727
# 指定端口及ip 默认是localhost 远程服务需要以管理员身份运行
.\WinAppDriver.exe 192.168.5.2 4723
```
### 4. [inspect.exe](/assets/2022/09-02/inspect.exe){download}元素识别工具
结合[文档](https://github.com/microsoft/WinAppDriver/blob/master/Docs/AuthoringTestScripts.md)使用

## 自动化测试脚本/服务
基于[官方demo](https://github.com/microsoft/WinAppDriver/tree/master/Samples/Java/CalculatorTest)，
开发的Axure 9自动将rp文件转html，参考[项目代码](https://gitee.com/PasseRR/axure-automic-driver)，最终运行效果如下

![p3][3]

自此，自己实现了一种方式，通过jar将rp文件转为html，为下一步gitlab ci自动化rp做好了准备。

[1]: /assets/2022/09-02/axure.png "axure"
[2]: /assets/2022/09-02/develop-mode.png "develop-mode"
[3]: /assets/2022/09-02/rp-html.gif "rp-html"

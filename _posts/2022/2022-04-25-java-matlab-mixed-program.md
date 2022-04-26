---
layout: post
title:  java和matlab混合编程问题
categories: [java]
last_modified_at: 2022-04-26
---

## windows
windows下环境比较顺利，matlab runtime home目录为`C:\matlab\runtime\v910`，只需在jar启动时添加如下library即可。
- %MATLAB_HOME%\lib\win64
- %MATLAB_HOME%\runtime\win64
- %MATLAB_HOME%\bin\win64

java启动命令如下(或者使用winsw.exe配置在xml中)
```
java -Dfile.encoding=utf-8 -Xms2G -Xmx2G -Xmn512M -Djava.library.path=C:\matlab\runtime\v910\lib\win64 -Djava.library.path=C:\matlab\runtime\v910\runtime\win64 -Djava.library.path=C:\matlab\runtime\v910\bin\win64 -Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5001 -jar "C:\Publish\GeologyToolServer\GeologyToolServer.jar"
```

## linux(CentOs 7)
matlab runtime home目录为`/MATLAB/R2021a/`

在CentOs中将jar包服务化，原service配置如下:
```
[Unit]
Description=GeologyToolServer service
After=syslog.target

[Service]
Type=simple
ExecStart=/opt/software/jdk1.8.0_171/bin/java -Xms1G -Xmx2G -Djava.library.path=/MATLAB/R2021a/runtime/glnxa64 -Djava.library.path=/MATLAB/R2021a/bin/glnxa64 -Djava.library.path=/MATLAB/R2021a/sys/os/glnxa64  -jar /home/GeologyToolServer.jar --spring.config.location=/home/application.yml
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动后，调用matlab出错，错误信息如下：

```text
Caused by: java.lang.UnsatisfiedLinkError: Failed to find the required library libmwmclmcrrt.so.9.10 on java.library.path.
This library is typically installed along with MATLAB or the MATLAB Runtime. Its absence may indicate an issue with that installation or
the current path configuration, or a mismatch with the architecture of the Java interpreter on the path.
MATLAB Runtime version this component is attempting to use: 9.10.
```
查找后，在/MATLAB/R2021a/runtime/glnxa64找到`libmwmclmcrrt.so.9.10`库文件，官网查询后，
需要添加环境变量`LD_PRELOAD=/MATLAB/R2021a/bin/glnxa64/glibc-2.17_shim.so`，在.bashrc添加后启动，还是相同错误。
使用java -jar方式直接启动，正常运行，初步怀疑跟centos服务化加载环境变量有关。

最后解决方案，将`LD_PRELOAD`和`LD_LIBRARY_PATH`配置在service文件中，重启服务，问题解决。附service配置文件。
```
[Unit]
Description=GeologyToolServer service
After=syslog.target

[Service]
Type=simple
Environment="LD_PRELOAD=/MATLAB/R2021a/bin/glnxa64/glibc-2.17_shim.so"
Environment="LD_LIBRARY_PATH=/MATLAB/R2021a/runtime/glnxa64:/MATLAB/R2021a/bin/glnxa64:/MATLAB/R2021a/sys/os/glnxa64:/MATLAB/R2021a/sys/os/glnxa64/orig"
ExecStart=/opt/software/jdk1.8.0_171/bin/java -Xms1G -Xmx2G -DSERVICE_LOG_FOLDER=/home -jar /home/GeologyToolServer/GeologyToolServer.jar --spring.config.location=/home/GeologyToolServer/application.yml
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```
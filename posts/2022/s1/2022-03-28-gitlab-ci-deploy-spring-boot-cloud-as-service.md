---
title:  Gitlab CI以服务化的方式部署SpringBoot/SpringCloud
categories: [ci/cd, 运维]
---

在使用gitlab ci的时候，在部署windows或者Linux的时候希望以服务化的方式部署，
这样当服务器重启的时候可以自动重启响应的服务。

## windows
windows主要基于[winsw](https://github.com/winsw/winsw)做jar的服务化，在做ci的时候自动写winsw.xml配置文件。

**windows ci主要脚本**

```yaml
# 部署过程
.java:windows:
  stage: deploy
  extends: .message:info
  script:
    - !reference [ ".prepare:java" ]
    # 停止或者创建windows服务更新服务配置文件
    - |
      ssh -q $V_HOST 'powershell;\ 
      New-Item $JAVA_REMOTE_ROOT -ItemType Directory;\
      cd $JAVA_REMOTE_ROOT;\
      if (-Not Test-Path "winsw.xml" -PathType leaf) {
        New-Item winsw.xml
      }
      $SERVICE_XML=@"
      <service>
        <id>$V_SERVICE_ID</id>
        <name>$V_SERVICE_ID</name>
        <description>$CI_PROJECT_PATH</description>
        <executable>java</executable>
        <arguments>$V_OPS</arguments>
        <startmode>Automatic</startmode>
      </service>
      "@;
      Set-Content winsw.xml $SERVICE_XML; \
      if (-Not Test-Path "winsw.exe" -PathType leaf) {
        Invoke-WebRequest -Headers @{"PRIVATE-TOKEN"="glpat-yn_DTx1vZqX1sRSXsUYs"} -Uri "$GITLAB_WIDE_URL/api/v4/projects/452/repository/files/java%2FWinSW-x64-2.11.0.exe/raw" -OutFile "winsw.exe"
      }
      Get-Service -Name "$V_SERVICE_ID"; \
      if (-Not $?) {
        ./winsw.exe uninstall
        ./winsw.exe install
      }
      ./winsw.exe stop;\
      Start-Sleep -s 3'
    # 复制jar包 注意需要加/ 否则命令会一直卡着
    - scp $V_JAR_NAME $V_HOST:/${JAVA_REMOTE_ROOT}
    # 重启服务
    - ssh -q $V_HOST "powershell; cd $JAVA_REMOTE_ROOT; ./winsw.exe restart"
```

## Linux(CentOs 7)
[关于服务配置](./2022-03-20-centos-7-systemd.md){:target="_blank"}

基于systemd做centos的服务化，每次ci根据参数配置服务并更新，然后重启服务。

**CentOs 7 CI主要脚本**

```yaml
.java:linux:
  stage: deploy
  extends: .message:info
  script:
    - !reference [ ".prepare:java" ]
    # 创建linux服务及停止服务
    - |
      ssh -q $V_HOST "
      set -e;
      . /etc/profile;
      java -version;
      cat <<EOF >/usr/lib/systemd/system/${V_SERVICE_ID}.service
      [Unit]
      Description=$CI_PROJECT_PATH
      After=syslog.target
      [Service]
      WorkingDirectory=$JAVA_REMOTE_ROOT
      ExecStart=/bin/bash -lc '\`which java\` $V_OPS' 
      Restart=always
      RestartSec=10
      [Install]
      WantedBy=multi-user.target
      EOF
      systemctl daemon-reload;
      systemctl enable ${V_SERVICE_ID};
      mkdir -p $JAVA_REMOTE_ROOT;
      systemctl stop ${V_SERVICE_ID} || true;
      "
    # 复制jar包
    - scp $V_JAR_NAME $V_HOST:$JAVA_REMOTE_ROOT
    # 重启服务
    - ssh -q $V_HOST "systemctl restart ${V_SERVICE_ID}"
```

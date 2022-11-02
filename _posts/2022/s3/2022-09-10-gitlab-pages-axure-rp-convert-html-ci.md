---
layout: post
title:  Gitlab自动将rp文件转html部署pages
categories: [ci, operation]
last_modified_at: 2022-09-10
---

## 前言
在了解[基于WinAppDriver实现的rp文件转html](./2022-09-02-windows-app-driver-axure.md){:target="_blank"}后，
我们可以结合gitlab runner实现自动化将rp文件部署到gitlab pages。

## 搭建[windows gitlab runner](https://docs.gitlab.com/runner/install/windows.html){:target="_blank"}

1. 注册runner到gitlab
2. 修改config.toml，避免乱码
    ```toml
    pre_clone_script = "chcp 65001"
    pre_build_script = "chcp 65001"
    ```

## windows服务器配置

由于WinAppDriver需要检测ui元素，所以必须有一个用户持有显示器，并且保证用户session存在。

1. 开启WinAppDriver服务
    ```shell
    .\WinAppDriver.exe
    ```
2. 修改用户session时间, 运行输入gpedit.msc打开组策略设置
   用户配置 -> 管理模版 -> Windows组件 -> 远程桌面服务 -> 远程桌面会话 -> 会话时间
   [![][1]][1]{:target="_blank"}

3. 关闭windows自动更新，可能会顶层弹窗，影响ui元素捕捉，运行输入sconfig.msc

   [![][2]][2]{:target="_blank"}

4. 关闭axure自动更新
5. 复制[axure-automation.jar]({{ site.cdn }}/assets/2022/09-10/axure-automation.jar)到c盘根目录
6. 关闭远程连接，任务管理器 -> 用户，查看用户远程连接会话id，RDP-Tcp#后面的数字
    ```shell
    # 在powershell中使用绝对路径
    # 来源 https://stackoverflow.com/questions/62969814/winappdriver-based-automation-stops-working-on-windows-10-vm-when-i-close-the-rd
    C:\Windows\System32\tscon.exe RDP-Tcp#37 /dest:console
    ```
    [参照官方文档](https://github.com/microsoft/WinAppDriver/blob/master/Docs/RunningOnRemoteMachine.md)使用[QRes.exe]({{ site.cdn }}/assets/2022/09-10/qres.zip)，
    创建logout-rdp.cmd文件如下
    ```cmd
    for /f "skip=1 tokens=3" %%s in ('query user %USERNAME%') do (C:\Windows\System32\tscon.exe %%s /dest:console 
    C:\qres\QRes.exe /x 1920 /y 1080)
    ```

## 编写gitlab-ci脚本

1. 开启gitlab pages， 修改gitlab.rb配置，重启gitlab服务
    ```ruby
    pages_external_url "http://yourdomain.com"
    gitlab_pages['enable'] = true
    ```
3. pages任务
    ```yaml
    pages:
      variables:
        AXURE_FILE_NAME: 你的rp文件名字.rp
      script:
        # 基本参数校验
        - |
          if($AXURE_FILE_NAME -eq $null) 
          {
            echo "必须配置AXURE_FILE_NAME(rp文件名)变量"
            exit 1
          }
          if(-not(Test-Path $AXURE_FILE_NAME -PathType leaf))
          {
            echo "文件${AXURE_FILE_NAME}不存在"
            exit 1
          }
        # 创建public目录
        - mkdir public > $null
        # 确保axure-automation.jar在C盘根目录
        - java "-Dfile.encoding=utf8" "-Dworkspace=${pwd}" "-DrpFileName=${AXURE_FILE_NAME}" -jar C:\axure-automation.jar
      artifacts:
        paths:
          - public
    ```
4. windows钉钉消息发送脚本

    ```yaml
    # 钉钉消息发送http Anchors
    .send_request: &send_request
      # markdown消息内容 替换换行符
      - |
        $V_TEXT = @"
        **CI任务<font color=\"$(${V_COLOR})\">$(${V_STATUS})</font>通知**$(${V_BR})
        项目: **$(${CI_PROJECT_PATH})**$(${V_BR})
        分支: **$(${CI_BUILD_REF_NAME})**$(${V_BR})
        任务名: **$(${PROTOTYPE_NAME})原型部署**$(${V_BR})
        任务ID: **$(${CI_JOB_ID})**$(${V_BR})
        执行人: **$(${GITLAB_USER_NAME})**${V_EXTRA}
        "@ -replace "`n",""
      # 成功时才展示原型地址
      - |
        $V_PROTOTYPE = ""
        if($V_STATUS -eq "执行成功")
        {
          $V_PROTOTYPE = @"
          , {
            "title": "查看原型",
            "actionURL": "dingtalk://dingtalkclient/page/link?url=$($V_PAGES_URL)&pc_slide=false"
          }
        "@
        } 
        Else 
        {
          $V_PROTOTYPE = @"
          , {
            "title": "查看任务",
            "actionURL": "dingtalk://dingtalkclient/page/link?url=$($V_TASK_URL)&pc_slide=false"
          }
        "@
        }
      # 钉钉消息发送json报文
      - |
        $V_JSON = @"
        {
          "actionCard": {
            "title": "$($V_TITLE)",
            "text": "$($V_TEXT)",
            "btnOrientation": "1",
            "btns": [{
              "title": "查看项目",
              "actionURL": "dingtalk://dingtalkclient/page/link?url=$($V_PROJECT_URL)&pc_slide=false"
            }$($V_PROTOTYPE)]
          },
          "msgtype": "actionCard"
        }
        "@ -replace "`n",""
      # 发送http请求
      - >
        Invoke-WebRequest -Uri "https://oapi.dingtalk.com/robot/send?access_token=$DINGTALK_ACCESS_TOKEN"
        -Method Post -ContentType "application/json; charset=utf-8" -Body "$V_JSON" -UseBasicParsing
    ```
5. 结合钉钉消息效果

    [![][3]][3]{:target="_blank"}

自此，结合WinAppDriver完成了一个简陋版的rp文件ci/cd，基本满足现有工作需要。

[1]: {{ site.cdn }}/assets/2022/09-10/gpedit.gif "gpedit"
[2]: {{ site.cdn }}/assets/2022/09-10/sconfig.jpeg "sconfig"
[3]: {{ site.cdn }}/assets/2022/09-10/dingding.png "dingding"
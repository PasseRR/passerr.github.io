---
layout: post
title:  Gitlab CI/CD集成钉钉消息通知模板
categories: [ci]
last_modified_at: 2022-02-23
---

## 前言
在使用Gitlab进行CI/CD的时候，希望在任务开始/结束(成功或失败)的时候能有对应的消息通知机制，
结合.gitlab-ci.yml的include模板功能，实现钉钉消息通知模板，在实际的CI任务中，只需include对应模板，
extends对应任务实现的before_script和after_script就可以实现消息通知机制。

## 消息通知模板定义
[钉钉消息链接说明](https://open.dingtalk.com/document/orgapp-server/message-link-description){:target="_blank"}

在gitlab中新建仓库，名为`gitlab/gitlab-ci`，仓库中添加文件`dingtalk.yml`模板文件，内容如下：

```yaml
# 钉钉消息发送模版任务
# 必须变量
# DINGTALK_ACCESS_TOKEN 群机器人token

variables:
  # 钉钉markdown换行符 必须\n且前后跟两个空格(shell 转义)
  V_BR: "\ \ \\n\ \ "

# 消息发送准备工作
# 检测钉钉消息发送access_token是否存在
.prepare: &prepare
  # token检验
  - |
    if [ -z $DINGTALK_ACCESS_TOKEN ]; then
      echo "使用钉钉消息发送必须配置DINGTALK_ACCESS_TOKEN变量"
      exit 1
    fi
  # url编码项目地址及任务地址
  - |
    project_url="$(curl -s -o /dev/null -w %{url_effective} --get --data-urlencode "${GITLAB_URL}/${CI_PROJECT_PATH}/-/tree/${CI_BUILD_REF_NAME}" "" || true)"
    job_url="$(curl -s -o /dev/null -w %{url_effective} --get --data-urlencode "${GITLAB_URL}/${CI_PROJECT_PATH}/-/jobs/${CI_JOB_ID}" "" || true)"

# 钉钉消息发送http Anchors
.send_request: &send_request
  # Markdown消息内容
  - |
    V_TEXT="**CI任务<font color=\\\"${V_COLOR}\\\">${V_STATUS}</font>通知**${V_BR}\
    任务ID: **${CI_JOB_ID}**${V_BR}\
    任务名: **${CI_JOB_NAME}**${V_BR}\
    项目: **${CI_PROJECT_PATH}**${V_BR}\
    分支: **${CI_BUILD_REF_NAME}**${V_BR}\
    执行人: **${GITLAB_USER_NAME}**${V_EXTRA}\
    "
  # 钉钉消息发送json报文
  - |
    V_JSON="{
      \"actionCard\": {\
            \"title\": \"${V_TITLE}\",\
            \"text\": \"${V_TEXT}\", \
            \"btnOrientation\": \"1\",\
            \"btns\": [{\
               \"title\": \"查看项目\",
               \"actionURL\": \"dingtalk://dingtalkclient/page/link?url=${project_url##/?}&pc_slide=false\"
             }, {\
              \"title\": \"查看任务\",
              \"actionURL\": \"dingtalk://dingtalkclient/page/link?url=${job_url##/?}&pc_slide=false\"
            }]\
        },\
        \"msgtype\": \"actionCard\"\
    }"
  - >
    curl -s -H 'Content-Type: application/json; charset=utf-8' -X POST 
    https://oapi.dingtalk.com/robot/send?access_token=${DINGTALK_ACCESS_TOKEN} -d "${V_JSON}" -w "\n"

# 消息发送模板任务
.dingtalk:
  # 发送ci开始消息
  before_script:
    - *prepare
    - |
      V_COLOR="#FF9900"
      V_STATUS="启动"
      V_TITLE="CI任务启动通知"
    - *send_request

  # 发送ci结束消息
  after_script:
    - *prepare
    # 不同任务状态设置不同消息标题、颜色
    - |
      case $CI_JOB_STATUS in
        success)
          V_TITLE="CI任务执行成功通知"
          V_STATUS="执行成功"
          V_COLOR="#33CC00"
          ;;
        failed)
          V_TITLE="CI任务执行失败通知"
          V_STATUS="执行失败"
          V_COLOR="#FF3333"
          ;;
        *)
          echo "不支持job状态${CI_JOB_STATUS}"
          exit 1
          ;;
      esac
    # 执行耗时计算
    - |
      start_time=`date -d ${CI_JOB_STARTED_AT} "+%Y-%m-%d %H:%M:%S"`
      seconds=$(($(date +%s) - $(date +%s -d "${start_time}")))
      V_EXTRA="${V_BR}耗时: **$[seconds/60]分$[seconds%60]秒**"
    - *send_request
```

## 钉钉机群机器人添加

群(要想被通知的群)设置 -> 智能群助手 -> 添加机器人 -> 添加自定义机器人 -> 设置自定义关键字(CI或者分支) -> 复制机器人access_token待用

## CI任务接入
在需要做ci的仓库中，编辑`.gitlab-ci.yml`，内容如下

```yaml
# 模板文件引入
include:
  - project: gitlab/gitlab-ci
    ref: master
    file: dingtalk.yml

# 对应值为刚刚复制的access_token
# 全局变量 若需要每个任务发送不同的钉钉群 将变量定义在job中
variables:
  D_ACCESS_TOKEN: your-dingtalk-access-token

测试任务:
  stage: build
  # 模板任务继承
  extends: .dingtalk
  only:
    - schedules
  script:
    # 执行你的部署脚本
    - sleep 2
  tags:
    - ci
```

## 效果

[![启动][1]][1]{:target="_blank"}
[![成功][2]][2]{:target="_blank"}
[![失败][3]][3]{:target="_blank"}

[1]: {{ site.cdn }}/assets/2022/02-23/start.jpg
[2]: {{ site.cdn }}/assets/2022/02-23/success.jpg
[3]: {{ site.cdn }}/assets/2022/02-23/failed.jpg
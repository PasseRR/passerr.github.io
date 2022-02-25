---
layout: post
title:  Gitlab CI/CD集成钉钉消息通知模板
mermaid: true
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
# 检测钉钉消息发送access_token是否存在
.access_token: &access_token
  - |
    if [ -z $access_token ];then
      echo -e "\e[31m使用钉钉消息发送必须配置access_token变量"
      exit 1
    fi

# 钉钉消息发送http Anchors
.send_request: &send_request
  # url编码项目地址及任务地址
  - |
    project_url="$(curl -s -o /dev/null -w %{url_effective} --get --data-urlencode "${public_host}/${CI_PROJECT_PATH}" "" || true)"
    job_url="$(curl -s -o /dev/null -w %{url_effective} --get --data-urlencode "${public_host}/${CI_PROJECT_PATH}/-/jobs/${CI_JOB_ID}" "" || true)"
  - |
    data=$(cat <<-END
        {
          "actionCard": {
              "title": "${title}", 
              "text": "${text}", 
              "btnOrientation": "0", 
              "singleTitle" : "任务详情",
              "singleURL" : "dingtalk://dingtalkclient/page/link?url=${job_url##/?}&pc_slide=false"
          },
          "msgtype": "actionCard"
        }
    END)
  - >
    curl -s -H 'Content-Type: application/json; charset=utf-8' 
    -X POST https://oapi.dingtalk.com/robot/send?access_token=${access_token} -d "${data}"

# 消息发送模板任务
.dingtalk:
  variables:
    # 公网gitlab地址
    public_host: "http://192.168.235.131"
  # 发送ci开始消息
  before_script:
    - *access_token
    - |
      text=$(cat <<-END
        **CI任务<font color=\"#FF9900\">启动</font>通知**\n
        ID: **${CI_JOB_ID}**\n
        任务: **${CI_JOB_NAME}**\n
        项目: **[${CI_PROJECT_PATH}](dingtalk://dingtalkclient/page/link?url=${project_url##/?}&pc_slide=false)**\n
        分支: **${CI_DEFAULT_BRANCH}**\n
        执行人: **${GITLAB_USER_NAME}**
      END)
      title="CI任务启动通知"
    - *send_request
  # 发送ci结束消息
  after_script:
    - *access_token
    # 区分任务状态
    - |
      title="CI任务执行失败通知"
      status="执行失败"
      color="#FF3333"
      if [ "${CI_JOB_STATUS}" = "success" ]; then
        title="CI任务执行成功通知"
        status="执行成功"
        color="#33CC00"
      fi
    # 耗时秒
    - |
      start_time=`date -d ${CI_JOB_STARTED_AT} "+%Y-%m-%d %H:%M:%S"`
      seconds=$(($(date +%s) - $(date +%s -d "${start_time}")))
    - |
      text=$(cat <<-END
        **CI任务<font color=\"${color}\">${status}</font>通知**\n
        ID: **${CI_JOB_ID}**\n
        任务: **${CI_JOB_NAME}**\n
        项目: **[${CI_PROJECT_PATH}](dingtalk://dingtalkclient/page/link?url=${project_url##/?}&pc_slide=false)**\n
        分支: **${CI_DEFAULT_BRANCH}**\n
        执行人: **${GITLAB_USER_NAME}**\n
        耗时: **$[seconds/60]分$[seconds%60]秒**
      END)
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
  access_token: your-dingtalk-access-token

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
![启动](https://cdn.jsdelivr.net/gh/PasseRR/passerr.github.io/asserts/2022/02-23/start.jpg)
![成功](https://cdn.jsdelivr.net/gh/PasseRR/passerr.github.io/asserts/2022/02-23/success.jpg)
![失败](https://cdn.jsdelivr.net/gh/PasseRR/passerr.github.io/asserts/2022/02-23/failed.jpg)
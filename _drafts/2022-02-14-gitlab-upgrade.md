---
layout: post
title:  Gitlab跨版本升级计划
mermaid: true
categories: [operation]
last_modified_at: 2022-02-14
---

## 概述
Gitlab不能随意升级，需要按照官方[升级路线](https://docs.gitlab.com/ee/update/index.html#upgrade-paths){:target="_blank"}进行。
比如当前Gitlab版本为`10.0.0`，要升级到最新版本`14.2.6`，那么升级路径如下：  
10.0.0 -> 10.8.7 -> 11.11.8 -> 12.0.12 -> 12.1.17 -> 12.10.14 -> 13.0.14 -> 13.1.11 -> 13.8.8 -> 13.12.15 -> 14.0.11 -> 14.1.8 -> 14.2.6

这是官方给出的，如果不按此路线进行升级可能会出现未知异常，其他版本升级请参照官方升级路线。

## 升级方法
1. [Linux包安装](https://docs.gitlab.com/ee/update/package/){:target="_blank"}
2. 源代码安装
3. Docker安装
4. k8s(Helm)安装

本文将使用第一种方法安装升级。

## 准备工作

ps: 若没有完全的把握升级，建议使用一台备用服务器做升级模拟。

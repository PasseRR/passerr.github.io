---
layout: post
title:  Jekyll远程主题
categories: [others, style, js]
last_modified_at: 2022-01-06
toc: true
---

## 前提
在使用jekyll搭建博客或者网站，已经熟悉了jekyll的目录结构，以电子书为例，
我想使用相同主题的模版来写电子书，仅仅是书的内容不一样，但是其他样式、布局希望是一致，
如果你有这种需求，那么[`jekyll remote theme`](https://www.jekyll.com.cn/docs/themes/) 就是你找的东西。

## 写一个自己的主题

在一个jekyll主题中，仅仅`assert`、`_includes`、`_layouts`、`_sass`目录存在主题的gem中，
其他文件_posts目录、index文件、_config.yml文件都需要在实现网站来写， 通过主题目录我们能定义一个通用布局的网站模版。

以我自己写的[电子书主题](https://github.com/PasseRR/jekyll-eboot-theme) 为例。
1. 修改配置文件_config.yml
    ```yml
   # 引用Github上的主题 即主题地址为https://github.com/PasseRR/jekyll-gitbook-theme
   remote_theme: PasseRR/jekyll-gitbook-theme
   # 可以指定版本、分支或者标签
   remote_theme: PasseRR/jekyll-gitbook-theme@dev
   remote_theme: PasseRR/jekyll-gitbook-theme@V1.0.0
   # 使用url
   remote_theme: http[s]://github.<Enterprise>.com/benbalter/retlab
    ```

2. 新增放电子书的目录`content`
3. 新增`_data`目录及`summary.yml`存放电子书目录
4. 添加的电子书内容，push到github坐等你的电子书生成吧

## 相关主题网站
- [jamstackthemes.dev](https://jamstackthemes.dev/ssg/jekyll/)
- [jekyllthemes.org](http://jekyllthemes.org/)
- [jekyllthemes.io](https://jekyllthemes.io/)
- [jekyll-themes.com](https://jekyll-themes.com/)

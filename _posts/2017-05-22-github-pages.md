---
layout: post
title:  "Github Pages搭建个人博客"
date:   2017-05-22 10:42:34 +0800
categories: [others]
---
# 准备工作
1. 创建一个新的仓库，名为：你的github帐号.github.com，创建后的样子   
![新建仓库](https://cdn.jsdelivr.net/gh/PasseRR/passerr.github.io/images/2017-05-22/repository.png)   
2. 到[Jekyll Themes](http://jekyllthemes.org/)选择一个喜欢的主题，push到个人仓库   
本博客clone自[agusmakmun](https://github.com/agusmakmun/agusmakmun.github.io)

# 目录
1. jekyll基本目录结构  
`.`   
`├── _config.yml 配置文件`  
`├── _drafts 草稿`  
`|  ├── begin-with-the-crazy-ideas.textile`  
`|  └── on-simplicity-in-technology.markdown`  
`├── _includes 可以重用的页面`  
`|  ├── footer.html`  
`|  └── header.html`  
`├── _layouts 模版`  
`|  ├── default.html`  
`|  └── post.html`  
`├── _posts 文章md或者markdown格式`  
`|  ├── 2007-10-29-why-every-programmer-should-play-nethack.md`  
`|  └── 2009-04-26-barcamp-boston-4-roundup.markdown`  
`├── _data`  
`|  └── members.yml 本地数据`  
`└── index.html 首页`  
2. 文档  
[官网文档](http://jekyll.com.cn/docs/home/)

# 发布新文章
在_posts目录下新增一篇文章，push到仓库等github部署完，就可以看到属于你的个人博客了。

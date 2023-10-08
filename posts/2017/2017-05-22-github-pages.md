---
title:  "Github Pages搭建个人博客"
tags: [markdown, javascript, 其他]
---

## 准备工作

1. 创建一个新的仓库，名为：你的github帐号.github.com，创建后的样子

    ![新建仓库][1]

2. 到[Jekyll Themes](http://jekyllthemes.org/)选择一个喜欢的主题，push到个人仓库   
   
    本博客clone自[agusmakmun](https://github.com/agusmakmun/agusmakmun.github.io)

## 目录
1. jekyll基本目录结构  

    ```
    .   
    ├── _config.yml 配置文件  
    ├── _drafts 草稿  
    |  ├── begin-with-the-crazy-ideas.textile  
    |  └── on-simplicity-in-technology.markdown  
    ├── _includes 可以重用的页面  
    |  ├── footer.html  
    |  └── header.html  
    ├── _layouts 模版  
    |  ├── default.html  
    |  └── post.html  
    ├── _posts 文章md或者markdown格式  
    |  ├── 2007-10-29-why-every-programmer-should-play-nethack.md  
    |  └── 2009-04-26-barcamp-boston-4-roundup.markdown  
    ├── _data  
    |  └── members.yml 本地数据  
    └── index.html 首页
    ```

2. 文档  

    [jekyll官网文档](http://jekyll.com.cn/docs/home/)
    
    [liquid模版语言](https://shopify.github.io/liquid/)

## 发布新文章
在`_posts`目录下新增一篇文章，push到仓库等github部署完，就可以看到属于你的个人博客了。

[1]: /assets/2017/05-22/repository.png

---
title:  基于vercel搭建博客
tags: [markdown, 其他]
---

## 什么是[vercel](https://vercel.com)

vercel是一个网站托管平台，平台本身提供CDN加速，类似Netlify和Github Pages，相比之下，国内访问速度比其他的更快。
支持持续集成，每次代码push都会触发自动部署。

vercel针对个人是免费的，团队是收费的。

## 为什么要用vercel
本博客经历过几个阶段，如下
1. 第一阶段

    直接使用Github Pages搭建基于jekyll的博客，结果国内访问巨慢
2. 第二阶段
    
    将静态资源(js、css、图片等)使用jsdelivr cdn，访问速度杠杠的，但是，近期jsdelivr dns被污染了，
    国内无法正常使用，到笔者写这篇博客时还未恢复(大概已经持续了半个月)
3. 第三阶段
    
    使用[jsdelivr-auto-fallback](https://github.com/PipecraftNet/jsdelivr-auto-fallback)，
    自动选择合适的cdn，但是效果并不理想
4. 第四阶段
    
    使用七牛云CDN，[参考](https://www.wucheng.work/2021/11/28/Hexo-GitHub-CDN/)，
    可能由于域名商是境外的原因，效果也不理想
5. 第五阶段

    使用vercel托管博客，vercel快速导入Github的博客项目，每次push自动发布，而且速度比使用jsdelivr还快，
    关键是免费，这简直是白嫖党的福音，又能开心的写博客了

## 部署Github上的站点到vercel
### 1. 注册vercel账号，直接使用Github Oauth
### 2. 添加Github账户，懒的话导全部仓库，否则选择静态网站相关的仓库
    
[![github][1]][1]{target=_blank class=no-icon}
### 3. 导入Github仓库，配置模版(根据静态网站框架，我这里选的jekyll)，再选择站点目录

[![import][2]][2]{target=_blank class=no-icon}
[![import][3]][3]{target=_blank class=no-icon}
### 4. 等待Deployments执行完成

[![deploy][4]][4]{target=_blank class=no-icon}
### 5. 在Overview中点击visit预览，就可以看到你的网站信息了
### 6. 如果有多个站点，重复2-5步即可

[1]: /assets/2022/05-31/github.png "github"
[2]: /assets/2022/05-31/import.png "import"
[3]: /assets/2022/05-31/configure.png "import configure"
[4]: /assets/2022/05-31/deploy.png "deploy"

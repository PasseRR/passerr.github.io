---
layout: post
title:  Github Pages迁移到vercel
categories: [md, others]
last_modified_at: 2022-05-31
---

## Github Pages现状

主站点仓库`PasseRR/passerr.github.io`，子站点仓库`PasseRR/DesignPatterns`及`PasseRR/JavaLeetCode`。
主站点的CNAME为`www.xiehai.win`

## 迁移过程
1. 将所有站点导入**vercel**
2. [将vercel多个项目配置为一个域名](https://vercel.com/support/articles/how-can-i-serve-multiple-projects-under-a-single-domain){:target="_blank"}，在主站点根目录添加`vercel.json`

    ```javascript
    {
        // 路径重写
        "rewrites": [
        {
        "source": "/:match*/",
        "destination": "/:match*"
        },
        {
        "source": "/DesignPatterns/:match*",
        // 目标地址是子站点的vercel地址
        "destination": "https://design-patterns-nine.vercel.app/:match*"
        },
        {
        "source": "/jdk-features/:match*",
        "destination": "https://jdk-features.vercel.app/:match*"
        },
        {
        "source": "/JavaLeetCode/:match*",
        "destination": "https://java-leet-code.vercel.app/:match*"
        },
        {
        "source": "/Java-Example/:match*",
        "destination": "https://java-example.vercel.app/:match*"
        }
        ],
        // 忽略vercel构建的comment
        "github": {
            "silent": true
        }
    }
    ```
3. 配置主站域名，若是个新域名，将旧域名重定向到新域名

    ![域名]({{ site.cdn }}/assets/2022/06-01/domain.png)
4. 删除github的域名或者直接删除CNAME文件
5. 等待dns缓存过期，访问新的域名就可以看到基于vercel的新站点了

P.S. github子站点会存在一个上下文路径，以`PasseRR/DesignPatterns`为例，上下文路径为`DesignPatterns`，
但在vercel中是独立站点，需要去掉上下文路径，添加路径重写配置文件(vercel.json)如下：
```json
{
  "rewrites": [
    {
      "source": "/DesignPatterns/:match*",
      "destination": "/:match*"
    }
  ],
  "github": {
    "silent": true
  }
}
```
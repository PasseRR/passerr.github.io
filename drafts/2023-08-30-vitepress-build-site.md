---
title:  "基于vitepress快速搭建个人站点"
tags: [markdown, vite, javascript, 其他]
---

## 集成mermaid

vitepress-plugin-mermaid

## 利用transformPageData自动添加上一页、下一页

```js
transformPageData: page => {
    // 页面是否是博客
    const index = postMapping[page.relativePath];
    // 非博客的页面 设置编辑链接、更新日期、边栏不显示
    if (index === undefined) {
        // 用于区分是页面还是博客
        page.frontmatter.page = true
        page.frontmatter.aside = false
        page.frontmatter.editLink = false;
        page.frontmatter.lastUpdated = false;
        return
    }

    // 用于自动添加博客上一篇、下一篇
    if (index < posts.length - 1) {
        page.frontmatter.next = {
            text: posts[index + 1].frontMatter.title,
            link: posts[index + 1].regularPath
        }
    }

    if (index > 0) {
        page.frontmatter.prev = {
            text: posts[index - 1].frontMatter.title,
            link: posts[index - 1].regularPath
        }
    }
}
```

## 利用buildEnd生成sitemap_index.xml文件

```js
buildEnd: async s => {
    const paths = resolve(s.outDir);
    let xml = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\
<sitemap><loc>${site.main}/sitemap.xml</loc> <lastmod>2019-05-06T00:00:00+00:00</lastmod></sitemap>`;
    site.books.forEach(it => {
        xml += `<sitemap><loc>${site.main}${it.url}/sitemap.xml</loc><lastmod>${it.date}T00:00:00+00:00</lastmod></sitemap>`
    })
    xml += '</sitemapindex>'
    await fs.writeFile(paths + '/sitemap_index.xml', xml);
}
```

## 利用rewrite将多层目录重写为根目录

```js
const rewrites = {}
// 所有博客列表
const posts = await getPosts(site.pageSize)
// 缓存博客位置索引
const postMapping = {};

// 博客路径重写
posts.forEach((it, idx) => {
    rewrites[it.originPath] = it.regularFile
    postMapping[it.regularFile] = idx
})
```

## `no-icon`自动去掉链接上的图标

```md
[![PasseRR/JavaLeetCode](https://gitee.com/PasseRR/JavaLeetCode/widgets/widget_card.svg?colors=4183c4,ffffff,ffffff,e3e9ed,666666,9b9b9b)](https://gitee.com/PasseRR/JavaLeetCode)
{class=no-icon}
```

## 自定义svg图标

https://simpleicons.org/?q=gitee

## 关于`{{`的转义

## 图片放大

https://github.com/vuejs/vitepress/issues/854#issuecomment-1732376667

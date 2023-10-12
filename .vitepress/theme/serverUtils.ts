import {globby} from 'globby'
import matter from 'gray-matter'
import fs from 'fs'
import {resolve} from 'path'

// 博客前缀
const BLOG_PREFIX = '/blogs';

async function getPosts(pageSize) {
    let paths = await globby(['posts/**/*.md'])

    //生成分页页面markdown
    generatePaginationPages(paths.length, pageSize)

    let posts = await Promise.all(
        paths.map(async (item) => {
            const content = fs.readFileSync(item, 'utf-8')
            const {data} = matter(content)
            const name = item.substring(item.lastIndexOf('/') + 1)
            data.date = name.substring(0, 10)
            const regularFile = item.substring(item.lastIndexOf('/') + 1);
            return {
                frontMatter: data,
                // md文件名
                regularFile: regularFile,
                // 原文件路径
                originPath: item,
                // 访问路径
                regularPath: `/${regularFile.replace('.md', '')}`
            }
        })
    )
    posts.sort((a, b) => a.frontMatter.date < b.frontMatter.date ? 1 : -1)
    return posts
}

function generatePaginationPages(total, pageSize) {
    const pagesNum = Math.ceil(total / pageSize), root = resolve('./'), blog = root + BLOG_PREFIX
    if (!fs.existsSync(blog)) {
        fs.mkdirSync(blog);
    }

    if (total > 0) {
        for (let i = 1; i < pagesNum + 1; i++) {
            const page = `
---
title: ${i === 1 ? '博客' : '博客第' + i + '页'}
---
<script setup>
import { useData } from "vitepress";
const { theme } = useData();
const posts = theme.value.posts.slice(${pageSize * (i - 1)},${pageSize * i})
</script>
<Page :posts="posts" :pageCurrent="${i}" :pagesNum="${pagesNum}" />
`.trim();
            fs.writeFileSync(blog + `/${i}.md`, page, 'utf-8');
        }
    }
    // rename page1 to index for homepage
    fs.renameSync(blog + '/1.md', root + '/index.md')
}

export {getPosts, BLOG_PREFIX}

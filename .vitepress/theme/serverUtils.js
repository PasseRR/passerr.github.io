import {globby} from 'globby'
import matter from 'gray-matter'
import fs from 'fs-extra'
import {resolve} from 'path'

// 博客前缀
const BLOG_PREFIX = '/blogs';

async function getPosts(pageSize) {
    let paths = await globby(['posts/**/*.md'])

    //生成分页页面markdown
    await generatePaginationPages(paths.length, pageSize)

    let posts = await Promise.all(
        paths.map(async (item) => {
            const content = await fs.readFile(item, 'utf-8')
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

async function generatePaginationPages(total, pageSize) {
    //  pagesNum
    let pagesNum = total % pageSize === 0 ? total / pageSize : parseInt(total / pageSize) + 1
    const paths = resolve('./')
    const exists = await fs.exists(paths + BLOG_PREFIX);
    if (!exists) {
        await fs.mkdirp(paths + BLOG_PREFIX);
    }
    if (total > 0) {
        for (let i = 1; i < pagesNum + 1; i++) {
            const page = `
---
title: ${i === 1 ? '博客' : '博客第' + i + '页'}
---
<script setup>
${i == 1 ? 'import Page from "./.vitepress/theme/components/Page.vue";' : 'import Page from "./../.vitepress/theme/components/Page.vue";'}
import { useData } from "vitepress";
const { theme } = useData();
const posts = theme.value.posts.slice(${pageSize * (i - 1)},${pageSize * i})
</script>
<Page :posts="posts" :pageCurrent="${i}" :pagesNum="${pagesNum}" />
`.trim();
            const file = paths + BLOG_PREFIX + `/${i}.md`;
            await fs.writeFile(file, page, 'utf-8');
        }
    }
    // rename page1 to index for homepage
    await fs.move(paths + BLOG_PREFIX + '/1.md', paths + '/index.md', {overwrite: true})
}

export {getPosts, BLOG_PREFIX}

import {globby} from 'globby'
import matter from 'gray-matter'
import fs from 'fs-extra'
import {resolve} from 'path'

function resolveDirectory(item) {
    return item.substring(item.lastIndexOf('/') + 1);
}

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
            return {
                frontMatter: data,
                regularPath: `/${resolveDirectory(item).replace('.md', '')}`
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
    const exists = await fs.exists(paths + '/blogs');
    if (!exists) {
        await fs.mkdirp(paths + '/blogs');
    }
    if (total > 0) {
        for (let i = 1; i < pagesNum + 1; i++) {
            const page = `
---
page: true
title: ${i === 1 ? '博客' : '博客第' + i + '页'}
aside: false
editLink: false
lastUpdated: false
---
<script setup>
${i == 1 ? 'import Page from "./.vitepress/theme/components/Page.vue";' : 'import Page from "./../.vitepress/theme/components/Page.vue";'}
import { useData } from "vitepress";
const { theme } = useData();
const posts = theme.value.posts.slice(${pageSize * (i - 1)},${pageSize * i})
</script>
<Page :posts="posts" :pageCurrent="${i}" :pagesNum="${pagesNum}" />
`.trim();
            const file = paths + `/blogs/${i}.md`;
            await fs.writeFile(file, page, 'utf-8');
        }
    }
    // rename page1 to index for homepage
    await fs.move(paths + '/blogs/1.md', paths + '/index.md', {overwrite: true})
}

export {getPosts, resolveDirectory}

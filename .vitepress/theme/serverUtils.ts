import matter from 'gray-matter'
import fs from 'fs'
import {resolve} from 'path'

// 博客根目录、前缀
const BLOG_ROOT = 'posts/', BLOG_PREFIX = '/blogs';

function getPosts(pageSize) {
    const posts = [], rewrites = {}, mappings = {}
    // 遍历博客目录
    const walk = path => {
        fs.readdirSync(path, 'utf-8').forEach((it) => {
            let item = path + it
            if (fs.statSync(item).isDirectory()) {
                walk(item + '/')
            } else if (item.endsWith(".md")) {
                const content = fs.readFileSync(item, 'utf-8')
                const {data} = matter(content)
                data.date = it.substring(0, 10)

                rewrites[item] = it;

                posts.push({
                    frontMatter: data,
                    // md文件名
                    regularFile: it,
                    // 访问路径
                    regularPath: `/${it.replace('.md', '')}`
                })
            }
        })
    }

    walk(BLOG_ROOT)

    //生成分页页面markdown
    generatePaginationPages(posts.length, pageSize)

    posts.sort((a, b) => a.frontMatter.date < b.frontMatter.date ? 1 : -1)

    posts.forEach((it, idx) => mappings[it.regularFile] = idx)

    return {
        posts: posts,
        rewrites: rewrites,
        mappings: mappings
    }
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

export {getPosts}

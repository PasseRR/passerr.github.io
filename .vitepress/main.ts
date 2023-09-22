// @ts-ignore
import fg from 'fast-glob'

const site = {
    main: 'https://www.xiehai.zone',
    logo: null,
    pageSize: 10,
    // 标题
    title: 'PasseRR\'s Blog',
    // 描述
    description: 'PasseRR\'s Blog',
    // github仓库
    repository: 'passerr.github.io',
    // 主分支
    branch: 'master',
    // 基础路径
    base: '/',
    // google 分析
    google: 'G-1L1DPX3PFD',
    // 百度统计
    baidu: '6fcc00740d8cd30d91522810ec50075d',
    // 排除文件
    excludes: ["drafts/*.md"]
}

const rewrites = {}
// @ts-ignore
const pages = await fg('posts/**/*.md')

pages.map((page) => {
    const name = page.substring(page.lastIndexOf('/') + 1)
    const date = name.substring(0, 10) as { date: Date }
    if (date) {
        rewrites[page] = name
    }
});

export {site, rewrites};

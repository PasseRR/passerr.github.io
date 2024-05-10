// @ts-ignore
import fg from 'fast-glob'

const site = {
    main: 'https://www.xiehai.zone',
    logo: '/logo.jpg',
    // 博客分页大小
    pageSize: 17,
    // 博客分类分页大小
    tagPageSize: 10,
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
    excludes: ["drafts/*.md"],
    // vercel kv存储
    kvUrl: 'https://amusing-foxhound-32120.upstash.io',
    kvToken: 'AX14ASQgMGUzN2YwODktMDlmMS00N2ZhLWE2NjYtOTliYzc0NjlhZWJmNDA3OTA5YWJkOWY4NDVkYWI4YzgyNjNmMTk1YjM2MzY=',
    books: [
        {name: "设计模式", url: "/DesignPatterns", date: "2017-07-09"},
        {name: "Jdk8源码阅读", url: "/Java-Example", date: "2017-09-22"},
        {name: "Java版LeetCode", url: "/JavaLeetCode", date: "2018-05-01"},
        {name: "Jdk各版本特性", url: "/jdk-features", date: "2020-01-24"},
        {name: "Arthas手册", url: "/arthas", date: "2022-11-18"},
        {name: "Nginx手册", url: "/nginx", date: "2023-08-10"},
        {name: "实用开发工具", url: "/it-tools", date: "2024-04-02"},
    ],
    navs: [
        {text: '博客', link: '/', activeMatch: '/blogs/|^/$'},
        {text: '标签', link: '/tags'},
        {text: '开源', link: '/open-source'},
        {text: '电子书', link: '/ebook'},
        {text: '留言板', link: '/messages-board'},
        {text: '关于', link: '/about'}
    ]
}

const languages = [
    import('./language/plantuml.tmLanguage.json'),
    import('./language/ftl.tmLanguage.json'),
    import('./language/confluence-wiki.tmLanguage.json'),
    import('./language/log.tmLanguage.json'),
]

export {site, languages};

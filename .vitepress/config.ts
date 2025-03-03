import {languages, site} from './main'
import {getPosts} from './theme/serverUtils'
import {UserConfig, withMermaid} from 'vitepress-plugin-mermaid'
import {resolve} from 'path'
import {createWriteStream} from 'fs'
import {ErrorLevel, SitemapIndexStream} from 'sitemap'
import {tabsMarkdownPlugin} from 'vitepress-plugin-tabs'
import MiniSearch from 'minisearch'
import Segment from 'segment'

const segment = new Segment()
        // URL识别
        // @ts-ignore
        .use('URLTokenizer')
        // 通配符，必须在标点符号识别之前
        .use('WildcardTokenizer')
        // 词典识别
        .use('DictTokenizer')
        // 人名识别，建议在词典识别之后
        .use('ChsNameTokenizer')
        // 优化模块
        // 邮箱地址识别
        .use('EmailOptimizer')
        // 人名识别优化
        .use('ChsNameOptimizer')
        // 词典识别优化
        .use('DictOptimizer')
        // 日期时间识别优化
        .use('DatetimeOptimizer')
        // 字典文件
        // 盘古词典
        .loadDict('dict.txt')
        // 扩展词典（用于调整原盘古词典）
        .loadDict('dict2.txt')
        // 扩展词典（用于调整原盘古词典）
        .loadDict('dict3.txt')
        // 常见名词、人名
        .loadDict('names.txt')
        // 通配符
        .loadDict('wildcard.txt', 'WILDCARD', true)
        // 同义词
        .loadSynonymDict('synonym.txt')
        // 停止符
        .loadStopwordDict('stopword.txt')

// 所有博客列表、重写路径、博客映射
const {posts, rewrites, mappings} = getPosts(site.pageSize)

export default withMermaid({
    title: site.title,
    description: site.description,
    lastUpdated: true,
    base: site.base,
    srcExclude: ['**/README.md', ...site.excludes],
    rewrites: rewrites,
    vite: {
        publicDir: '.vitepress/public',
    },
    // sitemap_index文件生成
    async buildEnd(s) {
        const paths = resolve(s.outDir), sufix = '/sitemap.xml'
        const smis = new SitemapIndexStream({level: ErrorLevel.WARN})
        smis.write({url: site.main + sufix, lastmod: '2017-05-19'})
        site.books.forEach(it => smis.write({url: site.main + it.url + sufix, lastmod: it.date}))
        smis.pipe(createWriteStream(paths + '/sitemap_index.xml'))
        smis.end()
    },
    head: [
        // 不蒜子
        [
            'meta',
            {name: 'referrer', content: 'no-referrer-when-downgrade'}
        ],
        [
            'meta',
            {'http-equiv': 'Referrer-Policy', content: 'no-referrer-when-downgrade'}
        ],
        // google分析脚本
        [
            'script',
            {async: '', src: `https://www.googletagmanager.com/gtag/js?id=${site.google}`}
        ],
        // vercel分析脚本
        [
            'script',
            {defer: '', src: 'https://vercel.com/_vercel/insights/script.js'}
        ],
        // google、百度统计、vercel分析
        [
            'script',
            {},
            `var isProductEnv = window && window.location && window.location.host
                && window.location.host.indexOf('127.0.0.1') === -1
                && window.location.host.indexOf('localhost') === -1
                && window.location.host.indexOf('192.168.') === -1;

             if(isProductEnv) {
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${site.google}');
                
                var _hmt = _hmt || [];
                (function () {
                    var hm = document.createElement("script");
                    hm.src = "https://hm.baidu.com/hm.js?${site.baidu}";
                    var s = document.getElementsByTagName("script")[0];
                    s.parentNode.insertBefore(hm, s);
                })();
                _hmt.push(['_setAccount', '${site.baidu}']);
                _hmt.push(['_trackPageview', window.location]);
                _hmt.push(['_setAutoPageview', true]);
                
                window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
             }`
        ]
    ],
    sitemap: {
        hostname: site.main,
        lastmodDateOnly: false,
        transformItems(items) {
            return items.map(it => {
                it.lastmodrealtime = true
                it.url = `/${it.url}`

                return it;
            });
        }
    },
    transformPageData(page) {
        // 页面是否是博客
        const index = mappings[page.relativePath];
        // 非博客的页面 设置编辑链接、更新日期、边栏不显示
        if (index === undefined) {
            // 用于区分是页面还是博客
            page.frontmatter.page = true
            page.frontmatter.aside = false
            page.frontmatter.editLink = false
            page.frontmatter.lastUpdated = false
            return
        }

        // 博客创建日期front matter
        page.frontmatter.date = posts[index].frontMatter.date

        // 用于自动添加博客上一篇、下一篇
        // 非最后一篇博客 自动添加下一篇
        if (index < posts.length - 1) {
            page.frontmatter.next = {
                text: posts[index + 1].frontMatter.title,
                link: posts[index + 1].regularPath
            }
        }

        // 非第一篇博客 自动添加上一篇
        if (index > 0) {
            page.frontmatter.prev = {
                text: posts[index - 1].frontMatter.title,
                link: posts[index - 1].regularPath
            }
        }
    },
    themeConfig: {
        kvUrl: site.kvUrl,
        kvToken: site.kvToken,
        posts: posts,
        nav: site.navs,
        sidebar: [],
        search: {
            provider: 'local',
            options: {
                _render: (src, env, md) => {
                    const html = md.render(src, env)
                    if (env.frontmatter?.title) {
                        return md.render('# ' + env.frontmatter.title) + html;
                    }

                    return html;
                },
                miniSearch: {
                    options: {
                        tokenize: (text, fieldName) => {
                            let origin = MiniSearch.getDefault('tokenize')(text, fieldName);

                            // 仅对标题中文分词
                            if (fieldName.indexOf('title') >= 0) {
                                return origin.concat(segment.doSegment(text, {simple: true, stripPunctuation: true}));

                            }
                            return origin
                        }
                    },
                    searchOptions: {
                        // 仅以空白字符
                        tokenize: (string) => string.split(/\s+/)
                    }
                }
            }
        },
        lastUpdated: {
            text: '最后更新'
        },
        editLink: {
            pattern: `https://github.com/PasseRR/${site.repository}/edit/${site.branch || 'main'}/:path`,
            text: '在Github上编辑页面'
        },
        logo: site.logo,
        outline: {
            level: "deep",
            label: '文章摘要'
        },
        sidebarMenuLabel: '菜单',
        returnToTopLabel: '回到顶部',
        externalLinkIcon: true,
        docFooter: {
            prev: '上一篇',
            next: '下一篇'
        },
        socialLinks: [{
            icon: 'github',
            link: 'https://github.com/PasseRR',
            ariaLabel: 'Github'
        }, {
            icon: 'gitee',
            link: 'https://gitee.com/PasseRR',
            ariaLabel: 'Gitee'
        }, {
            icon: 'leetcode',
            link: "https://leetcode.cn/u/passerr/",
            ariaLabel: "LeetCode"
        }, {
            icon: 'intellijidea',
            link: 'https://plugins.jetbrains.com/vendor/b2fb5b09-c8ae-4b28-86d5-3c04c48c75a3',
            ariaLabel: 'Intellij'
        }, {
            icon: 'sinaweibo',
            link: 'https://weibo.com/u/1015039932',
            ariaLabel: 'Weibo'
        }, {
            icon: {
                svg: '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="6.38 5.49 11.18 11.16"><title>IT Tools</title><g id="surface1"><path d="M 11.308594 5.53125 C 11.21875 5.570312 11.089844 5.699219 11.089844 5.75 C 11.089844 5.769531 11.078125 5.785156 11.0625 5.785156 C 11.050781 5.785156 11.039062 5.804688 11.039062 5.832031 C 11.039062 5.859375 11.027344 5.878906 11.015625 5.878906 C 11 5.878906 10.992188 6.003906 10.992188 6.203125 L 10.992188 6.527344 L 10.902344 6.539062 C 10.851562 6.546875 10.792969 6.566406 10.769531 6.578125 C 10.746094 6.589844 10.703125 6.601562 10.667969 6.601562 C 10.636719 6.601562 10.609375 6.609375 10.609375 6.625 C 10.609375 6.636719 10.582031 6.648438 10.546875 6.648438 C 10.515625 6.648438 10.488281 6.660156 10.488281 6.671875 C 10.488281 6.683594 10.457031 6.695312 10.417969 6.695312 C 10.378906 6.695312 10.34375 6.707031 10.339844 6.71875 C 10.335938 6.730469 10.292969 6.746094 10.246094 6.757812 C 10.203125 6.765625 10.152344 6.78125 10.140625 6.792969 C 10.128906 6.804688 10.101562 6.816406 10.078125 6.816406 C 10.058594 6.816406 10.019531 6.835938 9.988281 6.863281 C 9.960938 6.890625 9.921875 6.910156 9.90625 6.910156 C 9.890625 6.910156 9.851562 6.925781 9.828125 6.945312 C 9.75 6.996094 9.503906 7.128906 9.480469 7.128906 C 9.46875 7.128906 9.378906 7.050781 9.28125 6.953125 C 9.183594 6.859375 9.0625 6.761719 9.007812 6.734375 C 8.957031 6.710938 8.898438 6.679688 8.875 6.667969 C 8.816406 6.640625 8.59375 6.640625 8.59375 6.671875 C 8.59375 6.683594 8.558594 6.695312 8.519531 6.695312 C 8.480469 6.695312 8.449219 6.707031 8.449219 6.71875 C 8.449219 6.734375 8.433594 6.742188 8.414062 6.742188 C 8.367188 6.742188 7.714844 7.398438 7.636719 7.523438 C 7.515625 7.714844 7.554688 8.042969 7.71875 8.207031 C 7.792969 8.277344 7.917969 8.417969 8.011719 8.527344 C 8.039062 8.5625 8.054688 8.59375 8.042969 8.59375 C 8.03125 8.59375 8.011719 8.621094 8.003906 8.660156 C 7.996094 8.699219 7.96875 8.75 7.949219 8.773438 C 7.925781 8.800781 7.890625 8.855469 7.871094 8.898438 C 7.851562 8.941406 7.828125 8.976562 7.820312 8.976562 C 7.8125 8.976562 7.796875 9.011719 7.785156 9.050781 C 7.777344 9.09375 7.75 9.164062 7.726562 9.210938 C 7.699219 9.253906 7.679688 9.304688 7.679688 9.324219 C 7.679688 9.34375 7.667969 9.359375 7.65625 9.359375 C 7.644531 9.359375 7.632812 9.386719 7.632812 9.417969 C 7.632812 9.449219 7.621094 9.484375 7.609375 9.492188 C 7.597656 9.496094 7.582031 9.550781 7.574219 9.609375 C 7.566406 9.671875 7.546875 9.726562 7.535156 9.734375 C 7.523438 9.742188 7.511719 9.777344 7.511719 9.816406 C 7.511719 9.855469 7.5 9.886719 7.488281 9.886719 C 7.476562 9.886719 7.464844 9.925781 7.464844 9.96875 C 7.464844 10.074219 7.445312 10.078125 7.117188 10.078125 C 6.851562 10.078125 6.695312 10.109375 6.695312 10.160156 C 6.695312 10.171875 6.6875 10.175781 6.679688 10.167969 C 6.660156 10.144531 6.480469 10.320312 6.480469 10.359375 C 6.480469 10.378906 6.46875 10.390625 6.457031 10.390625 C 6.441406 10.390625 6.433594 10.414062 6.433594 10.441406 C 6.433594 10.464844 6.421875 10.488281 6.40625 10.488281 C 6.394531 10.488281 6.382812 10.699219 6.382812 11.074219 C 6.382812 11.398438 6.394531 11.664062 6.402344 11.664062 C 6.414062 11.664062 6.4375 11.703125 6.457031 11.746094 C 6.472656 11.792969 6.496094 11.832031 6.507812 11.832031 C 6.515625 11.832031 6.53125 11.851562 6.539062 11.875 C 6.546875 11.902344 6.582031 11.933594 6.617188 11.953125 C 6.65625 11.972656 6.6875 11.992188 6.695312 12 C 6.742188 12.046875 6.914062 12.070312 7.171875 12.070312 L 7.464844 12.070312 L 7.464844 12.15625 C 7.464844 12.203125 7.476562 12.238281 7.488281 12.238281 C 7.5 12.238281 7.511719 12.277344 7.511719 12.324219 C 7.511719 12.371094 7.519531 12.40625 7.53125 12.40625 C 7.550781 12.40625 7.574219 12.496094 7.59375 12.628906 C 7.59375 12.636719 7.605469 12.652344 7.613281 12.660156 C 7.625 12.671875 7.632812 12.699219 7.632812 12.722656 C 7.632812 12.75 7.640625 12.769531 7.652344 12.769531 C 7.664062 12.769531 7.679688 12.796875 7.691406 12.828125 C 7.714844 12.933594 7.765625 12.898438 8.386719 12.273438 L 9 11.664062 L 8.980469 11.382812 C 8.96875 11.226562 8.960938 11.050781 8.964844 10.988281 C 8.980469 10.660156 9.007812 10.390625 9.027344 10.390625 C 9.039062 10.390625 9.046875 10.359375 9.046875 10.320312 C 9.046875 10.28125 9.058594 10.246094 9.070312 10.246094 C 9.082031 10.246094 9.097656 10.214844 9.101562 10.171875 C 9.121094 10.058594 9.230469 9.765625 9.25 9.785156 C 9.257812 9.792969 9.265625 9.777344 9.265625 9.746094 C 9.265625 9.71875 9.273438 9.695312 9.289062 9.695312 C 9.300781 9.695312 9.3125 9.679688 9.3125 9.660156 C 9.3125 9.613281 9.511719 9.304688 9.605469 9.203125 C 9.640625 9.164062 9.671875 9.125 9.671875 9.113281 C 9.671875 9.105469 9.734375 9.035156 9.8125 8.960938 C 10.015625 8.761719 10.070312 8.710938 10.097656 8.710938 C 10.109375 8.710938 10.132812 8.691406 10.152344 8.664062 C 10.171875 8.636719 10.195312 8.617188 10.207031 8.617188 C 10.21875 8.617188 10.242188 8.601562 10.261719 8.585938 C 10.332031 8.519531 10.359375 8.503906 10.433594 8.472656 C 10.476562 8.453125 10.511719 8.429688 10.511719 8.417969 C 10.511719 8.40625 10.523438 8.398438 10.535156 8.398438 C 10.546875 8.398438 10.636719 8.363281 10.738281 8.316406 C 10.839844 8.269531 10.9375 8.230469 10.957031 8.230469 C 10.976562 8.230469 10.992188 8.222656 10.992188 8.207031 C 10.992188 8.195312 11.011719 8.183594 11.035156 8.183594 C 11.0625 8.183594 11.125 8.167969 11.179688 8.148438 C 11.230469 8.132812 11.308594 8.113281 11.355469 8.109375 C 11.398438 8.105469 11.441406 8.089844 11.449219 8.082031 C 11.472656 8.050781 12.445312 8.050781 12.484375 8.078125 C 12.503906 8.089844 12.546875 8.105469 12.589844 8.109375 C 12.628906 8.113281 12.707031 8.132812 12.761719 8.148438 C 12.820312 8.167969 12.890625 8.183594 12.925781 8.183594 C 12.957031 8.183594 12.984375 8.195312 12.984375 8.207031 C 12.984375 8.222656 13.003906 8.230469 13.027344 8.230469 C 13.078125 8.230469 13.199219 8.285156 13.199219 8.308594 C 13.199219 8.316406 13.238281 8.332031 13.285156 8.339844 C 13.332031 8.351562 13.367188 8.363281 13.367188 8.375 C 13.367188 8.382812 13.40625 8.40625 13.453125 8.425781 C 13.5 8.441406 13.535156 8.464844 13.535156 8.472656 C 13.535156 8.480469 13.574219 8.507812 13.625 8.535156 C 13.675781 8.558594 13.738281 8.601562 13.769531 8.628906 C 13.867188 8.71875 13.894531 8.738281 13.894531 8.722656 C 13.894531 8.710938 13.957031 8.765625 14.027344 8.839844 C 14.101562 8.914062 14.160156 8.96875 14.160156 8.960938 C 14.160156 8.953125 14.207031 9.003906 14.261719 9.074219 C 14.316406 9.144531 14.375 9.21875 14.394531 9.234375 C 14.410156 9.253906 14.425781 9.277344 14.425781 9.285156 C 14.425781 9.296875 14.441406 9.324219 14.464844 9.351562 C 14.511719 9.402344 14.566406 9.496094 14.675781 9.707031 C 14.714844 9.785156 14.753906 9.855469 14.761719 9.863281 C 14.773438 9.871094 14.789062 9.917969 14.796875 9.964844 C 14.804688 10.015625 14.824219 10.0625 14.835938 10.070312 C 14.847656 10.078125 14.855469 10.109375 14.855469 10.140625 C 14.855469 10.171875 14.867188 10.199219 14.878906 10.199219 C 14.898438 10.199219 14.917969 10.28125 14.945312 10.480469 C 14.949219 10.539062 14.96875 10.585938 14.980469 10.585938 C 14.992188 10.585938 15 10.785156 15 11.074219 C 14.996094 11.359375 14.988281 11.566406 14.972656 11.566406 C 14.960938 11.566406 14.953125 11.609375 14.953125 11.664062 C 14.953125 11.714844 14.941406 11.765625 14.929688 11.773438 C 14.914062 11.78125 14.902344 11.8125 14.902344 11.84375 C 14.902344 11.875 14.894531 11.925781 14.882812 11.957031 C 14.871094 11.988281 14.851562 12.035156 14.84375 12.058594 C 14.832031 12.085938 14.820312 12.113281 14.820312 12.121094 C 14.816406 12.125 14.804688 12.167969 14.796875 12.210938 C 14.785156 12.253906 14.769531 12.289062 14.757812 12.289062 C 14.746094 12.289062 14.734375 12.308594 14.734375 12.335938 C 14.734375 12.363281 14.726562 12.382812 14.710938 12.382812 C 14.699219 12.382812 14.6875 12.398438 14.6875 12.421875 C 14.6875 12.441406 14.679688 12.457031 14.671875 12.457031 C 14.660156 12.457031 14.632812 12.503906 14.609375 12.5625 C 14.582031 12.625 14.554688 12.671875 14.542969 12.671875 C 14.53125 12.671875 14.519531 12.691406 14.519531 12.71875 C 14.519531 12.742188 14.503906 12.769531 14.484375 12.777344 C 14.464844 12.785156 14.4375 12.8125 14.429688 12.839844 C 14.398438 12.925781 13.941406 13.410156 13.910156 13.386719 C 13.90625 13.382812 13.878906 13.410156 13.847656 13.445312 C 13.820312 13.480469 13.75 13.535156 13.691406 13.5625 C 13.632812 13.59375 13.585938 13.625 13.585938 13.636719 C 13.585938 13.648438 13.570312 13.65625 13.550781 13.65625 C 13.53125 13.65625 13.511719 13.664062 13.507812 13.675781 C 13.496094 13.703125 13.257812 13.824219 13.214844 13.824219 C 13.195312 13.824219 13.175781 13.835938 13.175781 13.847656 C 13.175781 13.859375 13.160156 13.871094 13.140625 13.871094 C 13.121094 13.871094 13.082031 13.882812 13.054688 13.894531 C 13.03125 13.910156 12.988281 13.929688 12.960938 13.941406 C 12.9375 13.957031 12.859375 13.972656 12.792969 13.980469 C 12.726562 13.992188 12.664062 14.007812 12.65625 14.019531 C 12.652344 14.03125 12.601562 14.039062 12.550781 14.039062 C 12.5 14.039062 12.453125 14.050781 12.445312 14.0625 C 12.433594 14.078125 12.25 14.089844 11.972656 14.089844 C 11.6875 14.089844 11.519531 14.078125 11.519531 14.0625 C 11.519531 14.050781 11.496094 14.039062 11.464844 14.039062 C 11.410156 14.039062 10.273438 15.140625 10.273438 15.191406 C 10.273438 15.203125 10.25 15.21875 10.222656 15.226562 C 10.125 15.257812 10.164062 15.355469 10.285156 15.390625 C 10.34375 15.40625 10.390625 15.425781 10.390625 15.4375 C 10.390625 15.449219 10.417969 15.457031 10.449219 15.457031 C 10.484375 15.457031 10.515625 15.46875 10.523438 15.480469 C 10.53125 15.492188 10.566406 15.503906 10.597656 15.503906 C 10.628906 15.503906 10.65625 15.511719 10.65625 15.523438 C 10.65625 15.535156 10.671875 15.542969 10.691406 15.542969 C 10.710938 15.542969 10.773438 15.558594 10.828125 15.574219 C 10.886719 15.589844 10.945312 15.609375 10.960938 15.613281 C 10.984375 15.621094 10.992188 15.707031 10.992188 15.945312 C 10.992188 16.148438 11 16.273438 11.015625 16.273438 C 11.027344 16.273438 11.039062 16.292969 11.039062 16.320312 C 11.039062 16.347656 11.050781 16.367188 11.0625 16.367188 C 11.078125 16.367188 11.089844 16.382812 11.089844 16.402344 C 11.089844 16.421875 11.101562 16.441406 11.117188 16.441406 C 11.132812 16.441406 11.136719 16.445312 11.128906 16.453125 C 11.105469 16.476562 11.222656 16.582031 11.316406 16.621094 C 11.378906 16.648438 11.527344 16.65625 11.992188 16.65625 L 12.589844 16.65625 L 12.683594 16.589844 C 12.800781 16.511719 12.882812 16.421875 12.902344 16.351562 C 12.910156 16.320312 12.925781 16.296875 12.9375 16.296875 C 12.949219 16.296875 12.960938 16.144531 12.960938 15.960938 C 12.960938 15.609375 12.960938 15.601562 13.082031 15.601562 C 13.105469 15.601562 13.128906 15.589844 13.128906 15.574219 C 13.128906 15.5625 13.160156 15.550781 13.199219 15.550781 C 13.238281 15.550781 13.277344 15.542969 13.285156 15.527344 C 13.292969 15.515625 13.332031 15.503906 13.371094 15.503906 C 13.410156 15.503906 13.441406 15.492188 13.441406 15.480469 C 13.441406 15.46875 13.46875 15.457031 13.5 15.457031 C 13.53125 15.457031 13.558594 15.445312 13.558594 15.433594 C 13.558594 15.417969 13.640625 15.390625 13.746094 15.378906 C 13.761719 15.378906 13.777344 15.367188 13.777344 15.355469 C 13.777344 15.34375 13.804688 15.335938 13.835938 15.335938 C 13.867188 15.335938 13.894531 15.328125 13.894531 15.316406 C 13.894531 15.296875 14.011719 15.238281 14.058594 15.238281 C 14.074219 15.238281 14.089844 15.230469 14.089844 15.222656 C 14.089844 15.210938 14.136719 15.183594 14.195312 15.160156 C 14.253906 15.136719 14.304688 15.105469 14.304688 15.09375 C 14.304688 15.082031 14.320312 15.070312 14.339844 15.070312 C 14.355469 15.070312 14.375 15.0625 14.378906 15.050781 C 14.40625 14.976562 14.5 15.023438 14.699219 15.210938 C 14.816406 15.320312 14.929688 15.40625 14.957031 15.40625 C 14.980469 15.40625 15 15.417969 15 15.433594 C 15 15.445312 15.03125 15.457031 15.070312 15.457031 C 15.109375 15.457031 15.148438 15.46875 15.15625 15.480469 C 15.175781 15.507812 15.359375 15.503906 15.359375 15.476562 C 15.359375 15.464844 15.390625 15.457031 15.433594 15.457031 C 15.472656 15.457031 15.503906 15.445312 15.503906 15.433594 C 15.503906 15.417969 15.519531 15.40625 15.535156 15.40625 C 15.582031 15.40625 16.320312 14.675781 16.320312 14.628906 C 16.320312 14.609375 16.332031 14.59375 16.34375 14.59375 C 16.355469 14.59375 16.367188 14.566406 16.367188 14.535156 C 16.367188 14.5 16.375 14.46875 16.386719 14.464844 C 16.410156 14.449219 16.402344 14.246094 16.375 14.144531 C 16.351562 14.054688 16.269531 13.945312 16.054688 13.722656 C 15.964844 13.636719 15.902344 13.554688 15.914062 13.542969 C 15.941406 13.511719 16.03125 13.359375 16.046875 13.3125 C 16.054688 13.289062 16.070312 13.273438 16.082031 13.273438 C 16.09375 13.273438 16.105469 13.25 16.105469 13.222656 C 16.105469 13.199219 16.113281 13.175781 16.125 13.175781 C 16.136719 13.175781 16.164062 13.117188 16.1875 13.042969 C 16.214844 12.972656 16.242188 12.910156 16.253906 12.910156 C 16.261719 12.910156 16.273438 12.886719 16.273438 12.855469 C 16.273438 12.820312 16.28125 12.792969 16.289062 12.789062 C 16.316406 12.777344 16.441406 12.394531 16.441406 12.324219 C 16.441406 12.292969 16.449219 12.261719 16.464844 12.253906 C 16.476562 12.242188 16.488281 12.207031 16.488281 12.167969 C 16.488281 12.078125 16.511719 12.070312 16.863281 12.070312 C 17.042969 12.070312 17.160156 12.0625 17.160156 12.046875 C 17.160156 12.035156 17.179688 12.023438 17.207031 12.023438 C 17.234375 12.023438 17.257812 12.011719 17.257812 12 C 17.257812 11.988281 17.269531 11.976562 17.285156 11.976562 C 17.328125 11.976562 17.472656 11.847656 17.472656 11.8125 C 17.472656 11.796875 17.484375 11.785156 17.496094 11.785156 C 17.507812 11.785156 17.519531 11.761719 17.519531 11.734375 C 17.519531 11.707031 17.53125 11.691406 17.542969 11.699219 C 17.558594 11.710938 17.566406 11.496094 17.566406 11.078125 C 17.566406 10.667969 17.558594 10.441406 17.542969 10.441406 C 17.53125 10.441406 17.519531 10.425781 17.519531 10.40625 C 17.519531 10.367188 17.34375 10.175781 17.308594 10.175781 C 17.292969 10.175781 17.28125 10.164062 17.28125 10.152344 C 17.28125 10.140625 17.257812 10.128906 17.234375 10.128906 C 17.207031 10.128906 17.179688 10.117188 17.171875 10.105469 C 17.164062 10.089844 17.035156 10.078125 16.867188 10.078125 C 16.53125 10.078125 16.488281 10.0625 16.488281 9.945312 C 16.488281 9.898438 16.480469 9.867188 16.46875 9.875 C 16.457031 9.882812 16.441406 9.824219 16.433594 9.753906 C 16.425781 9.679688 16.40625 9.605469 16.394531 9.589844 C 16.378906 9.578125 16.367188 9.542969 16.367188 9.511719 C 16.367188 9.480469 16.355469 9.457031 16.34375 9.457031 C 16.332031 9.457031 16.320312 9.4375 16.320312 9.410156 C 16.320312 9.386719 16.296875 9.320312 16.265625 9.261719 C 16.234375 9.203125 16.195312 9.113281 16.175781 9.066406 C 16.160156 9.015625 16.132812 8.976562 16.125 8.976562 C 16.113281 8.976562 16.105469 8.953125 16.105469 8.929688 C 16.105469 8.902344 16.09375 8.878906 16.078125 8.878906 C 16.066406 8.878906 16.054688 8.863281 16.054688 8.84375 C 16.054688 8.824219 16.046875 8.808594 16.039062 8.808594 C 16.027344 8.808594 16 8.757812 15.972656 8.699219 C 15.945312 8.640625 15.917969 8.59375 15.910156 8.59375 C 15.898438 8.59375 15.949219 8.53125 16.023438 8.457031 C 16.09375 8.382812 16.152344 8.316406 16.152344 8.3125 C 16.152344 8.304688 16.238281 8.199219 16.289062 8.148438 C 16.304688 8.128906 16.320312 8.105469 16.320312 8.089844 C 16.320312 8.074219 16.332031 8.0625 16.34375 8.0625 C 16.355469 8.0625 16.367188 8.03125 16.367188 7.992188 C 16.367188 7.953125 16.378906 7.921875 16.390625 7.921875 C 16.417969 7.921875 16.414062 7.714844 16.386719 7.691406 C 16.375 7.679688 16.367188 7.648438 16.367188 7.617188 C 16.367188 7.585938 16.355469 7.558594 16.34375 7.558594 C 16.332031 7.558594 16.320312 7.542969 16.320312 7.527344 C 16.320312 7.476562 15.589844 6.742188 15.542969 6.742188 C 15.519531 6.742188 15.503906 6.734375 15.503906 6.71875 C 15.503906 6.707031 15.476562 6.695312 15.445312 6.695312 C 15.410156 6.695312 15.382812 6.683594 15.382812 6.671875 C 15.382812 6.636719 15.148438 6.644531 15.046875 6.679688 C 14.921875 6.722656 14.863281 6.765625 14.671875 6.957031 C 14.578125 7.050781 14.484375 7.128906 14.460938 7.128906 C 14.421875 7.128906 14.273438 7.035156 14.261719 7.003906 C 14.253906 6.992188 14.238281 6.984375 14.222656 6.984375 C 14.1875 6.984375 13.933594 6.855469 13.925781 6.835938 C 13.917969 6.824219 13.894531 6.816406 13.871094 6.816406 C 13.847656 6.816406 13.820312 6.804688 13.8125 6.792969 C 13.804688 6.777344 13.777344 6.769531 13.757812 6.769531 C 13.734375 6.769531 13.683594 6.75 13.648438 6.730469 C 13.609375 6.710938 13.558594 6.695312 13.535156 6.695312 C 13.507812 6.695312 13.488281 6.683594 13.488281 6.671875 C 13.488281 6.660156 13.457031 6.648438 13.414062 6.648438 C 13.375 6.648438 13.34375 6.640625 13.34375 6.628906 C 13.34375 6.617188 13.257812 6.589844 13.152344 6.566406 L 12.960938 6.523438 L 12.960938 6.179688 C 12.960938 5.964844 12.949219 5.832031 12.9375 5.832031 C 12.921875 5.832031 12.910156 5.820312 12.910156 5.800781 C 12.910156 5.765625 12.757812 5.59375 12.671875 5.535156 C 12.589844 5.480469 11.4375 5.476562 11.308594 5.53125 "/><path  d="M 15.886719 7.054688 C 15.917969 7.082031 15.949219 7.105469 15.957031 7.105469 C 15.960938 7.105469 15.949219 7.082031 15.925781 7.054688 C 15.898438 7.03125 15.871094 7.007812 15.855469 7.007812 C 15.84375 7.007812 15.859375 7.03125 15.886719 7.054688 M 11.808594 8.734375 C 11.808594 8.746094 11.730469 8.761719 11.632812 8.765625 C 11.433594 8.78125 11.257812 8.816406 11.125 8.878906 C 10.878906 8.988281 10.738281 9.058594 10.730469 9.078125 C 10.726562 9.085938 10.714844 9.097656 10.699219 9.097656 C 10.6875 9.097656 10.652344 9.121094 10.617188 9.15625 C 10.585938 9.1875 10.546875 9.214844 10.535156 9.214844 C 10.511719 9.214844 10.128906 9.585938 10.128906 9.609375 C 10.128906 9.621094 10.113281 9.640625 10.097656 9.660156 C 10.023438 9.742188 10.007812 9.769531 10.007812 9.804688 C 10.007812 9.824219 9.996094 9.839844 9.984375 9.839844 C 9.972656 9.839844 9.960938 9.855469 9.960938 9.875 C 9.960938 9.894531 9.949219 9.910156 9.9375 9.910156 C 9.921875 9.910156 9.910156 9.933594 9.910156 9.960938 C 9.910156 9.988281 9.902344 10.007812 9.890625 10.007812 C 9.875 10.007812 9.859375 10.046875 9.851562 10.09375 C 9.839844 10.136719 9.824219 10.175781 9.8125 10.175781 C 9.800781 10.175781 9.792969 10.203125 9.792969 10.234375 C 9.792969 10.269531 9.78125 10.296875 9.769531 10.296875 C 9.757812 10.296875 9.742188 10.324219 9.734375 10.363281 C 9.726562 10.398438 9.707031 10.476562 9.691406 10.535156 C 9.65625 10.683594 9.636719 11.472656 9.671875 11.503906 C 9.683594 11.519531 9.695312 11.570312 9.695312 11.621094 C 9.695312 11.671875 9.707031 11.710938 9.71875 11.710938 C 9.734375 11.710938 9.742188 11.75 9.742188 11.792969 C 9.742188 11.871094 9.640625 11.980469 8.273438 13.347656 C 6.488281 15.136719 6.433594 15.199219 6.433594 15.335938 C 6.433594 15.363281 6.421875 15.382812 6.40625 15.382812 C 6.394531 15.382812 6.382812 15.5 6.382812 15.683594 C 6.382812 15.867188 6.394531 15.984375 6.40625 15.984375 C 6.421875 15.984375 6.433594 16.011719 6.433594 16.042969 C 6.433594 16.078125 6.441406 16.105469 6.457031 16.105469 C 6.46875 16.105469 6.480469 16.125 6.480469 16.152344 C 6.480469 16.179688 6.492188 16.199219 6.503906 16.199219 C 6.515625 16.199219 6.527344 16.214844 6.527344 16.234375 C 6.527344 16.253906 6.570312 16.308594 6.617188 16.355469 C 6.667969 16.402344 6.730469 16.460938 6.757812 16.488281 C 6.785156 16.515625 6.820312 16.535156 6.835938 16.535156 C 6.851562 16.535156 6.863281 16.546875 6.863281 16.558594 C 6.863281 16.574219 6.882812 16.585938 6.910156 16.585938 C 6.933594 16.585938 6.960938 16.597656 6.964844 16.613281 C 6.972656 16.632812 7.074219 16.644531 7.304688 16.652344 C 7.714844 16.664062 7.835938 16.628906 7.984375 16.460938 C 7.996094 16.441406 8.042969 16.40625 8.078125 16.378906 C 8.117188 16.355469 8.832031 15.648438 9.671875 14.8125 C 10.765625 13.722656 11.203125 13.296875 11.230469 13.308594 C 11.25 13.316406 11.332031 13.332031 11.40625 13.335938 C 11.480469 13.34375 11.542969 13.359375 11.542969 13.371094 C 11.542969 13.382812 11.742188 13.390625 11.988281 13.390625 C 12.230469 13.390625 12.433594 13.382812 12.433594 13.371094 C 12.433594 13.359375 12.5 13.34375 12.582031 13.335938 C 12.664062 13.328125 12.734375 13.308594 12.738281 13.296875 C 12.746094 13.28125 12.765625 13.273438 12.789062 13.273438 C 12.839844 13.273438 12.960938 13.21875 12.960938 13.195312 C 12.960938 13.183594 12.980469 13.175781 13.007812 13.175781 C 13.035156 13.175781 13.054688 13.167969 13.054688 13.152344 C 13.054688 13.140625 13.085938 13.125 13.125 13.117188 C 13.164062 13.109375 13.214844 13.082031 13.242188 13.054688 C 13.269531 13.027344 13.304688 13.007812 13.320312 13.007812 C 13.332031 13.007812 13.34375 13 13.34375 12.988281 C 13.34375 12.980469 13.378906 12.949219 13.421875 12.925781 C 13.492188 12.882812 13.703125 12.679688 13.847656 12.511719 C 13.882812 12.472656 13.929688 12.398438 13.957031 12.347656 C 13.980469 12.296875 14.011719 12.25 14.023438 12.242188 C 14.03125 12.238281 14.039062 12.214844 14.039062 12.191406 C 14.039062 12.164062 14.046875 12.144531 14.058594 12.144531 C 14.082031 12.144531 14.160156 11.964844 14.160156 11.917969 C 14.160156 11.898438 14.171875 11.875 14.183594 11.867188 C 14.195312 11.859375 14.207031 11.828125 14.207031 11.796875 C 14.207031 11.765625 14.21875 11.730469 14.230469 11.722656 C 14.246094 11.714844 14.257812 11.671875 14.257812 11.628906 C 14.257812 11.585938 14.269531 11.542969 14.28125 11.539062 C 14.316406 11.527344 14.316406 10.636719 14.28125 10.601562 C 14.265625 10.585938 14.257812 10.550781 14.257812 10.519531 C 14.257812 10.488281 14.246094 10.464844 14.230469 10.464844 C 14.21875 10.464844 14.207031 10.453125 14.207031 10.4375 C 14.207031 10.40625 14.148438 10.34375 14.113281 10.34375 C 14.097656 10.34375 14.089844 10.332031 14.089844 10.320312 C 14.089844 10.285156 13.832031 10.289062 13.769531 10.324219 C 13.742188 10.34375 13.523438 10.550781 13.285156 10.785156 C 12.886719 11.183594 12.707031 11.328125 12.613281 11.328125 C 12.59375 11.328125 12.574219 11.339844 12.574219 11.351562 C 12.574219 11.382812 12.253906 11.382812 12.199219 11.355469 C 12.175781 11.34375 12.105469 11.308594 12.042969 11.28125 C 11.976562 11.25 11.898438 11.191406 11.863281 11.140625 C 11.824219 11.089844 11.789062 11.046875 11.78125 11.039062 C 11.691406 10.957031 11.648438 10.402344 11.730469 10.375 C 11.746094 10.367188 11.761719 10.347656 11.761719 10.328125 C 11.761719 10.3125 11.769531 10.296875 11.785156 10.296875 C 11.796875 10.296875 11.808594 10.285156 11.808594 10.269531 C 11.808594 10.234375 11.820312 10.222656 12.265625 9.773438 C 12.746094 9.289062 12.742188 9.289062 12.742188 9.121094 C 12.742188 8.878906 12.589844 8.761719 12.28125 8.761719 C 12.207031 8.761719 12.144531 8.75 12.144531 8.734375 C 12.144531 8.722656 12.070312 8.710938 11.976562 8.710938 C 11.882812 8.710938 11.808594 8.722656 11.808594 8.734375 "/><path d="M 11.933594 8.058594 C 11.96875 8.0625 12.03125 8.0625 12.066406 8.058594 C 12.101562 8.050781 12.074219 8.046875 12 8.046875 C 11.925781 8.046875 11.898438 8.050781 11.933594 8.058594 M 8.957031 11.136719 C 8.957031 11.183594 8.960938 11.199219 8.96875 11.179688 C 8.972656 11.15625 8.972656 11.117188 8.96875 11.09375 C 8.960938 11.070312 8.957031 11.089844 8.957031 11.136719 "/><path d="M 11.933594 8.058594 C 11.96875 8.0625 12.03125 8.0625 12.066406 8.058594 C 12.101562 8.050781 12.074219 8.046875 12 8.046875 C 11.925781 8.046875 11.898438 8.050781 11.933594 8.058594 M 8.957031 11.136719 C 8.957031 11.183594 8.960938 11.199219 8.96875 11.179688 C 8.972656 11.15625 8.972656 11.117188 8.96875 11.09375 C 8.960938 11.070312 8.957031 11.089844 8.957031 11.136719 "/><path d="M 11.933594 8.058594 C 11.96875 8.0625 12.03125 8.0625 12.066406 8.058594 C 12.101562 8.050781 12.074219 8.046875 12 8.046875 C 11.925781 8.046875 11.898438 8.050781 11.933594 8.058594 M 8.957031 11.136719 C 8.957031 11.183594 8.960938 11.199219 8.96875 11.179688 C 8.972656 11.15625 8.972656 11.117188 8.96875 11.09375 C 8.960938 11.070312 8.957031 11.089844 8.957031 11.136719 "/></g></svg>',
            },
            link: '/it-tools',
            ariaLabel: 'technological tools'
        }]
    },
    markdown: {
        languages: languages,
        lineNumbers: true,
        theme: {
            light: 'github-light',
            dark: 'github-dark'
        },
        config(md) {
            md.use(tabsMarkdownPlugin)
        },
        image: {
            lazyLoading: true
        }
    },
    mermaid: {},
    mermaidPlugin: {}
} as UserConfig);

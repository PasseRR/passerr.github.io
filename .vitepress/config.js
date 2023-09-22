import {defineConfig} from 'vitepress'
import {site} from './main';
import {getPosts} from './theme/serverUtils'
import {globby} from 'globby'
// @ts-ignore
import {withMermaid} from "vitepress-plugin-mermaid";

const rewrites = {}
// @ts-ignore
const pages = await globby(['posts/**/*.md'])

pages.map((page) => {
    rewrites[page] = page.substring(page.lastIndexOf('/') + 1)
});

export default withMermaid(
    defineConfig({
        title: site.title,
        description: site.description,
        lastUpdated: true,
        base: site.base,
        srcExclude: ['**/README.md', ...site.excludes],
        rewrites: rewrites,
        head: [
            // google分析脚本
            [
                'script',
                {async: '', src: `https://www.googletagmanager.com/gtag/js?id=${site.google}`}
            ],
            // google、百度统计分析
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
             }`
            ]
        ],
        sitemap: {
            hostname: site.main,
            lastmodDateOnly: false,
            // @ts-ignore
            transformItems(items) {
                // @ts-ignore
                return items.map(it => it.url = `${site.base}/${it.url}`);
            }
        },
        appearance: false,
        themeConfig: {
            posts: await getPosts(site.pageSize),
            nav: site.navs,
            sidebar: [],
            search: {
                provider: 'local'
            },
            lastUpdated: {
                text: '最后更新'
            },
            editLink: {
                pattern: `https://github.com/PasseRR/${site.repository}/edit/${site.branch || 'main'}/:path`,
                text: 'Edit this page on GitHub'
            },
            logo: site.logo,
            outline: {
                level: "deep",
                label: '文章摘要'
            },
            sidebarMenuLabel: '菜单',
            returnToTopLabel: '回到顶部',
            externalLinkIcon: true,
            socialLinks: [{
                icon: 'github',
                link: 'https://github.com/PasseRR',
                ariaLabel: 'Github'
            }, {
                icon: {
                    svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Gitee</title><path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296Z"/></svg>'
                },
                link: 'https://gitee.com/PasseRR',
                ariaLabel: 'Gitee'
            }, {
                icon: {
                    svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>LeetCode</title><path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/></svg>'
                },
                link: "https://leetcode.cn/u/passerr/",
                ariaLabel: "LeetCode"
            }, {
                icon: {
                    svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Sina Weibo</title><path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.439l-.002.004zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.18.601l.014-.028zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.57-.18-.405-.615.375-.977.42-1.804 0-2.404-.781-1.112-2.915-1.053-5.364-.03 0 0-.766.331-.571-.271.376-1.217.315-2.224-.27-2.809-1.338-1.337-4.869.045-7.888 3.08C1.309 10.87 0 13.273 0 15.348c0 3.981 5.099 6.395 10.086 6.395 6.536 0 10.888-3.801 10.888-6.82 0-1.822-1.547-2.854-2.915-3.284v.01zm1.908-5.092c-.766-.856-1.908-1.187-2.96-.962-.436.09-.706.511-.616.932.09.42.511.691.932.602.511-.105 1.067.044 1.442.465.376.421.466.977.316 1.473-.136.406.089.856.51.992.405.119.857-.105.992-.512.33-1.021.12-2.178-.646-3.035l.03.045zm2.418-2.195c-1.576-1.757-3.905-2.419-6.054-1.968-.496.104-.812.587-.706 1.081.104.496.586.813 1.082.707 1.532-.331 3.185.15 4.296 1.383 1.112 1.246 1.429 2.943.947 4.416-.165.48.106 1.007.586 1.157.479.165.991-.104 1.157-.586.675-2.088.241-4.478-1.338-6.235l.03.045z"/></svg>'
                },
                link: 'https://weibo.com/u/1015039932',
                ariaLabel: 'weibo'
            }]
        },
        markdown: {
            lineNumbers: true,
            theme: {
                light: 'github-light',
                dark: 'github-dark'
            }
        }
    })
);
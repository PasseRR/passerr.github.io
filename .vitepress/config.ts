import {defineConfig} from 'vitepress'
import {rewrites, site} from './main';
import sup_plugin from "markdown-it-sup";
import sub_plugin from "markdown-it-sub";

export default defineConfig({
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
        nav: [
            {text: 'Home', link: '/'},
            {text: 'Archives', link: '/pages/archives'},
            {text: 'Tags', link: '/pages/tags'},
            {text: 'About', link: '/pages/about'}
        ],
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
            label: '摘要'
        },
        sidebarMenuLabel: '菜单',
        returnToTopLabel: '回到顶部',
        externalLinkIcon: true,
        socialLinks: [{
            icon: {
                svg: `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="48px" height="48px" viewBox="0 0 48 48" enable-background="new 0 0 48 48" xml:space="preserve">  <image id="image0" width="48" height="48" x="0" y="0"
    xlink:href="data:image/png;base64,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
OjAwz6MktwAAAABJRU5ErkJggg==" />
</svg>`
            },
            link: site.main
        }, {
            icon: {
                svg: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M68.4876 75.8086C70.7358 73.5637 74.375 73.5696 76.616 75.8217C78.857 78.0738 78.8511 81.7194 76.6029 83.9642L66.6199 93.9326C57.4098 103.129 42.3911 103.263 33.0256 94.2424C32.9715 94.1905 28.8012 90.1015 15.044 76.6115C5.89166 67.6374 4.97987 53.2774 13.5925 44.0559L29.6506 26.8617C38.1985 17.7086 53.9552 16.7082 63.7285 24.6118L78.3131 36.4069C80.783 38.4043 81.1688 42.0294 79.1748 44.5036C77.1808 46.9778 73.5621 47.3642 71.0922 45.3667L56.5077 33.5717C51.3965 29.4383 42.4555 30.006 38.0451 34.7287L21.9867 51.9232C17.7939 56.4124 18.2531 63.6445 23.085 68.3823C33.1872 78.2883 40.9729 85.9224 40.9819 85.931C45.8509 90.6207 53.7239 90.5508 58.5045 85.777L68.4876 75.8086Z"
          fill="#B3B3B3"></path>
    <path fill-rule="evenodd" clip-rule="evenodd"
          d="M44.2359 65.8329C41.0616 65.8329 38.4883 63.2551 38.4883 60.0752C38.4883 56.8954 41.0616 54.3176 44.2359 54.3176H86.6247C89.799 54.3176 92.3723 56.8954 92.3723 60.0752C92.3723 63.2551 89.799 65.8329 86.6247 65.8329H44.2359Z"
          fill="#B3B3B3"></path>
    <path fill-rule="evenodd" clip-rule="evenodd"
          d="M52.1745 2.74414C54.3432 0.422038 57.9804 0.300713 60.2984 2.47315C62.6165 4.64558 62.7376 8.28912 60.5689 10.6112L21.9869 51.9233C17.7939 56.4122 18.2531 63.6443 23.0847 68.3823L40.9025 85.8543C43.1709 88.0787 43.2097 91.724 40.9892 93.9964C38.7687 96.2688 35.1297 96.3077 32.8613 94.0833L15.0435 76.6112C5.89165 67.6366 4.97986 53.2768 13.5929 44.0559L52.1745 2.74414Z"
          fill="#B3B3B3"></path>
</svg>`
            },
            link: "https://leetcode.cn/u/passerr/",
            ariaLabel: "LeetCode"
        }]
    },
    markdown: {
        lineNumbers: true,
        theme: {
            light: 'github-light',
            dark: 'github-dark'
        },
        config: md => {
            md.use(sup_plugin);
            md.use(sub_plugin);
        }
    }
});
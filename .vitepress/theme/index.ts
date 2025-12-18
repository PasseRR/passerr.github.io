import DefaultTheme from 'vitepress/theme'
// @ts-ignore
import Tags from './components/Tags.vue'
// @ts-ignore
import Archives from './components/Archives.vue'
// @ts-ignore
import Ranks from './components/Ranks.vue'
// @ts-ignore
import Page from './components/Page.vue'
// @ts-ignore
import Ebook from './components/Ebook.vue'
// @ts-ignore
import NewGiscus from './components/NewGiscus.vue'
// @ts-ignore
import NewLayout from "./components/NewLayout.vue"
// @ts-ignore
import ShieldsBadge from "./components/ShieldsBadge.vue"
// @ts-ignore
import LinkCard from "./components/LinkCard.vue"
import {enhanceAppWithTabs} from 'vitepress-plugin-tabs/client'
import {useData, useRouter, useRoute} from 'vitepress'
import {onMounted, watch} from 'vue'
import mediumZoom from 'medium-zoom'
import codeblocksFold from 'vitepress-plugin-codeblocks-fold'
import 'vitepress-plugin-codeblocks-fold/style/index.css'
// @ts-ignore
import mermaid from "mermaid"
import 'font-awesome/css/font-awesome.min.css'
import 'virtual:group-icons.css'
import './custom.css'

export default {
    extends: DefaultTheme,
    Layout: NewLayout,
    enhanceApp({app}) {
        // tabs增强
        enhanceAppWithTabs(app)
        // register global compoment
        app.component('NewGiscus', NewGiscus)
        app.component('Tags', Tags)
        app.component('Page', Page)
        app.component('Ebook', Ebook)
        app.component('ShieldsBadge', ShieldsBadge)
        app.component('LinkCard', LinkCard)
        app.component('Archives', Archives)
        app.component('Ranks', Ranks)
    },
    setup() {
        const router = useRouter(), {isDark, frontmatter} = useData(), route = useRoute()
        codeblocksFold({route, frontmatter}, true, 550)
        // zoom 初始化
        const initZoom = () => {
            // 带有data-zoomable class的图片可以放大
            mediumZoom('[data-zoomable]', {background: 'var(--vp-c-bg)'});
            // 主内容区域的任何图片(除带有data-unzoomable class)可以放大
            mediumZoom('.main img:not(.data-unzoomable)', {background: 'var(--vp-c-bg)'});
        };

        const applyMermaidTheme = () => {
            mermaid.initialize({
                theme: isDark.value ? 'dark' : 'default'
            })
        }

        onMounted(initZoom);

        router.onAfterRouteChange = initZoom;

        onMounted(() => {
            applyMermaidTheme()
        })

        watch(() => isDark.value, () => applyMermaidTheme())
    }
}

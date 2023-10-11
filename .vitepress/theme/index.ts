import DefaultTheme from 'vitepress/theme'
import Tags from './components/Tags.vue'
import Page from './components/Page.vue'
import Ebook from './components/Ebook.vue'
import NewGiscus from './components/NewGiscus.vue'
import NewLayout from "./components/NewLayout.vue"
import {enhanceAppWithTabs} from 'vitepress-plugin-tabs/client'
import {useRoute} from 'vitepress'
import {nextTick, onMounted, watch} from 'vue'
import mediumZoom from 'medium-zoom'
import 'font-awesome/css/font-awesome.min.css'
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
    },
    setup() {
        const route = useRoute()
        const initZoom = () => {
            mediumZoom('[data-zoomable]', {background: 'var(--vp-c-bg)'});
            mediumZoom('.main img', {background: 'var(--vp-c-bg)'});
        };
        onMounted(() => initZoom());
        watch(() => route.path, () => nextTick(() => initZoom()));
    }
}

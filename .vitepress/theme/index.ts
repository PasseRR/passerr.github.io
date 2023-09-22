import DefaultTheme from 'vitepress/theme'
import Tags from './components/Tags.vue'
import Page from './components/Page.vue'
import Ebook from './components/Ebook.vue'
import NewLayout from "./components/NewLayout.vue";

import './custom.css'

export default {
    extends: DefaultTheme,
    Layout: NewLayout,
    enhanceApp({app}) {
        // register global compoment
        app.component('Tags', Tags)
        app.component('Page', Page)
        app.component('Ebook', Ebook)
    }
}

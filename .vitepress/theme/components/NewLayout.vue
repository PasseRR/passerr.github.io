<template>
  <Layout>
    <template v-if="frontmatter.page !== true" #doc-before>
      <div class="vp-doc">
        <h1 :id="frontmatter.title">
          {{ frontmatter.title }}
          <a class="header-anchor" :href="'#'+frontmatter.title">​</a>
        </h1>
        <div class='post-info'>
          <a v-if="frontmatter.tags" v-for="item in frontmatter.tags" :href="withBase(`/tags.html?tag=${item}`)"
             target="_blank">
            <Badge type="tip"><span class="fa fa-tag"></span> {{ item }}</Badge>
          </a>
          <Badge type="warning"><span class="fa fa-eye"></span> {{ views }}</Badge>
          <Badge type="info"><span class="fa fa-clock-o"></span> {{ frontmatter.date }}</Badge>
        </div>
      </div>
      <br/>
    </template>
    <template v-if="frontmatter.page !== true" #doc-after>
      <NewGiscus/>
    </template>
  </Layout>
</template>
<script setup>
import DefaultTheme from 'vitepress/theme'
import NewGiscus from "./NewGiscus.vue"
import {useData, useRoute, withBase} from "vitepress"
import {nextTick, onMounted, provide, ref, watch} from 'vue'

const {Layout} = DefaultTheme
const {frontmatter, page, isDark, theme, params} = useData(), route = useRoute()
const views = ref(1);

const init = () => {
  // 开发环境忽略访问计数
  if (import.meta.env.DEV) {
    return
  }

  let path = location.pathname
  if (!path.endsWith(".html")) {
    path = path + ".html"
  }

  // 请求计数
  fetch(theme.value.kvUrl, {
    headers: {
      Authorization: `Bearer ${theme.value.kvToken}`,
    },
    method: 'POST',
    body: `["ZINCRBY", "hits", "1", "${path + location.search}"]`,
  }).then(res => res.json()).then(res => views.value = res.result);
};

onMounted(() => init());

watch(() => route.path, () => nextTick(() => init()));

const enableTransitions = () =>
    'startViewTransition' in document &&
    window.matchMedia('(prefers-reduced-motion: no-preference)').matches

provide('toggle-appearance', async ({clientX: x, clientY: y}) => {
  if (!enableTransitions()) {
    isDark.value = !isDark.value
    return
  }

  const clipPath = [
    `circle(0px at ${x}px ${y}px)`,
    `circle(${Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y)
    )}px at ${x}px ${y}px)`
  ]

  await document.startViewTransition(async () => {
    isDark.value = !isDark.value
    await nextTick()
  }).ready

  document.documentElement.animate(
      {clipPath: isDark.value ? clipPath.reverse() : clipPath},
      {
        duration: 400,
        easing: 'ease-in',
        pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`
      }
  )
})
</script>

<style>

.post-info {
  margin-top: 1em;
  float: right;
  font-size: .8em;
}

::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-old(root),
.dark::view-transition-new(root) {
  z-index: 1;
}

::view-transition-new(root),
.dark::view-transition-old(root) {
  z-index: 9999;
}

.VPSwitchAppearance {
  width: 22px !important;
}

.VPSwitchAppearance .check {
  transform: none !important;
}

.medium-zoom-overlay {
  backdrop-filter: blur(5rem);
}

.medium-zoom-overlay,
.medium-zoom-image--opened {
  z-index: 999;
}
</style>

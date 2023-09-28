<template>
  <Layout>
    <template v-if="frontmatter.page !== true" #doc-before>
      <div class="vp-doc">
        <h1 :id="frontmatter.title">
          {{ frontmatter.title }}
          <a class="header-anchor" :href="'#'+frontmatter.title">​</a>
        </h1>
        <div class='post-info date'>
          <span v-if="frontmatter.tags" v-for="item in frontmatter.tags">
            <a :href="withBase(`/tags.html?tag=${item}`)" target="_blank"> {{ item }}</a>
          </span>
          {{ frontmatter.date }}
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
import {useData, withBase} from "vitepress"
import {nextTick, provide} from 'vue'

const {Layout} = DefaultTheme
const {frontmatter, page, isDark} = useData()

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
        duration: 300,
        easing: 'ease-in',
        pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`
      }
  )
})
</script>

<style>
.post-info {
  float: right;
  font-size: 12px;
}

.post-info span {
  display: inline-block;
  padding: 0 8px;
  background-color: var(--vp-c-bg-alt);
  margin-right: 10px;
  transition: 0.4s;
  border-radius: 2px;
  color: var(--vp-c-text-1);
}

.post-info a {
  color: var(--vp-c-text-1);
  text-decoration: none;
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
</style>

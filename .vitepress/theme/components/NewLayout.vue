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
          {{ parseDate(page.filePath) }}
        </div>
      </div>
    </template>
    <template v-if="frontmatter.page !== true" #doc-after>
      comment
    </template>
  </Layout>
</template>
<script setup>
import DefaultTheme from 'vitepress/theme'
import {useData, withBase} from "vitepress";

const {Layout} = DefaultTheme
const {frontmatter, page} = useData()
const parseDate = str => {
  const name = str.substring(str.lastIndexOf('/') + 1)
  return name.substring(0, 10)
}
</script>

<style scoped>
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
</style>

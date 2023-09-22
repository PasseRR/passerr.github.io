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
      <br/>
    </template>
    <template v-if="frontmatter.page !== true" #doc-after>
      <Giscus
          repo="PasseRR/passerr.github.io"
          repo-id="MDEwOlJlcG9zaXRvcnk5MTc3MTIzOQ=="
          category="Announcements"
          category-id="DIC_kwDOBXhRZ84CZgw9"
          :term="page.relativePath"
          strict="0"
          reactions-enabled="1"
          emit-metadata="0"
          input-position="bottom"
          theme="light"
          lang="zh-CN"
          crossorigin="anonymous"
          loading="lazy"
      />
    </template>
  </Layout>
</template>
<script setup>
import DefaultTheme from 'vitepress/theme';
import Giscus from '@giscus/vue';
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

.post-info a {
  color: var(--vp-c-text-1);
  text-decoration: none;
}
</style>

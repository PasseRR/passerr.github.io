<template>
  <ol>
    <li v-for="(article, index) in posts" :key="index" class="post-list">
      <div class="post-title">
        <a :href="withBase(article.regularPath)">{{ article.frontMatter.title }}</a>
        »<span class="date">{{ article.frontMatter.date }}</span>
      </div>
    </li>
  </ol>

  <div class="pagination">
    <a
        class="link"
        :class="{ active: pageCurrent === i }"
        v-for="i in pagesNum"
        :key="i"
        :href="withBase(i === 1 ? '/index.html' : `/blogs/${i}.html`)"
    >{{ i }}</a>
  </div>
</template>

<script lang="ts" setup>
import {withBase} from 'vitepress'

const props = defineProps({
  posts: Array,
  pageCurrent: Number,
  pagesNum: Number
})
</script>

<style scoped>
.post-list {
  border-bottom: 1px dashed var(--vp-c-divider-light);
  padding: 3px 0 3px 0;
}

.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.post-title {
  font-family: "Roboto Condensed", Arial, sans-serif;
  font-size: 16px;
  margin: 0.1rem 0;
}

.post-title a {
  color: var(--vp-c-text-1);
  font-weight: 500;
  text-decoration: none;
}

.post-title a:hover, a:active {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}

.post-title a, a:link, a:active {
  text-decoration: none;
}

.post-info {
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

.describe {
  font-size: 0.9375rem;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  color: var(--vp-c-text-2);
  margin: 10px 0;
  line-height: 1.5rem;
}

.pagination {
  margin-top: 16px;
  display: flex;
  /*justify-content: center;*/
}

.link {
  color: var(--vp-c-text-1);
  display: inline-block;
  width: 24px;
  text-align: center;
  border: 1px #ddd solid !important;;
  font-weight: 400;
}

.link.active {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-neutral-inverse);
  border: 1px solid var(--vp-c-brand-1) !important;
}

.link:first-child {
  border-bottom-left-radius: 2px;
  border-top-left-radius: 2px;
}

.link:last-child {
  border-bottom-right-radius: 2px;
  border-top-right-radius: 2px;
  border-right: 1px var(--vp-c-divider-light) solid;
}

@media screen and (max-width: 768px) {
  .post-list {
    padding: 4px 0 4px 0;
  }

  .post-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .post-title {
    font-size: 1.0625rem;
    font-weight: 400;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    width: 17rem;
  }

  .describe {
    font-size: 0.9375rem;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    margin: 0.5rem 0 1rem;
  }
}
</style>

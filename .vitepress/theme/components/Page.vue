<template>
  <ol>
    <li v-for="(article, index) in posts" :key="index" class="post-list">
      <div class="post-title">
        <a :href="withBase(article.regularPath)">{{ article.frontMatter.title }}</a>
        »<span class="date">{{ article.frontMatter.date }}</span>
      </div>
    </li>
  </ol>

  <div class="pager">
    <PaginationRoot :total="total" :items-per-page="perPage" :sibling-count="1" show-edges :default-page="pageCurrent"
                    @update:page="pageUpdate">
      <PaginationList v-slot="{ items }" class="PaginationList">
        <PaginationFirst class="Button">
          <Icon icon="radix-icons:double-arrow-left" width="100%" height="1em"/>
        </PaginationFirst>
        <PaginationPrev :style="{ marginRight: 16 }" class="Button">
          <Icon icon="radix-icons:chevron-left" width="100%" height="1em"/>
        </PaginationPrev>
        <template v-for="(page, index) in items">
          <PaginationListItem v-if="page.type === 'page'" :key="index" class="Button" :value="page.value">
            {{ page.value }}
          </PaginationListItem>
          <PaginationEllipsis v-else :key="page.type" :index="index" class="PaginationEllipsis">
            &#8230;
          </PaginationEllipsis>
        </template>
        <PaginationNext :style="{ marginLeft: 16 }" class="Button">
          <Icon icon="radix-icons:chevron-right" width="100%" height="1em"/>
        </PaginationNext>
        <PaginationLast class="Button">
          <Icon icon="radix-icons:double-arrow-right" width="100%" height="1em"/>
        </PaginationLast>
      </PaginationList>
    </PaginationRoot>
  </div>
</template>

<script lang="ts" setup>

import {useRouter, withBase} from "vitepress";
import {Icon} from '@iconify/vue'
import {
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
  PaginationRoot
} from 'radix-vue'

const router = useRouter()
const props = defineProps({
  posts: Array,
  pageCurrent: Number,
  perPage: Number,
  total: Number,
})

const pageUpdate = (num) => {
  const path = router.route.path, routePath = num == 1 ? '/' : `/blogs/${num}.html`
  if (path !== routePath) {
    router.go(routePath)
  }
}
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

.post-info span {
  display: inline-block;
  padding: 0 8px;
  background-color: var(--vp-c-bg-alt);
  margin-right: 10px;
  transition: 0.4s;
  border-radius: 2px;
  color: var(--vp-c-text-1);
}

@media screen and (max-width: 768px) {
  .post-list {
    padding: 4px 0 4px 0;
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
}
</style>

<template>
  <ol class="rank-list">
    <li v-for="(article, index) in posts" :key="index" class="post-list">
      <div class="post-title">
        <a :href="withBase(article.regularPath) + '.html'" class="hover-underline-animation no-icon" target="_blank">
          <span class="rank-label">{{ index + 1 }}</span>
          {{ article.frontMatter.title }}
          <Badge type="info"><span class="fa fa-clock-o">&nbsp;{{ article.frontMatter.date }}</span></Badge>
        </a>
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

defineProps({
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

.vp-doc li + li {
  margin-top: 7px;
}

.rank-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rank-list li {
  display: flex;
  align-items: center;
  gap: 0.75em;
  margin-bottom: 0.5em;
  font-size: 16px;
}

.rank-label {
  min-width: 3.5em;
  text-align: right;
  font-weight: bold;
  flex-shrink: 0;
}

.rank-label::after {
  content: ".";
}
</style>

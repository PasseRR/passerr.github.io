<template>
  <div class="tags">
        <span @click="toggleTag(key)" v-for="(item, key) in data" class="tag">
            {{ key }} <strong>{{ data[key].length }}</strong>
        </span>
  </div>
  <div class="tag-header">{{ selectTag }}</div>
  <a :href="withBase(article.regularPath)" v-for="(article, index) in data[selectTag]" :key="index" class="posts">
    <div class="post-container">
      <div class="post-dot"></div>
      {{ article.frontMatter.title }}
    </div>
    <div class="date">{{ article.frontMatter.date }}</div>
  </a>
</template>
<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue'
import {useData, useRoute, withBase} from 'vitepress'
import {initTags} from '../functions'

const {theme} = useData()
const route = useRoute()
const data = computed(() => initTags(theme.value.posts))

let selectTag = ref('')
const toggleTag = (tag: string) => {
  selectTag.value = tag
}

onMounted(() => {
  let url = location.href.split('?')[1]
  let params = new URLSearchParams(url)
  let tag = params.get('tag');

  tag && toggleTag(tag)
});

</script>

<style scoped>
.tags {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  padding: 4px 16px;
  margin: 6px 8px;
  font-size: 0.875rem;
  line-height: 25px;
  background-color: var(--vp-c-bg-alt);
  transition: 0.4s;
  border-radius: 2px;
  color: var(--vp-c-text-1);
  cursor: pointer;
}

.tag strong {
  color: var(--vp-c-brand-1);
}

.tag-header {
  font-size: 1.5rem;
  font-weight: 500;
  margin: 1rem 0;
  text-align: left;
}

@media screen and (max-width: 768px) {
  .tag-header {
    font-size: 1.5rem;
  }

  .date {
    font-size: 0.75rem;
  }
}

.posts {
  font-weight: 500;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.posts:hover, .posts:active {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}
</style>

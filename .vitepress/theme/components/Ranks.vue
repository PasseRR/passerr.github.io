<template>
  <ol>
    <li v-for="(article, index) in posts" :key="index" class="post-list">
      <div class="post-title">
        <a :href="withBase(article.regularPath) + '.html'" class="hover-underline-animation no-icon" target="_blank">
          <span v-if="index === 0" class="rank-icon gold">🥇</span>
          <span v-else-if="index === 1" class="rank-icon silver">🥈</span>
          <span v-else-if="index === 2" class="rank-icon bronze">🥉</span>
          {{ article.frontMatter.title }}
          <Badge type="info"><span class="fa fa-eye">&nbsp;{{ article.views }}</span></Badge>
        </a>
      </div>
    </li>
  </ol>
</template>
<script setup>
import {useData, withBase} from "vitepress"
import {onMounted, ref} from 'vue'

const {theme} = useData()
const posts = ref([]);
const init = () => {
  // 请求计数
  fetch(theme.value.kvUrl, {
    headers: {
      Authorization: `Bearer ${theme.value.kvToken}`,
    },
    method: 'POST',
    body: `["ZREVRANGE", "hits", "0", "30", "WITHSCORES"]`,
  }).then(res => res.json()).then(res => doRank(res.result));
};

onMounted(() => init());

// 查询并处理排名
const doRank = (result) => {
  let len = result.length / 2
  let count = 0
  for (let i = 0; i < len; i++) {
    // 处理映射问题
    let url = result[i * 2].split('?')[0]
    // 找到原始文章名称
    let index = theme.value.mappings[url.replace(/\.html$/, '.md').replace(/^\//, '')]
    // 找到对应文章
    let post = theme.value.posts[index];
    // 如果找到文章 可能是页面路径 不会有对应的文章
    if (post) {
      posts.value.push({...post, views: result[i * 2 + 1]})
      count++
    }

    // 只要前20名
    if (count >= 20) {
      break
    }
  }
};
</script>

<template>
  <ol class="rank-list">
    <li v-for="(article, index) in posts" :key="index" class="post-list">
      <div class="post-title">
        <a :href="withBase(article.regularPath) + '.html'" class="hover-underline-animation no-icon" target="_blank">
          <span :class="{ 'rank-label': index >= 5 }">
            <template v-if="index === 0">🥇</template>
            <template v-else-if="index === 1">🥈</template>
            <template v-else-if="index === 2">🥉</template>
            <template v-else-if="index === 3 || index === 4">🔥</template>
            <template v-else>{{ index + 1 }}</template>
          </span>
          <span class="rank-title">{{ article.frontMatter.title }}</span>
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
<style scoped>
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

.rank-title {
  padding-left: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

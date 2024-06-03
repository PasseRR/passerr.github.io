<template>
  <highcharts :options="chartOptions" :key="themeToggle(isDark, Highcharts)"/>
  <div class="tag-header">{{ selectTag }}</div>
  <ul>
    <div class="post-title">
      <li v-for="(article, index) in articles">
        <a :href="withBase(article.regularPath)+'.html'" :key="index"
           class="hover-underline-animation no-icon" target="_blank">
          {{ article.frontMatter.title }}
          <span class="date"><span class="fa fa-clock-o"></span>{{ article.frontMatter.date }}</span>
        </a>
      </li>
    </div>
  </ul>

  <div class="pager" v-if="total > pageSize" :key="selectTag">
    <PaginationRoot :total="total" :items-per-page="pageSize" :sibling-count="1" :show-edges="false"
                    :default-page="pageNumber" @update:page="pageUpdate">
      <PaginationList v-slot="{ items }" class="PaginationList">
        <template v-for="(page, index) in items">
          <PaginationListItem v-if="page.type === 'page'" :key="index" class="Button" :value="page.value">
            {{ page.value }}
          </PaginationListItem>
          <PaginationEllipsis v-else :key="page.type" :index="index" class="PaginationEllipsis">
            &#8230;
          </PaginationEllipsis>
        </template>
      </PaginationList>
    </PaginationRoot>
  </div>
</template>
<script lang="ts" setup>
import {computed, onMounted, ref} from "vue"
import {defineClientComponent, useData, withBase} from 'vitepress'
import Highcharts from 'highcharts'
import wordcloud from 'highcharts/modules/wordcloud'
import {PaginationEllipsis, PaginationList, PaginationListItem, PaginationRoot} from 'radix-vue'

const dark = {
  colors: [
    '#2b908f', '#90ee7e', '#f45b5b', '#7798BF', '#aaeeee', '#ff0066',
    '#eeaaee', '#55BF3B', '#DF5353', '#7798BF', '#aaeeee'
  ],
  chart: {
    backgroundColor: 'var(--vp-c-bg)'
  },
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    style: {
      color: 'var(--vp-c-text-1)'
    }
  }
}, light = {
  colors: [
    '#67B9EE', '#CEEDA5', '#9F6AE1', '#FEA26E', '#6BA48F', '#EA3535',
    '#8D96B7', '#ECCA15', '#20AA09', '#E0C3E4'
  ],
  chart: {
    backgroundColor: 'var(--vp-c-bg)'
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    style: {
      color: 'var(--vp-c-text-1)'
    }
  }
};

const {theme, isDark} = useData()
const data = computed(() => {
  const data: any = {}
  for (let index = 0; index < theme.value.posts.length; index++) {
    const element = theme.value.posts[index]
    const tags = element.frontMatter.tags
    if (tags) {
      tags.forEach((item) => {
        if (data[item]) {
          data[item].push(element)
        } else {
          data[item] = []
          data[item].push(element)
        }
      })
    }
  }
  return data
})
const keys = Object.keys(data.value);

const selectTag = ref(''), pageNumber = ref(1), total = ref(0), articles = ref(), pageSize = 9

// 标签切换
const toggleTag = (tag: string, page: Number) => {
      selectTag.value = tag
      pageNumber.value = page
      total.value = data.value[selectTag.value].length
      articles.value = data.value[selectTag.value].slice((page - 1) * pageSize, page * pageSize)
    },
    // 客户端组件引用
    highcharts = defineClientComponent(() => {
      // 词云引入
      wordcloud(Highcharts)
      return import('highcharts-vue').then(it => it.Chart)
    }),
    // 主题切换
    themeToggle = (isDark, charts) => {
      if (typeof charts === 'object') {
        charts.setOptions(isDark ? dark : light)
      }

      return isDark ? 'dark' : 'light';
    }

// 页面更新
const pageUpdate = (num) => toggleTag(selectTag.value, num)

const chartOptions = computed(() => {
  return {
    series: [{
      type: 'wordcloud',
      rotation: {
        from: 0,
        to: 60,
        orientations: 25
      },
      data: keys.map(it => {
        let len = data.value[it].length
        return {
          name: it,
          weight: len + 5,
          total: len
        }
      }),
      events: {
        click: (e) => {
          // 修改浏览器地址
          history.pushState({}, null, `/tags.html?tag=${e.point.options.name}`)
          toggleTag(e.point.options.name, 1)
        }
      },
      tooltip: {
        headerFormat: '',
        pointFormat: '<span style="color:{point.color}">●</span> {point.name}: <b>{point.total}</b><br/>'
      }
    }],
    // 隐藏highcharts.com链接
    credits: {
      enabled: false
    },
    title: {
      text: ''
    },
    accessibility: {
      enabled: false,
    }
  }
})

onMounted(() => {
  let url = location.href.split('?')[1]
  let params = new URLSearchParams(url)
  let tag = params.get('tag'), page = params.get('page')

  tag && toggleTag(tag, parseInt(page) || 1)
})

</script>

<style scoped>
@media screen and (max-width: 768px) {
  .date {
    display: none;
  }
}
</style>

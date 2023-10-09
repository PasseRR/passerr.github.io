<template>
  <ClientOnly>
    <highcharts :options="chartOptions" :key="themeToggle(isDark, Highcharts)"/>
  </ClientOnly>
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
import {computed, onBeforeMount, onMounted, ref} from "vue"
import {useData, withBase} from 'vitepress'
import Highcharts from 'highcharts'
import loadWordcloud from 'highcharts/modules/wordcloud'
import {initTags} from '../functions'

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
const data = computed(() => initTags(theme.value.posts))
const keys = Object.keys(data.value);

let selectTag = ref('')

// 标签切换
const toggleTag = (tag: string) => {
  selectTag.value = tag
}

// 主题切换
const themeToggle = computed(() => {
  return (isDark, charts) => {
    charts.setOptions(isDark ? dark : light)

    return isDark ? 'dark' : 'light'
  }
})

const chartOptions = computed(() => {
  return {
    series: [{
      type: 'wordcloud',
      rotation: {
        from: 0,
        to: 75,
        orientations: 8
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
        click: (e) => toggleTag(e.point.options.name)
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
    }
  }
})

onBeforeMount(() => loadWordcloud(Highcharts))
const highcharts = ref(null)

onMounted(() => {
  import('highcharts-vue').then(module => {
    // use code
    highcharts.value = module.Chart
  })
  let url = location.href.split('?')[1]
  let params = new URLSearchParams(url)
  let tag = params.get('tag');

  tag && toggleTag(tag)
})

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

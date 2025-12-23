<template>
  <highcharts :options="chartOptions" :key="themeToggle(isDark, Highcharts)"/>
  <div class="tag-header">{{ selectYear && (selectYear + '年') }}</div>
  <ul>
    <div class="post-title">
      <li v-for="(article, index) in articles">
        <a :href="withBase(article.regularPath)+'.html'" :key="index"
           class="hover-underline-animation no-icon" target="_blank">
          {{ article.frontMatter.title }}
          <Badge type="info"><span class="fa fa-clock-o">&nbsp;{{ article.frontMatter.date }}</span></Badge>
        </a>
      </li>
    </div>
  </ul>

  <div class="pager" v-if="total > pageSize" :key="selectYear">
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

const darColors = [
  '#2b908f', '#90ee7e', '#f45b5b', '#7798BF', '#aaeeee', '#ff0066',
  '#eeaaee', '#55BF3B', '#DF5353', '#aaeeee'
], lightColors = [
  '#67B9EE', '#CEEDA5', '#9F6AE1', '#FEA26E', '#6BA48F', '#EA3535',
  '#8D96B7', '#ECCA15', '#20AA09', '#E0C3E4'
], dark = {
  plotOptions: {
    // 自动分配不同颜色
    bar: {
      colors: darColors,
    },
    column: {
      colors: darColors,
    }
  },
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  }
}, light = {
  plotOptions: {
    // 自动分配不同颜色
    bar: {
      colors: lightColors,
    },
    column: {
      colors: lightColors,
    }
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)'
  }
};

const {theme, isDark} = useData()
const data = computed(() => {
  const data: any = {}
  for (let index = 0; index < theme.value.posts.length; index++) {
    const element = theme.value.posts[index]
    const date = element.frontMatter.date
    if (date) {
      const year = date.substring(0, 4)

      if (data[year]) {
        data[year].push(element)
      } else {
        data[year] = []
        data[year].push(element)
      }
    }
  }
  return data
})
const keys = Object.keys(data.value).sort();

const selectYear = ref(''), pageNumber = ref(1), total = ref(0), articles = ref(), pageSize = 9

// 标签切换
const toggleYear = (year: string, page: Number) => {
      if (!year || !data.value[year]) {
        return
      }
      selectYear.value = year;
      pageNumber.value = Number(page)
      total.value = data.value[year].length
      articles.value = data.value[year].slice((page - 1) * pageSize, page * pageSize)
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
const pageUpdate = (num) => toggleYear(selectYear.value, num)

const chartOptions = computed(() => {
  const plotBands = keys.map((year, index) => ({
    from: index - 0.5,
    to: index + 0.5,
    color: 'rgba(0,0,0,0)',
    events: {
      click: () => {
        history.pushState({}, '', `/archives.html?year=${year}`)
        toggleYear(year, 1)
      }
    }
  }))

  return {
    chart: {
      type: 'column', // ✅ PC 默认 column
      backgroundColor: 'var(--vp-c-bg)'
    },

    plotOptions: {
      series: {
        borderWidth: 0,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          formatter() {
            return this.y
          },
          style: {
            // 适配深浅主题
            color: 'var(--vp-c-text-1)',
            fontSize: '12px',
            // 强烈建议关掉
            textOutline: 'none',
          }
        }
      },
      bar: {
        colorByPoint: true
      },
      column: {
        colorByPoint: true
      }
    },

    xAxis: {
      categories: keys,
      plotBands,
      crosshair: true,
      labels: {
        format: '{value}年',
        style: {color: 'var(--vp-c-text-1)'}
      },
      lineColor: 'var(--vp-c-text-1)',
      tickColor: 'var(--vp-c-text-1',
      gridLineColor: 'var(--vp-c-default-1)'
    },

    yAxis: {
      min: 0,
      labels: {style: {color: 'var(--vp-c-text-1)'}},
      title: {
        text: '数量',
        align: 'low',
        y: -20,
        x: -40,
        style: {color: 'var(--vp-c-text-1)'}
      },
      gridLineColor: 'var(--vp-c-default-1)'
    },

    tooltip: {
      shared: true,
      followPointer: true,
      style: {color: 'var(--vp-c-text-1)'}
    },

    series: [{
      data: keys.map(it => data.value[it].length),
      showInLegend: false,
      events: {
        click: (e) => {
          history.pushState({}, '', `/archives.html?year=${e.point.category}`)
          toggleYear(e.point.category, 1)
        }
      },
      tooltip: {
        headerFormat: '',
        pointFormat:
            '<span style="color:{point.color}">●</span> {point.category}年: <b>{point.y}</b><br/>'
      }
    }],
    // 响应式切换
    responsive: {
      rules: [{
        condition: {
          // 手机最大宽度
          maxWidth: 768
        },
        chartOptions: {
          chart: {
            type: 'bar'
          },
          xAxis: {
            labels: {
              format: '{value}年'
            }
          }
        }
      }]
    },

    credits: {enabled: false},
    title: {text: ''},
    accessibility: {enabled: false}
  }
})

onMounted(() => {
  let url = location.href.split('?')[1]
  let params = new URLSearchParams(url)
  let year = params.get('year'), page = params.get('page')

  year && toggleYear(year, parseInt(page) || 1)
})

</script>

<style scoped>
@media screen and (max-width: 768px) {
  .date {
    display: none;
  }
}

/* 整个系列范围 hover 手型 */
:deep(.highcharts-plot-band) {
  cursor: pointer;
}
</style>

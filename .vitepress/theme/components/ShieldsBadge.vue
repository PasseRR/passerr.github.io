<template>
  <a :href="link" class="no-icon" target="_blank">
    <img :src="`https://img.shields.io/badge/-${label}-${color}?logoColor=${logoColor}&logo=${actualLogo}`"
         class="data-unzoomable shields" :alt="label"/>
  </a>
</template>

<script lang="ts" setup>
import golang from './icons/golang.svg?raw'
import java from './icons/java.svg?raw'
import mysql from './icons/mysql.svg?raw'
import sql from './icons/sql.svg?raw'
import tencent_cloud from './icons/tencent-cloud.svg?raw'
import undertow from './icons/undertow.svg?raw'
import {computedAsync} from '@vueuse/core'

const svgs = {
  golang,
  java,
  mysql,
  sql,
  tencent_cloud,
  undertow
};

const props = defineProps({
  label: String,
  logo: {
    type: String,
    required: false,
    default: '',
  },
  color: String,
  link: String,
  logoColor: {
    type: String,
    required: false,
    default: 'FFF'
  },
  svg: {
    type: String,
    required: false,
    default: '',
  },
})

const actualLogo = computedAsync(() => {
  if (props.svg.length) {
    return `data:image/svg+xml;base64,${window.btoa(svgs[props.svg])}`
  }

  return props.logo
})

</script>

<style scoped>
.shields {
  display: inline-block;
  margin-right: .5em;
}
</style>

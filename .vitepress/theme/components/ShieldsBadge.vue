<template>
  <a :href="link" class="no-icon" target="_blank">
    <img :src="`https://img.shields.io/badge/-${label}-${color}?logoColor=${logoColor}&logo=${actualLogo}`"
         class="data-unzoomable shields" :alt="label"/>
  </a>
</template>

<script lang="ts" setup>
import {computedAsync} from '@vueuse/core'

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
    return import(/* @vite-ignore */`./icons/${props.svg}.svg?raw`)
        .then(it => it.default)
        .then(it => `data:image/svg+xml;base64,${window.btoa(it)}`)
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

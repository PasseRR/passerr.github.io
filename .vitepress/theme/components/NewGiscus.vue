<template>
  <Giscus
      repo="PasseRR/passerr.github.io"
      repo-id="MDEwOlJlcG9zaXRvcnk5MTc3MTIzOQ=="
      category="Announcements"
      category-id="DIC_kwDOBXhRZ84CZgw9"
      :term="page.relativePath"
      strict="0"
      reactions-enabled="1"
      emit-metadata="0"
      input-position="top"
      :theme="isDark ? 'dark': 'light'"
      lang="zh-CN"
      crossorigin="anonymous"
      loading="lazy"
  />
</template>
<script setup lang="ts">
import Giscus from '@giscus/vue';
import {useData} from "vitepress";

const {page, isDark} = useData()
</script>

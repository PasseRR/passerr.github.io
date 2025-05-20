<template>
  <span class="link-card" style="display:block;">
  <a class="link-card-link no-icon" :href="link" target="_blank">
    <span class="link-card-container">
        <img class="link-card-img" :src="logo" v-if="logo"/>
      <span class="text">
        <span class="link-card-title">
          {{ title }}
        </span>
        <span class="link-card-description" v-if="description">
          {{ description }}
        </span>
      </span>
    </span>
  </a>
</span>
</template>

<script lang="ts" setup>
defineProps({
  link: {
    type: String,
    required: true,
  },
  logo: String,
  title: {
    type: String,
    required: true,
  },
  description: String,
})
</script>

<style scoped>
.link-card {
  padding-top: 8px;
  padding-bottom: 8px;
}

.link-card-link {
  color: unset !important;
  display: block;
  width: 99%;
  text-decoration: none;
}

.link-card-container {
  display: flex;
  align-items: center;
  padding: 6px 10px 8px 10px;
  border-radius: 8px;
  border: 0.8px solid var(--vp-input-border-color);
  transition: color 0.3s ease;
}

.link-card-container:hover {
  background-color: var(--vp-code-line-highlight-color);
  cursor: pointer;
}

.link-card-img {
  margin-right: 12px;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  background-color: var(--vp-c-gray-3);
}

.link-card-title {
  color: var(--vp-c-text-1);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.8;
  font-size: 14px;
  line-height: 18px;
  font-weight: bold;
}

.link-card-description {
  color: var(--vp-c-text-2);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.6;
  margin: 4px 0 0 0;
  font-weight: 400;
  font-size: 11px;
  line-height: 14px;
}
</style>

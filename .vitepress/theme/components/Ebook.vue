<template>
  <div class="books">
    <a :href="site.main + book.url" v-for="(book, _) in data.books" class="no-icon" target="_blank">
      <div class="book">
        <div class="book-info">
          <span class="hover-underline-animation" style="color: var(--vp-c-text-1)">{{ book.name }}</span>
        </div>
        <div class="book-date date">
          <span class="fa fa-calendar"></span> {{ book.date }}
        </div>
      </div>
    </a>
  </div>
</template>

<script lang="ts" setup>
import {site} from "../../main";

const data = site
</script>

<style scoped>
.books {
  display: flex;
  flex-wrap: wrap;
}

.books a {
  font-weight: 500;
  text-decoration: none;
}

.book {
  width: 140px;
  height: 200px;
  margin: 10px 20px 15px 20px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgb(0 0 0 / 25%);
  background: rgba(128, 128, 128, 0.15);
}

.book-info {
  text-align: center;
  height: 150px;
  font-size: 15px;
  font-weight: bold;
  padding-top: 75px;
  /*color: #3fa757;*/
  word-break: break-word;
}

.book-date {
  text-align: center;
  font-size: 11px;
  color: var(--date-color);
}
</style>

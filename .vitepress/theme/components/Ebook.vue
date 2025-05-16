<template>
  <div class="books">
    <a :href="site.main + book.url" v-for="(book, _) in data.books" class="no-icon hover-book" target="_blank">
      <div class="book" :class="book.finished && 'book-finished'">
        <div class="book-info">
          <span class="hover-title">{{ book.name }}</span>
        </div>
        <div class="book-date date">
          <span class="fa fa-clock-o"></span> {{ book.date }}
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
  border-radius: 8px;
  box-shadow: 0 4px 10px rgb(0 0 0 / .2);
  position: relative;
  background: rgba(242, 227, 188, .2);
}

.book-finished::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 0, 0, 0.75);
  clip-path: polygon(100px 0, 112px 0, 100% 28px, 100% 40px);
  z-index: 1;
}

.book-info {
  text-align: center;
  height: 150px;
  font-size: 15px;
  font-weight: bold;
  padding-top: 75px;
  word-break: break-word;
  color: var(--vp-c-text-1)
}

.book-date {
  text-align: center;
  font-size: 11px;
  color: var(--date-color);
}

.hover-title {
  position: relative;
}

.hover-title::after  {
  content: '';
  position: absolute;
  width: 100%;
  transform: scaleX(0);
  height: 3px;
  bottom: -3px;
  left: 0;
  background-color: var(--vp-c-brand);;
  transition: transform 0.4s ease-in-out;
}

.hover-book:hover .hover-title::after {
  transform: scaleX(1);
}
</style>

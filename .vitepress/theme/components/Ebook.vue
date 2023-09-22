<template>
  <div class="books">
    <a :href="book.url" v-for="(book, _) in data.books" class="no-icon" target="_blank">
      <div class="book">
        <div class="book-info">
          <span>{{ book.name }}</span>
        </div>
        <div class="book-date">
          <span>{{ book.date }}</span>
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

.book {
  width: 149px;
  height: 200px;
  margin: 10px 20px 15px 20px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgb(0 0 0 / 25%);
}

.book-info {
  text-align: center;
  height: 150px;
  font-size: 16px;
  font-weight: bold;
  padding-top: 75px;
  /*color: #3fa757;*/
  word-break: break-word;
}

.book-date {
  text-align: center;
  font-size: 10px;
  color: #ADADAD;
}
</style>
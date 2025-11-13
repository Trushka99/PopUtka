<script setup lang="ts">
import HeaderComponent from "./components/HeaderComponent.vue";
import FooterComponent from "./components/FooterComponent.vue";
import { RouterView, useRoute } from "vue-router";
import MobileBottomMenu from "./components/MobileBottomMenu.vue";
const route = useRoute();
</script>

<template>
  <v-app>
    <HeaderComponent v-if="route.path !== '/login'" />
    <v-main style="background-color: rgb(238, 238, 238)">
      <RouterView />
    </v-main>
    <FooterComponent v-if="route.path !== '/login'" />
  </v-app>

  <MobileBottomMenu v-if="route.path !== '/login'" />
</template>

<style scoped>
.mobile-bottom-bar {
  display: none; /* По умолчанию скрыт */

  /* Только на мобильных */
  @media (max-width: 768px) {
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 60px;
    background-color: #fff;
    border-top: 1px solid #ccc;
    z-index: 2000;
  }
}
</style>

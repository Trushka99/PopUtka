<script setup lang="ts">
import HeaderComponent from "./components/HeaderComponent.vue";
import FooterComponent from "./components/FooterComponent.vue";
import Chat from "./components/Chat.vue";
import { RouterView, useRoute } from "vue-router";
import { watch } from "vue";
import "./utils/main.scss";
import MobileBottomMenu from "./components/MobileBottomMenu.vue";
const route = useRoute();
import { useSnackbarStore } from "@/stores/snackbarStore";
const snackbar = useSnackbarStore();
const setBodyClass = () => {
  if (route.path === "/login") {
    document.body.classList.add("login-page");
    document.body.classList.remove("default-page");
  } else {
    document.body.classList.add("default-page");
    document.body.classList.remove("login-page");
  }
};
// при инициализации
setBodyClass();

// следим за изменением маршрута
watch(route, setBodyClass);
</script>

<template>
  <v-app>
    <HeaderComponent v-if="route.path !== '/login'" />
    <v-main style="background-color: rgb(238, 238, 238)">
      <RouterView />
    </v-main>
    <v-snackbar v-model="snackbar.show" :timeout="3000" :color="snackbar.color">
      {{ snackbar.message }}
    </v-snackbar>

    <FooterComponent v-if="route.path !== '/login'" />
  </v-app>

  <MobileBottomMenu v-if="route.path !== '/login'" />
</template>

<style scoped>
.mobile-bottom-bar {
  display: none;
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

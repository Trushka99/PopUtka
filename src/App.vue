<script setup lang="ts">
import HeaderComponent from "./components/HeaderComponent.vue";
import FooterComponent from "./components/FooterComponent.vue";
import { RouterView } from "vue-router";
import { useRoute } from "vue-router";
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
</template>

<style scoped></style>

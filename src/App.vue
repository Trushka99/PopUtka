<script setup lang="ts">
import HeaderComponent from "./components/HeaderComponent.vue";
import FooterComponent from "./components/FooterComponent.vue";
import { RouterView } from "vue-router";
</script>

<template>
  <v-app>
    <HeaderComponent />
    <v-main style="background-color: rgb(238, 238, 238)">
      <RouterView />
    </v-main>
    <FooterComponent />
  </v-app>
</template>

<style scoped></style>

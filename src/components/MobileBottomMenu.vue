<script setup lang="ts">
import { useLangStore } from "@/stores/langStore";
const langStore = useLangStore();
import CreateTrip from "@/pages/CreateTrip.vue";
</script>
<template>
  <div class="mobile-bottom-bar">
    <div class="menu_list">
      <RouterLink class="link" to="/search">
        <div class="menu_item">
          <v-icon color="rgba(0, 128, 255, 1)">mdi-magnify</v-icon>
          <p>Поиск</p>
        </div></RouterLink
      >
      <v-dialog max-width="750">
        <template v-slot:activator="{ props: activatorProps }">
          <div v-bind="activatorProps" class="menu_item">
            <v-icon color="rgba(0, 128, 255, 1)">mdi-road-variant</v-icon>
            <p>Создать</p>
          </div>
        </template>

        <template v-slot:default="{ isActive }">
          <CreateTrip />
        </template>
      </v-dialog>
      <div class="menu_item">
        <v-icon color="rgba(0, 128, 255, 1)">mdi-list-box</v-icon>
        <p>поездки</p>
      </div>
      <RouterLink class="link" to="/users/me">
        <div class="menu_item">
          <v-icon color="rgba(0, 128, 255, 1)">mdi-account</v-icon>
          {{ langStore.t("profile") || "Профиль" }}
        </div>
      </RouterLink>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.mobile-bottom-bar {
  display: none;

  @media (max-width: 768px) {
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
.link {
  text-decoration: none;
}
.menu_list {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 80%;
  margin: 0 auto;
  @media (max-width: 425px) {
    width: 80%;
  }
}
.menu_item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>

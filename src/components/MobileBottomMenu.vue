<script setup lang="ts">
import { useLangStore } from "@/stores/langStore";
const langStore = useLangStore();
import CreateTrip from "@/pages/CreateTrip.vue";
import { useNotifications } from "@/composables/useNotifications";
import { ref } from "vue";
const { unreadCount } = useNotifications();
const tripDialog = ref(false);
</script>
<template>
  <div class="mobile-bottom-bar">
    <div class="menu_list">
      <RouterLink
        class="link"
        :to="`/search?departureAt=${new Date().toISOString().split('T')[0]}`"
      >
        <div class="menu_item">
          <v-icon size="large" color="rgba(0, 128, 255, 1)">mdi-magnify</v-icon>
        </div></RouterLink
      >
      <v-dialog v-model="tripDialog" max-width="940">
        <template v-slot:activator="{ props: activatorProps }">
          <div v-bind="activatorProps" class="menu_item">
            <v-icon size="large" color="rgba(0, 128, 255, 1)"
              >mdi-road-variant</v-icon
            >
          </div>
        </template>

        <template v-slot:default>
          <CreateTrip :closeDialog="() => (tripDialog = false)" />
        </template>
      </v-dialog>
      <RouterLink class="link" to="/chats">
        <div class="menu_item">
          <v-icon size="large" color="rgba(0, 128, 255, 1)"
            >mdi-list-box</v-icon
          >
        </div></RouterLink
      >
      <RouterLink class="link" to="/notifications">
        <div class="menu_item">
          <v-icon size="large" color="rgba(0, 128, 255, 1)">
            mdi-bell-circle-outline
          </v-icon>
          <span v-if="unreadCount" class="menu_badge">{{
            unreadCount > 9 ? "9+" : unreadCount
          }}</span>
        </div></RouterLink
      >
      <RouterLink class="link" to="/users/me">
        <div class="menu_item">
          <v-icon size="large" color="rgba(0, 128, 255, 1)">mdi-account</v-icon>
        </div></RouterLink
      >
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
  width: 75%;
  margin: 0 auto;
}
.menu_item {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.menu_badge {
  position: absolute;
  top: -6px;
  right: -10px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border: 2px solid #fff;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #ff6d00;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}
</style>

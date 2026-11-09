<script setup lang="ts">
import NotificationsPanel from "@/components/NotificationsPanel.vue";
</script>

<template>
  <div class="notifications-page">
    <NotificationsPanel variant="page" />
  </div>
</template>

<style scoped lang="scss">
.notifications-page {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 36px 16px 90px;
  box-sizing: border-box;
}

@media (max-width: 720px) {
  .notifications-page {
    padding: 28px 12px 90px;
  }
}
</style>

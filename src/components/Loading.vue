<script setup lang="ts"></script>
<template>
  <div class="text-center">
    <v-progress-circular
      :size="115"
      color="primary"
      :width="9"
      indeterminate
    ></v-progress-circular>
  </div>
</template>
<style lang="scss" scoped>
.text-center {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>

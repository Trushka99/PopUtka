<script setup lang="ts">
import { ref, watch } from "vue";
import { useLangStore } from "@/stores/langStore";
const langStore = useLangStore();
const selectedLang = ref(langStore.currentLang || "ru");
watch(selectedLang, (newLang) => {
  langStore.setLang(newLang);
});

</script>

<template>
  <v-btn-toggle v-model="selectedLang" mandatory class="language-picker">
    <v-btn value="ru">RU</v-btn>
    <v-btn value="en">EN</v-btn>
    <v-btn value="uz">UZ</v-btn>
  </v-btn-toggle>
</template>

<style scoped>
.language-picker {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;

  padding: 6px;

  border-radius: 999px !important;

  background: rgba(255, 255, 255, 0.55) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  border: 1px solid rgba(255, 255, 255, 0.35);

  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.5);
}

.language-picker :deep(.v-btn) {
  min-width: 60px;
  border-radius: 999px !important;

  text-transform: none;
  font-weight: 600;
  letter-spacing: 0;

  color: #334155 !important;

  transition: all 0.25s ease;
}

.language-picker :deep(.v-btn:hover) {
  background: rgba(255, 255, 255, 0.25);
}

.language-picker :deep(.v-btn--active) {
  background: rgba(59, 130, 246, 0.15) !important;
  color: #2563eb !important;

  box-shadow:
    0 2px 10px rgba(0, 0, 0, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.8);
}
</style>

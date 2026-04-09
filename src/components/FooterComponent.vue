<script setup lang="ts">
import { useLangStore } from "@/stores/langStore";
import { computed } from "vue";
const langStore = useLangStore();
const links = computed(() => {
  return [
    langStore.t("rules"),
    langStore.t("security"),
    langStore.t("assistance"),
    langStore.t("forbuiz"),
    langStore.t("affiliate"),
  ];
});
</script>
<template>
  <v-footer class="footer">
    <div class="footer__links">
      <v-btn
        v-for="link in links"
        :key="link"
        :text="link"
        variant="text"
        rounded
      ></v-btn>
    </div>

    <div class="footer__copyright">
      {{ new Date().getFullYear() }} —
      <strong> Pop.utka. {{ langStore.t("reserved") }}.</strong>
    </div>
  </v-footer>
</template>

<style lang="scss" scoped>
.footer {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 1rem 0;
  max-height: 160px;
  min-height: 160px;
  background-color: rgb(238, 238, 238); // если используешь переменные SCSS
  @media (max-width: 768px) {
    display: none;
  }

  &__links {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
  }

  &__copyright {
    width: 100%;
    text-align: center;
    margin-top: 0.5rem;
    font-size: 0.9rem;
  }
}
</style>

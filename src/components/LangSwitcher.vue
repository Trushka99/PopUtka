<script setup lang="ts">
import { computed } from "vue";
import { useLangStore } from "@/stores/langStore";

withDefaults(
  defineProps<{
    /** menu — кнопка с выпадающим списком (шапка), segmented — три кнопки в ряд */
    variant?: "menu" | "segmented";
  }>(),
  { variant: "menu" },
);

const langStore = useLangStore();

const LANGS = [
  { value: "ru", label: "RU", name: "Русский", flag: "/images/russia.png" },
  { value: "uz", label: "UZ", name: "O‘zbekcha", flag: "/images/uzbekistan.png" },
  { value: "en", label: "EN", name: "English", flag: "/images/eng.png" },
];

const current = computed(
  () => LANGS.find((l) => l.value === langStore.currentLang) ?? LANGS[0],
);

const choose = (value: string) => {
  if (value !== langStore.currentLang) langStore.setLang(value);
};
</script>

<template>
  <!-- Шапка: кнопка с флагом и выпадающим списком -->
  <v-menu v-if="variant === 'menu'" location="bottom end" offset="10">
    <template #activator="{ props }">
      <button
        type="button"
        class="lang-chip"
        v-bind="props"
        :aria-label="current.name"
      >
        <img class="lang-flag" :src="current.flag" alt="" />
        <span class="lang-chip__code">{{ current.label }}</span>
        <v-icon size="18" class="lang-chip__chevron">mdi-chevron-down</v-icon>
      </button>
    </template>

    <div class="lang-menu" role="menu">
      <button
        v-for="lang in LANGS"
        :key="lang.value"
        type="button"
        role="menuitemradio"
        :aria-checked="lang.value === current.value"
        class="lang-option"
        :class="{ 'lang-option--active': lang.value === current.value }"
        @click="choose(lang.value)"
      >
        <img class="lang-flag lang-flag--big" :src="lang.flag" alt="" />
        <span class="lang-option__name">{{ lang.name }}</span>
        <span class="lang-option__code">{{ lang.label }}</span>
        <v-icon v-if="lang.value === current.value" size="18" class="lang-option__check"
          >mdi-check</v-icon
        >
      </button>
    </div>
  </v-menu>

  <!-- Мобильное меню: три кнопки в ряд -->
  <div v-else class="lang-seg" role="radiogroup">
    <button
      v-for="lang in LANGS"
      :key="lang.value"
      type="button"
      role="radio"
      :aria-checked="lang.value === current.value"
      class="lang-seg__item"
      :class="{ 'lang-seg__item--active': lang.value === current.value }"
      @click="choose(lang.value)"
    >
      <img class="lang-flag" :src="lang.flag" alt="" />
      {{ lang.label }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.lang-flag {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 0 2px #fff, 0 1px 4px rgba(15, 40, 80, 0.2);

  &--big {
    width: 28px;
    height: 28px;
  }
}

/* --- Кнопка в шапке --- */
.lang-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 10px 0 8px;
  border: 1px solid #d6e3f1;
  border-radius: 999px;
  background: #e9f1fa;
  color: #1d3a5c;
  font: inherit;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover,
  &[aria-expanded="true"] {
    background: #dde9f6;
    border-color: #bdd3ec;
    box-shadow: 0 4px 12px rgba(30, 100, 180, 0.14);
  }
}

.lang-chip__code {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.lang-chip__chevron {
  color: #6b7d94;
  transition: transform 0.2s ease;

  .lang-chip[aria-expanded="true"] & {
    transform: rotate(180deg);
  }
}

/* --- Выпадающий список --- */
.lang-menu {
  min-width: 220px;
  padding: 6px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 18px 40px rgba(15, 40, 80, 0.18);
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #0f1d33;
  font-size: 15px;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #f3f7fb;
  }

  &--active,
  &--active:hover {
    background: #e8f1fd;
    color: #0b4fa8;
  }
}

.lang-option__name {
  flex: 1;
  font-weight: 600;
}

.lang-option__code {
  font-size: 12px;
  font-weight: 700;
  color: #8a97a8;
}

.lang-option__check {
  color: #1e88e5;
}

/* --- Сегменты (мобильное меню на синем фоне) --- */
.lang-seg {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
}

.lang-seg__item {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;

  &--active {
    background: #fff;
    color: #0b4fa8;
    box-shadow: 0 4px 12px rgba(0, 30, 80, 0.2);
  }
}
</style>

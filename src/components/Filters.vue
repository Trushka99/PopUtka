<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useLangStore } from "@/stores/langStore";
import type { DayPart, TripFilters } from "@/utils/tripFilters";

const props = defineProps<{
  modelValue: TripFilters;
  /** Сколько фильтров включено — для кнопки на телефоне */
  activeCount: number;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: TripFilters): void;
  (e: "reset"): void;
}>();

const langStore = useLangStore();
const t = (key: string) => langStore.t(key);

// На телефоне панель свёрнута в кнопку «Фильтры»
const openOnMobile = ref(false);

const update = (patch: Partial<TripFilters>) =>
  emit("update:modelValue", { ...props.modelValue, ...patch });

const DAY_PARTS: { key: DayPart; icon: string; label: string; hint: string }[] = [
  { key: "morning", icon: "mdi-weather-sunset-up", label: "morning", hint: "06–12" },
  { key: "day", icon: "mdi-white-balance-sunny", label: "daytime", hint: "12–18" },
  { key: "evening", icon: "mdi-weather-night", label: "evening", hint: "18–24" },
];

const toggleDayPart = (part: DayPart) => {
  const parts = props.modelValue.dayParts.includes(part)
    ? props.modelValue.dayParts.filter((p) => p !== part)
    : [...props.modelValue.dayParts, part];
  update({ dayParts: parts });
};

// Цену применяем по кнопке/Enter, чтобы не дёргать сервер на каждую цифру
const priceFrom = ref<number | null>(props.modelValue.minPrice);
const priceTo = ref<number | null>(props.modelValue.maxPrice);
watch(
  () => [props.modelValue.minPrice, props.modelValue.maxPrice],
  ([min, max]) => {
    priceFrom.value = min;
    priceTo.value = max;
  },
);

const priceDirty = computed(
  () =>
    (priceFrom.value || null) !== (props.modelValue.minPrice || null) ||
    (priceTo.value || null) !== (props.modelValue.maxPrice || null),
);

const applyPrice = () =>
  update({
    minPrice: priceFrom.value ? Number(priceFrom.value) : null,
    maxPrice: priceTo.value ? Number(priceTo.value) : null,
  });
</script>

<template>
  <aside class="filters" :class="{ 'filters--open': openOnMobile }">
    <button
      type="button"
      class="filters__toggle"
      :aria-expanded="openOnMobile"
      @click="openOnMobile = !openOnMobile"
    >
      <v-icon size="20">mdi-tune-variant</v-icon>
      {{ t("filters") }}
      <span v-if="activeCount" class="filters__count">{{ activeCount }}</span>
      <v-icon size="20" class="filters__chevron">mdi-chevron-down</v-icon>
    </button>

    <div class="filters__panel">
      <div class="filters__head">
        <span class="filters__title">{{ t("filters") }}</span>
        <button
          v-if="activeCount"
          type="button"
          class="filters__reset"
          @click="emit('reset')"
        >
          {{ t("reset") }}
        </button>
      </div>

      <!-- Время выезда -->
      <div class="filters__label">{{ t("departure_time_label") }}</div>
      <div class="chips">
        <button
          v-for="part in DAY_PARTS"
          :key="part.key"
          type="button"
          class="chip"
          :class="{ 'chip--on': modelValue.dayParts.includes(part.key) }"
          :aria-pressed="modelValue.dayParts.includes(part.key)"
          :title="part.hint"
          @click="toggleDayPart(part.key)"
        >
          <v-icon size="16">{{ part.icon }}</v-icon>
          {{ t(part.label) }}
        </button>
      </div>

      <!-- Цена -->
      <div class="filters__label">{{ t("price_per_seat_uzs") }}</div>
      <form class="price" @submit.prevent="applyPrice">
        <label class="price__field">
          <span>{{ t("price_from") }}</span>
          <input
            v-model.number="priceFrom"
            type="number"
            inputmode="numeric"
            min="0"
            step="5000"
            placeholder="0"
          />
        </label>
        <label class="price__field">
          <span>{{ t("up_to") }}</span>
          <input
            v-model.number="priceTo"
            type="number"
            inputmode="numeric"
            min="0"
            step="5000"
            placeholder="∞"
          />
        </label>
        <button
          v-if="priceDirty"
          type="submit"
          class="price__apply"
          :aria-label="t('filter')"
        >
          <v-icon size="18">mdi-check</v-icon>
        </button>
      </form>

      <!-- Водитель -->
      <div class="filters__label">{{ t("driver") }}</div>
      <div class="seg" role="radiogroup">
        <button
          type="button"
          role="radio"
          class="seg__item"
          :class="{ 'seg__item--on': !modelValue.driverGender }"
          :aria-checked="!modelValue.driverGender"
          @click="update({ driverGender: '' })"
        >
          {{ t("driver_any") }}
        </button>
        <button
          type="button"
          role="radio"
          class="seg__item"
          :class="{ 'seg__item--on': modelValue.driverGender === 'male' }"
          :aria-checked="modelValue.driverGender === 'male'"
          :title="t('man')"
          @click="update({ driverGender: 'male' })"
        >
          <v-icon size="18" color="#1e88e5">mdi-gender-male</v-icon>
        </button>
        <button
          type="button"
          role="radio"
          class="seg__item"
          :class="{ 'seg__item--on': modelValue.driverGender === 'female' }"
          :aria-checked="modelValue.driverGender === 'female'"
          :title="t('feman')"
          @click="update({ driverGender: 'female' })"
        >
          <v-icon size="18" color="#d8457a">mdi-gender-female</v-icon>
        </button>
      </div>

      <div class="chips chips--last">
        <button
          type="button"
          class="chip"
          :class="{ 'chip--on': modelValue.verifiedOnly }"
          :aria-pressed="modelValue.verifiedOnly"
          @click="update({ verifiedOnly: !modelValue.verifiedOnly })"
        >
          <v-icon size="16">{{
            modelValue.verifiedOnly ? "mdi-check-decagram" : "mdi-check-decagram-outline"
          }}</v-icon>
          {{ t("verified_only") }}
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.filters {
  --ink: #0b3550;
  --ink-soft: #5a7085;
  color: var(--ink);
}

.filters__toggle {
  display: none;
}

.filters__panel {
  padding: 18px 18px 20px;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
}

.filters__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filters__title {
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 19px;
  font-weight: 700;
}

.filters__reset {
  border: none;
  background: none;
  padding: 0;
  color: #0b4fa8;
  font-weight: 600;
  cursor: pointer;
}

.filters__label {
  margin: 18px 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #8a97a8;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  &--last {
    margin-top: 14px;
  }
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid #d6e3f1;
  border-radius: 999px;
  background: #fff;
  color: #2c4a6e;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    background: #f1f6fc;
  }

  &--on,
  &--on:hover {
    border-color: #9cc6f0;
    background: #e3effc;
    color: #0b4fa8;
  }
}

/* --- Цена --- */
.price {
  display: flex;
  align-items: stretch;
  gap: 6px;
}

.price__field {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 10px;
  border: 1px solid #d6e3f1;
  border-radius: 12px;
  background: #fff;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus-within {
    border-color: #64b5f6;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.15);
  }

  span {
    font-size: 12px;
    color: #8a97a8;
  }

  input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: var(--ink);
    font-size: 14px;
    font-weight: 600;
    -moz-appearance: textfield;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
}

.price__apply {
  flex: none;
  width: 40px;
  border: none;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #1e88e5, #42a5f5);
  color: #fff;
  cursor: pointer;
}

/* --- Пол водителя --- */
.seg {
  display: flex;
  gap: 3px;
  padding: 3px;
  border: 1px solid #e3e9f1;
  border-radius: 999px;
  background: #f3f6fa;
}

.seg__item {
  flex: 1;
  height: 32px;
  border: none;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: transparent;
  color: #43526a;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;

  &--on {
    background: #fff;
    color: #0b4fa8;
    box-shadow: 0 2px 6px rgba(20, 60, 110, 0.12);
  }
}

/* --- Телефон: панель за кнопкой --- */
@media (max-width: 920px) {
  .filters__toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 48px;
    padding: 0 16px;
    border: none;
    border-radius: 16px;
    background: #fff;
    color: var(--ink);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  }

  .filters__count {
    min-width: 22px;
    height: 22px;
    padding: 0 7px;
    border-radius: 999px;
    display: inline-grid;
    place-items: center;
    background: #1e88e5;
    color: #fff;
    font-size: 12px;
  }

  .filters__chevron {
    margin-left: auto;
    color: #8a97a8;
    transition: transform 0.2s ease;

    .filters--open & {
      transform: rotate(180deg);
    }
  }

  .filters__panel {
    display: none;
    margin-top: 8px;
  }

  .filters--open .filters__panel {
    display: block;
  }

  .filters__head {
    display: none;
  }

  .filters__label:first-of-type {
    margin-top: 0;
  }
}
</style>

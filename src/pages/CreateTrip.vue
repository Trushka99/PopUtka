<script setup lang="ts">
import { ref, computed } from "vue";

import { useLangStore } from "@/stores/langStore";
import cities from "../utils/dictionary.json";
const from = ref("");
const showMenuFrom = ref(false);
const timeFrom = ref<string | null>(null);
const formattedFrom = computed(() => timeFrom.value || "");
const passengers = ref(1);
const passengersMenu = ref(false);
const passengersLabel = computed<string>({
  get: () => {
    if (passengers.value === 1) {
      return `${passengers.value} ${langStore.t("passenger")}`;
    } else if (passengers.value <= 5) {
      return `${passengers.value} ${langStore.t("passengers")}`;
    } else {
      return `${passengers.value} ${langStore.t("passengers")}`;
    }
  },
  set: (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num)) passengers.value = num;
  },
});
const to = ref("");
const langStore = useLangStore();
const cityList = computed(() => {
  return Object.values(
    cities[langStore.currentLang as keyof typeof cities] || {}
  );
});
const increase = () => {
  if (passengers.value !== 8) passengers.value++;
};
const decrease = () => {
  if (passengers.value !== 1) passengers.value--;
};
</script>
<template>
  <div>
    <v-card>
      <v-card-text>
        <v-row justify="space-between">
          <v-autocomplete
            v-model="from"
            :label="langStore.t('from')"
            density="compact"
            variant="plain"
            :items="cityList"
            prepend-inner-icon="mdi-map-marker"
            hide-details />
          <v-autocomplete
            v-model="from"
            :label="langStore.t('from')"
            density="compact"
            variant="plain"
            :items="cityList"
            prepend-inner-icon="mdi-map-marker"
            hide-details
        /></v-row>
        >
        <v-text-field
          label="Стоимость"
          model-value="10.00"
          suffix="₽"
        ></v-text-field>
        <v-text-field v-model="formattedFrom" label="Время от" readonly>
          <v-menu
            v-model="showMenuFrom"
            :close-on-content-click="false"
            activator="parent"
            min-width="0"
          >
            <v-time-picker
              color="primary"
              variant="flat"
              density="comfortable"
              format="24hr"
              v-model="timeFrom"
              @click:minute="showMenuFrom = false"
            ></v-time-picker>
          </v-menu>
        </v-text-field>
        <v-menu
          v-model="passengersMenu"
          transition="scale-transition"
          :close-on-content-click="false"
          offset-y
        >
          <template #activator="{ props }"
            ><v-text-field
              v-bind="props"
              v-model="passengersLabel"
              density="compact"
              variant="plain"
              prepend-inner-icon="mdi-account"
              hide-details
              readonly
            ></v-text-field>
          </template>
          <div class="passengers-modal">
            <h4>{{ langStore.t("passengers") }}</h4>
            <div style="display: flex; gap: 15px">
              <button
                :disabled="passengers === 1"
                @click="decrease"
                class="passengers-button"
              >
                -
              </button>
              <h4>{{ passengers }}</h4>
              <button
                :disabled="passengers === 8"
                @click="increase"
                class="passengers-button"
              >
                +
              </button>
            </div>
          </div>
        </v-menu>
      </v-card-text>
    </v-card>
  </div>
</template>
<style scoped lang="scss"></style>

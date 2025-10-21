<script setup lang="tsx">
import { ref, computed } from "vue";
import { RouterLink } from "vue-router";
import { useLangStore } from "@/stores/langStore";
import cities from "../utils/dictionary.json";
const langStore = useLangStore();

const cityList = computed(() => {
  return Object.values(
    cities[langStore.currentLang as keyof typeof cities] || {}
  );
});
console.log(cityList.value);
const from = ref("");
const to = ref("");
const dateMenu = ref(false);
const passengersMenu = ref(false);
const date = ref(new Date().toISOString().substr(0, 10));
const passengers = ref(1);
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
const increase = () => {
  if (passengers.value !== 8) passengers.value++;
};
const decrease = () => {
  if (passengers.value !== 1) passengers.value--;
};
</script>

<template>
  <div class="search-bar">
    <!-- Откуда -->

    <v-autocomplete
      v-model="from"
      :label="langStore.t('from')"
      density="compact"
      variant="plain"
      :items="cityList"
      prepend-inner-icon="mdi-map-marker"
      hide-details
    ></v-autocomplete>

    <!-- Иконка переключения -->
    <!-- <v-icon v-show="from" class="swap-icon" size="24"
      >mdi-swap-horizontal</v-icon
    > -->

    <!-- Куда -->
    <v-autocomplete
      v-model="to"
      :label="langStore.t('to')"
      density="compact"
      :items="cityList"
      variant="plain"
      prepend-inner-icon="mdi-map-marker-outline"
      hide-details
    ></v-autocomplete>

    <!-- Дата -->
    <v-menu
      v-model="dateMenu"
      transition="scale-transition"
      :close-on-content-click="false"
      offset-y
    >
      <template #activator="{ props }">
        <v-text-field
          v-bind="props"
          v-model="date"
          density="compact"
          variant="plain"
          prepend-inner-icon="mdi-calendar"
          readonly
          hide-details
        ></v-text-field>
      </template>
      <v-date-picker
        v-model="date"
        @update:model-value="dateMenu = false"
      ></v-date-picker>
    </v-menu>

    <!-- Кол-во пассажиров -->

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
        <h4>{{langStore.t("passengers")}}</h4>
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

    <!-- Кнопка поиска -->
    <RouterLink class="header__link" to="/search">
      <v-btn class="search-btn" color="#00AEEF" rounded="lg" height="48">
        {{langStore.t("search")}}
      </v-btn></RouterLink
    >
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  background-color: white;
  padding: 8px 12px;
  border-radius: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  gap: 12px;
  z-index: 2;
  position: relative;
}
.passengers-modal {
  display: flex;
  margin-top: 20px;
  background-color: white;
  justify-content: space-between;
  border: 1px solid black;
  border-radius: 15px;
  padding: 20px;
  width: 370px;
  margin-left: -120px;
}
.passengers-button {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid blue;
  font-size: 25px;
  color: blue;
  display: flex;
  justify-content: center;
  align-items: center;
  &:disabled {
    border-color: grey;
    color: grey;
  }
}
.search-bar .v-text-field {
  min-width: 0;
}

.swap-icon {
  color: #007bff;
}

.search-btn {
  color: white;
  text-transform: none;
  font-weight: bold;
}
@media (max-width: 920px) {
  .search-bar {
    flex-direction: column;
    width: 100%;
  }

  .search-bar .v-text-field {
    width: 100%;
    min-width: 0;
  }

  .search-btn {
    width: 100%;
  }
  .passengers-modal {
    margin-left: 0;
  }
}
</style>

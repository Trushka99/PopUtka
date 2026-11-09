<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useLangStore } from "@/stores/langStore";
import cities from "../utils/dictionary.json";
import { PASSENGER_FORMS, pluralize } from "@/utils/tripFormat";
const route = useRoute();

const router = useRouter();
const langStore = useLangStore();
const emit = defineEmits<{
  (
    e: "search",
    filters: {
      from?: string;
      to?: string;
      departureAt?: string;
      seats?: number;
    },
  ): void;
}>();

const cityList = computed(() => {
  return Object.values(
    cities[langStore.currentLang as keyof typeof cities] || {},
  );
});
const from = ref(null);
const to = ref(null);
const dateMenu = ref(false);

const today = new Date();

const date = ref(
  route.query.departureAt
    ? String(route.query.departureAt)
    : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(today.getDate()).padStart(2, "0")}`,
);

const displayDate = ref(date.value.split("-").reverse().join("."));
watch(
  () => route.query.departureAt,
  (newDate) => {
    if (!newDate) return;
    date.value = String(newDate);
    // Обновляем и подпись в поле — иначе после смены дня чипами там старая дата
    displayDate.value = date.value.split("-").reverse().join(".");
  },
);

const passengers = ref(1);
// «1 пассажир», «3 пассажира», «5 пассажиров»
const passengersLabel = computed(
  () =>
    `${passengers.value} ${pluralize(langStore.currentLang, passengers.value, PASSENGER_FORMS)}`,
);
const increase = () => {
  if (passengers.value < 8) {
    passengers.value++;
  }
};
const decrease = () => {
  if (passengers.value > 1) {
    passengers.value--;
  }
};

const loadTrips = async () => {
  if (from.value && to.value) {
    emit("search", {
      from: langStore.cKeyByValue(from.value),
      to: langStore.cKeyByValue(to.value),
      departureAt: date.value,
      seats: passengers.value,
    });
    await router.push({
      path: "/search",
      query: {
        from: langStore.cKeyByValue(from.value),
        to: langStore.cKeyByValue(to.value),
        departureAt: date.value,
        seats: passengers.value.toString(),
      },
    });
  }
};

// Обновляем displayDate при выборе новой даты
const onDateSelected = (val: string | Date) => {
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    date.value = `${y}-${m}-${d}`;
  } else {
    date.value = val;
  }
  const [y, m, d] = date.value.split("-");
  displayDate.value = `${d}.${m}.${y}`;
  dateMenu.value = false;
};
</script>

<template>
  <div class="search-bar">
    <v-autocomplete
      v-model="from"
      :items="cityList"
      :label="langStore.t('from')"
      density="compact"
      hide-details
      variant="solo"
      class="autocompl"
    >
      <template #prepend-inner>
        <v-icon size="30" class="my-icon">mdi-map-marker</v-icon>
      </template>
    </v-autocomplete>
    <v-autocomplete
      v-model="to"
      :items="cityList"
      :label="langStore.t('to')"
      prepend-inner-icon="mdi-map-marker-outline"
      density="compact"
      hide-details
      variant="solo"
      class="autocompl"
    />

    <v-menu
      v-model="dateMenu"
      transition="scale-transition"
      :close-on-content-click="false"
      offset-y
    >
      <template #activator="{ props }">
        <v-text-field
          v-bind="props"
          v-model="displayDate"
          prepend-inner-icon="mdi-calendar"
          readonly
          hide-details
          density="compact"
          variant="solo"
          class="autocompl autocompl--date"
        />
      </template>
      <v-date-picker
        :min="new Date()"
        v-model="date"
        @update:model-value="onDateSelected"
      />
    </v-menu>

    <v-text-field
      v-model="passengersLabel"
      prepend-inner-icon="mdi-account"
      readonly
      density="compact"
      hide-details
      variant="solo"
      class="autocompl autocompl--seats"
    >
      <template #append-inner>
        <v-btn icon :disabled="passengers === 1" @click="decrease" small>
          <v-icon>mdi-minus</v-icon>
        </v-btn>
        <v-btn icon :disabled="passengers === 8" @click="increase" small>
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </template>
    </v-text-field>

    <v-btn class="search_btn" @click="loadTrips">{{
      langStore.t("search")
    }}</v-btn>
  </div>
</template>

<style scoped>
.search_btn {
  width: 151px !important;
  border-radius: 24px;
  background: linear-gradient(285.68deg, #ff8000 0%, #ffd900 100%);
  color: black;
  font-weight: 600;
  text-transform: none;
  font-size: 18px;
  height: 80px !important;
}
.autocompl {
  max-height: 80px;
  /* Ширина поля не зависит от того, что в нём написано:
     все делят строку по заданным долям, длинный текст обрезается */
  flex: 1 1 0;
  min-width: 0;
}

/* У даты и пассажиров длина текста известна — даём им постоянную ширину,
   а города делят оставшееся место поровну */
.autocompl--date {
  flex: 0 0 160px;
}

.autocompl--seats {
  flex: 0 0 286px;
}

.search-bar :deep(.v-field__input) {
  min-width: 0;
  flex-wrap: nowrap;
  overflow: hidden;
}

.search-bar :deep(.v-field__input input) {
  min-width: 0;
  text-overflow: ellipsis;
}

.search-bar :deep(.v-autocomplete__selection) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search_btn {
  flex: none;
}
.search-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 80%;
  margin: 0 auto;
}

.search-bar :deep(.v-field) {
  border-radius: 24px !important;
  background-color: white !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  display: flex;
  padding-left: 25px;
  align-items: center;
  height: 80px;
}
.search-bar :deep(.v-icon) {
  color: rgba(0, 128, 255, 1) !important;
  opacity: 1;
}
.search-bar :deep(.my-icon) {
  color: rgb(255, 0, 0) !important;
  opacity: 1;
}

.search-bar :deep(.v-input__control) {
  padding: 0 !important;
}

.search-bar :deep(.v-field__input) {
  align-items: center !important;
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

@media (max-width: 920px) {
  .search-bar {
    flex-direction: column;
    width: 90%;
  }

  .search-bar .v-text-field,
  .autocompl {
    flex: none;
    width: 100%;
    min-width: 0;
  }

  .search_btn {
    width: 100% !important;
  }
  .passengers-modal {
    margin-left: 0;
  }
}
</style>

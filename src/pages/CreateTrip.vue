<script setup lang="ts">
import { ref, computed } from "vue";
import { useLangStore } from "@/stores/langStore";
import cities from "../utils/dictionary.json";
import { mdiMapMarker, mdiSeat, mdiClockOutline, mdiCash, mdiAccount } from "@mdi/js";

const langStore = useLangStore();

const from = ref("");
const to = ref("");
const departureTime = ref<string | null>(null);
const price = ref<number | null>(null);
const availableSeats = ref<number>(1);
const description = ref("");
const instantBooking = ref(false);
const maxTwoBackSeats = ref(false);

const showMenuTime = ref(false);
const passengersMenu = ref(false);

const cityList = computed(() => {
  return Object.values(
    cities[langStore.currentLang as keyof typeof cities] || {}
  );
});

const formattedTime = computed(() => departureTime.value || "");

const increaseSeats = () => {
  if (availableSeats.value < 8) availableSeats.value++;
};
const decreaseSeats = () => {
  if (availableSeats.value > 1) availableSeats.value--;
};

const tripData = computed(() => ({
  from: from.value,
  to: to.value,
  departureTime: departureTime.value,
  price: price.value,
  availableSeats: availableSeats.value,
  description: description.value,
  instantBooking: instantBooking.value,
  maxTwoBackSeats: maxTwoBackSeats.value,
}));

const submitTrip = () => {
  if (!from.value || !to.value || !price.value || !departureTime.value) {
    alert(langStore.t("fillAllFields"));
    return;
  }

  console.log("Отправляем данные:", tripData.value);
};
</script>

<template>
    <v-sheet class="trip-card mx-auto pa-5" elevation="2" rounded="xl" max-width="600">
      <h2 class="text-h5 font-weight-medium mb-4 text-center">
        {{ langStore.t("createTrip") }}
      </h2>

      <!-- Откуда / Куда -->
      <v-row dense>
        <v-col cols="12" sm="6">
          <v-autocomplete
            v-model="from"
            :label="langStore.t('from')"
            :items="cityList"
            prepend-inner-icon="mdi-map-marker"
            variant="outlined"
            density="comfortable"
            rounded
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-autocomplete
            v-model="to"
            :label="langStore.t('to')"
            :items="cityList"
            prepend-inner-icon="mdi-map-marker"
            variant="outlined"
            density="comfortable"
            rounded
          />
        </v-col>
      </v-row>

      <!-- Время -->
      <v-text-field
        v-model="formattedTime"
        :label="langStore.t('departureTime')"
        variant="outlined"
        readonly
        density="comfortable"
        prepend-inner-icon="mdi-clock-outline"
        rounded
      >
        <v-menu
          v-model="showMenuTime"
          :close-on-content-click="false"
          activator="parent"
          min-width="0"
        >
          <v-time-picker
            color="primary"
            format="24hr"
            v-model="departureTime"
            @click:minute="showMenuTime = false"
          />
        </v-menu>
      </v-text-field>

      <!-- Цена -->
      <v-text-field
        v-model.number="price"
        :label="langStore.t('price')"
        variant="outlined"
        type="number"
        suffix="₽"
        prepend-inner-icon="mdi-cash"
        density="comfortable"
        rounded
      />

      <!-- Количество мест -->
      <v-menu
        v-model="passengersMenu"
        transition="scale-transition"
        :close-on-content-click="false"
        offset-y
      >
        <template #activator="{ props }">
          <v-text-field
            v-bind="props"
            :label="langStore.t('available')"
            :value="availableSeats"
            variant="outlined"
            prepend-inner-icon="mdi-seat"
            readonly
            density="comfortable"
            rounded
          />
        </template>

        <v-sheet class="passengers-modal pa-4">
          <h4 class="text-subtitle-1 text-center mb-3">
            {{ langStore.t("available") }}
          </h4>
          <div class="d-flex align-center justify-center gap-4">
            <v-btn icon variant="outlined" color="primary" :disabled="availableSeats === 1" @click="decreaseSeats">
              <v-icon>mdi-minus</v-icon>
            </v-btn>
            <span class="text-h6 font-weight-medium">{{ availableSeats }}</span>
            <v-btn icon variant="outlined" color="primary" :disabled="availableSeats === 8" @click="increaseSeats">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </div>
        </v-sheet>
      </v-menu>

      <!-- Описание -->
      <v-textarea
        v-model="description"
        :label="langStore.t('description')"
        variant="outlined"
        rows="3"
        auto-grow
        rounded
        class="mt-2"
      />

      <!-- Опции -->
      <v-row class="mt-2">
        <v-col cols="12" sm="6">
          <v-switch
            v-model="instantBooking"
            color="primary"
            :label="langStore.t('instant')"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-switch
            v-model="maxTwoBackSeats"
            color="primary"
            :label="langStore.t('maxTwoBackSeats')"
          />
        </v-col>
      </v-row>

      <!-- Кнопка -->
      <v-btn
        color="primary"
        block
        size="large"
        rounded="xl"
        class="mt-6 text-none font-weight-medium"
        @click="submitTrip"
      >
        <v-icon start>mdi-send</v-icon>
        {{ langStore.t("create") }}
      </v-btn>
    </v-sheet>
</template>

<style scoped lang="scss">
.create-trip-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 32px;
  background: linear-gradient(180deg, #f5f7fb 0%, #ffffff 100%);
  min-height: 100vh;
}

.trip-card {
  background-color: #fff;
  border-radius: 20px;
}

.passengers-modal {
  border-radius: 16px;
  background: #f9fafb;
  min-width: 220px;
  text-align: center;
}
.gap-4 {
  gap: 16px;
}
</style>

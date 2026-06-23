<script setup lang="ts">
import { ref, computed } from "vue";
import { useLangStore } from "@/stores/langStore";
import cities from "../utils/dictionary.json";
import { createTrip } from "@/api";
import { useSnackbarStore } from "@/stores/snackbarStore";
import { useTripStore } from "@/stores/tripStore";
const tripStore = useTripStore();
const formError = ref<string>("");
import Loading from "@/components/Loading.vue";
const props = defineProps<{
  closeDialog?: () => void;
}>();
const validationError = computed(() => {
  if (!from.value) {
    return langStore.t("selDeparture");
  }

  if (!to.value) {
    return langStore.t("selDest");
  }

  if (!price.value || price.value <= 0) {
    return langStore.t("enterPrice");
  }

  if (!departureTime.value) {
    return langStore.t("selectDepartureTime");
  }

  const departure = new Date(`${date.value}T${departureTime.value}:00`);

  if (departure <= new Date()) {
    return langStore.t("departureMustBeFuture");
  }

  return "";
});
const snackbar = useSnackbarStore();

const langStore = useLangStore();
const loading = ref<boolean>(false);

const from = ref("");
const to = ref("");
const fromAddress = ref("");
const toAddress = ref("");
const departureTime = ref<string>("");
const price = ref<number>(0);
const availableSeats = ref<number>(1);
const description = ref("");
const maxTwoBackSeats = ref(false);

const showMenuTime = ref(false);
const passengersMenu = ref(false);
const dateMenu = ref(false);

// основной формат для сервера
const date = ref(new Date().toISOString().substr(0, 10)); // YYYY-MM-DD
// отображение в текстовом поле
const displayDate = ref(date.value.split("-").reverse().join(".")); // DD.MM.YYYY

const cityList = computed(() => {
  return Object.values(
    cities[langStore.currentLang as keyof typeof cities] || {},
  );
});

const formattedTime = computed(() => departureTime.value || "");

const increaseSeats = () => {
  if (availableSeats.value < 8) availableSeats.value++;
};
const decreaseSeats = () => {
  if (availableSeats.value > 1) availableSeats.value--;
};

// Обновляем дату при выборе в календаре
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

const tripData = computed(() => ({
  from: {
    cityKey: langStore.cKeyByValue(from.value),
    address: fromAddress.value,
  },
  to: { cityKey: langStore.cKeyByValue(to.value), address: toAddress.value },
  departureAt: new Date(
    `${date.value}T${departureTime.value}:00`,
  ).toISOString(),
  price: price.value,
  availableSeats: availableSeats.value,
  description: description.value,
  maxTwoBackSeats: maxTwoBackSeats.value,
}));
const handleTime = (val: string) => {
  departureTime.value = val;

  if (val?.length === 5) {
    showMenuTime.value = false;
  }
};
const submitTrip = () => {
  formError.value = "";

  if (validationError.value) {
    formError.value = validationError.value;
    return;
  }

  loading.value = true;

  createTrip(tripData.value)
    .then((res) => {
      tripStore.addTrip(res.data.data);

      snackbar.success(langStore.t("tripCreated"));

      props.closeDialog?.();
    })
    .catch((err) => {
      console.error(err);

      formError.value = langStore.t("tripCreateError");

      snackbar.error(langStore.t("tripCreateError"));
    })
    .finally(() => {
      loading.value = false;
    });
};
</script>

<template>
  <v-sheet class="trip-card" elevation="2" rounded="xl">
    <Loading v-if="loading" />

    <div v-else>
      <h2 class="text-h5 font-weight-medium mb-4 text-center">
        {{ langStore.t("createTrip") }}
      </h2>

      <v-row dense>
        <!-- Откуда -->
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
          <v-text-field
            v-model="fromAddress"
            :label="langStore.t('addressFrom')"
            prepend-inner-icon="mdi-home-map-marker"
            variant="outlined"
            density="comfortable"
            rounded
            class="mt-2"
          />
        </v-col>

        <!-- Куда -->
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
          <v-text-field
            v-model="toAddress"
            :label="langStore.t('addressTo')"
            prepend-inner-icon="mdi-map-marker-distance"
            variant="outlined"
            density="comfortable"
            rounded
            class="mt-2"
          />
        </v-col>
      </v-row>

      <!-- Дата -->
      <v-text-field
        v-model="displayDate"
        variant="outlined"
        readonly
        density="comfortable"
        prepend-inner-icon="mdi-calendar"
        rounded
      >
        <v-menu
          v-model="dateMenu"
          transition="scale-transition"
          :close-on-content-click="false"
          activator="parent"
        >
          <v-date-picker
            :model-value="date"
            :min="new Date().toISOString().split('T')[0]"
            @update:model-value="onDateSelected"
          />
        </v-menu>
      </v-text-field>

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
            v-model="departureTime"
            format="24hr"
            color="primary"
            @update:modelValue="handleTime"
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
            <v-btn
              icon
              variant="outlined"
              color="primary"
              :disabled="availableSeats === 1"
              @click="decreaseSeats"
            >
              <v-icon>mdi-minus</v-icon>
            </v-btn>
            <span class="text-h6 font-weight-medium">{{ availableSeats }}</span>
            <v-btn
              icon
              variant="outlined"
              color="primary"
              :disabled="availableSeats === 8"
              @click="increaseSeats"
            >
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
            v-model="maxTwoBackSeats"
            color="primary"
            :label="langStore.t('maxTwoBackSeats')"
          />
        </v-col>
      </v-row>
      <div v-if="formError" class="form-error">
        <v-icon size="18">mdi-alert-circle-outline</v-icon>

        <span>{{ formError }}</span>
      </div>

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
    </div>
  </v-sheet>
</template>
<style scoped lang="scss">
.trip-card {
  background-color: #fff;
  border-radius: 20px;
  padding: 30px;
  width: 100%;
}
.form-error {
  display: flex;
  align-items: center;
  gap: 8px;

  margin-top: 12px;
  margin-bottom: 4px;

  padding: 10px 14px;

  border-radius: 12px;

  background: rgba(244, 67, 54, 0.08);
  color: #d32f2f;

  font-size: 14px;
  font-weight: 500;
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

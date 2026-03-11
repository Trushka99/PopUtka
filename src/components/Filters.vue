<script setup lang="tsx">
import { ref, computed, watch } from "vue";
import { useLangStore } from "@/stores/langStore";
const langStore = useLangStore();
const props = defineProps<{
  timeFrom: string | null;
  timeTo: string | null;
  driverGender: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  instantBookingOnly: boolean | null;
  verifiedOnly: boolean | null;
  sortBy: "cheapest" | "earliest";
  loadFilters: () => void;
}>();
const emit = defineEmits<{
  (e: "update:timeFrom", value: string | null): void;
  (e: "update:instantBookingOnly", value: boolean | null): void;
  (e: "update:verifiedOnly", value: boolean | null): void;
  (e: "update:sortBy", value: "cheapest" | "earliest"): void;
  (e: "update:timeTo", value: string | null): void;
  (e: "update:driverGender", value: string | null): void;
  (e: "update:minPrice", value: number | null): void;
  (e: "update:maxPrice", value: number | null): void;
}>();
const showMenuFrom = ref(false);
const showMenuTo = ref(false);
const localTimeFrom = ref(props.timeFrom);
watch(localTimeFrom, (val) => emit("update:timeFrom", val));

const localTimeTo = ref(props.timeTo);
watch(localTimeTo, (val) => emit("update:timeTo", val));

const localDriverGender = ref(props.driverGender);
watch(localDriverGender, (val) => emit("update:driverGender", val));

const localMinPrice = ref(props.minPrice);
watch(localMinPrice, (val) => emit("update:minPrice", val));

const localInstant = ref(props.instantBookingOnly);
watch(localInstant, (val) => emit("update:instantBookingOnly", val));

const localVerified = ref(props.verifiedOnly);
watch(localVerified, (val) => emit("update:verifiedOnly", val));

const localSortBy = ref(props.sortBy);
watch(localSortBy, (val) => emit("update:sortBy", val));

const localMaxPrice = ref(props.maxPrice);
watch(localMaxPrice, (val) => emit("update:maxPrice", val));
</script>
<template>
  <div class="filters">
    <div class="container">
      <v-container class="radios" fluid>
        <div class="flex">
          <h3 class="title">{{ langStore.t("filters") }}</h3>
          <v-icon>mdi-filter-variant</v-icon>
        </div>
        <v-radio-group hide-details v-model="localSortBy">
          <v-radio value="earliest" color="primary">
            <template #label>
              <div>{{ langStore.t("early") }}</div>
            </template>
          </v-radio>

          <v-radio value="cheapest" color="primary">
            <template #label>
              <div>{{ langStore.t("cheap") }}</div>
            </template>
          </v-radio>
        </v-radio-group>
        <v-checkbox
          density="compact"
          hide-details
          v-model="localVerified"
          color="primary"
        >
          <template #label>
            <div>{{ langStore.t("verified") }}</div>
          </template>
        </v-checkbox>

        <v-checkbox
          density="compact"
          hide-details
          v-model="localInstant"
          color="primary"
        >
          <template #label>
            <div>{{ langStore.t("instant") }}</div>
          </template>
        </v-checkbox>
      </v-container>
      <v-container class="radios" fluid>
        <div class="flex">
          <h3 class="title">{{ langStore.t("price") }}</h3>
          <v-icon>mdi-cash</v-icon>
        </div>
        <v-row justify="space-between">
          <v-col cols="6">
            <v-text-field
              :label="langStore.t('amountFrom')"
              v-model="localMinPrice"
              suffix="₽"
            ></v-text-field></v-col
          ><v-col cols="6">
            <v-text-field
              :label="langStore.t('amountTo')"
              v-model="localMaxPrice"
              suffix="₽"
            ></v-text-field></v-col
        ></v-row>
      </v-container>
      <v-container class="radios" fluid>
        <div class="flex">
          <h3 class="title">Время</h3>
          <v-icon>mdi-clock-time-four-outline</v-icon>
        </div>
        <v-row justify="space-between">
          <v-col cols="6">
            <v-text-field
              v-model="localTimeFrom"
              :label="langStore.t('timeperiodfrom')"
              readonly
            >
              <v-menu
                v-model="showMenuFrom"
                :close-on-content-click="false"
                activator="parent"
                min-width="0"
              >
                <v-time-picker
                  color="primary"
                  format="24hr"
                  v-model="localTimeFrom"
                  @click:minute="showMenuFrom = false"
                />
              </v-menu>
            </v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="localTimeTo"
              :label="langStore.t('timeperiodto')"
              readonly
            >
              <v-menu
                v-model="showMenuTo"
                :close-on-content-click="false"
                activator="parent"
                min-width="0"
              >
                <v-time-picker
                  color="primary"
                  format="24hr"
                  v-model="localTimeTo"
                  @click:minute="showMenuTo = false"
                />
              </v-menu>
            </v-text-field>
          </v-col>
        </v-row>
      </v-container>
      <v-radio-group v-model="localDriverGender" class="sex-row">
        <v-radio color="primary" value="male">
          <template #label>
            <v-icon color="pink">mdi-gender-male</v-icon>
            <div>{{ langStore.t("male") }}</div>
          </template>
        </v-radio>

        <v-radio color="primary" value="female">
          <template #label>
            <v-icon color="blue">mdi-gender-female</v-icon>
            <div>{{ langStore.t("female") }}</div>
          </template>
        </v-radio>
      </v-radio-group>
      <v-btn @click="props.loadFilters" color="info" variant="tonal">{{
        langStore.t("filter")
      }}</v-btn>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.filters {
  border-radius: 30px;
  background-color: white;
  width: 30%;
  height: 80vh;
  padding: 40px 0;
  @media (max-width: 920px) {
    width: 90%;

    margin: 0 auto;
  }
}
.title {
  font-size: 20px;
  margin-bottom: 15px;
}
.flex {
  display: flex;
  justify-content: space-between;
}
.sex {
  padding: 0;
}
.sex-row {
  display: flex;
  justify-content: space-between; /* растягиваем по краям */
  width: 100%;
}
.container {
  width: 90%;
  margin: 0 auto;
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
}
.radios {
  padding: 0;
}
</style>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import TripComponent from "@/components/TripComponent.vue";
import SearchingForm from "@/components/SearchingForm.vue";
import Filters from "@/components/Filters.vue";
import { getTrips } from "@/api";
import Loading from "@/components/Loading.vue";

const route = useRoute();
const router = useRouter();

const trips = ref<any[]>([]);
const timeFrom = ref<string | null>(null);
const timeTo = ref<string | null>(null);
const driverGender = ref<string | null>(null);
const minPrice = ref<number | null>(null);
const maxPrice = ref<number | null>(null);
const loading = ref<boolean>(false);
const instantBookingOnly = ref<boolean | null>(null);
const verifiedOnly = ref<boolean | null>(null);
const sortBy = ref<"cheapest" | "earliest">("earliest");
const loadingAfterFilters = ref<boolean>(false);
const fetchTrips = async (filters?: any) => {
  loading.value = true;
  loadingAfterFilters.value = true;
  try {
    const response = await getTrips(filters);
    trips.value = response.data?.data || [];
  } catch (err) {
    console.error("Ошибка при получении поездок:", err);
  } finally {
    loading.value = false;
    loadingAfterFilters.value = false;
  }
};
const loadWithFilters = async (filters?: any) => {
  loadingAfterFilters.value = true;
  try {
    const response = await getTrips(filters);
    trips.value = response.data?.data || [];
  } catch (err) {
    console.error("Ошибка при получении поездок:", err);
  } finally {
    loadingAfterFilters.value = false;
  }
};
const applyFilters = () => {
  loadWithFilters({
    from: route.query.from as string,
    to: route.query.to as string,
    departureAt: route.query.departureAt as string,
    seats: route.query.seats ? Number(route.query.seats) : undefined,
    timeFrom: timeFrom.value,
    timeTo: timeTo.value,
    driverGender: driverGender.value,
    minPrice: minPrice.value,
    maxPrice: maxPrice.value,
    instantBookingOnly: instantBookingOnly.value,
    verifiedOnly: verifiedOnly.value,
    sortBy: sortBy.value,
  });
};

onMounted(() => {
  const filters = {
    from: route.query.from as string,
    to: route.query.to as string,
    departureAt: route.query.departureAt as string,
    seats: route.query.seats ? Number(route.query.seats) : undefined,
  };
  fetchTrips(filters);
});

const handleSearch = (filters: any) => {
  router.push({ path: "/search", query: filters });
  fetchTrips(filters);
};
</script>

<template>
  <Loading v-if="loading" />

  <div v-else>
    <div class="searching">
      <SearchingForm @search="handleSearch" />
    </div>

    <div class="trip-list">
      <Filters
        :load-filters="applyFilters"
        v-model:timeFrom="timeFrom"
        v-model:timeTo="timeTo"
        v-model:driverGender="driverGender"
        v-model:minPrice="minPrice"
        v-model:maxPrice="maxPrice"
        v-model:instant-booking-only="instantBookingOnly"
        v-model:verified-only="verifiedOnly"
        v-model:sortBy="sortBy"
      />
      <div class="trip-list__trips">
        <TripComponent
          v-for="(item, index) in trips"
          :key="index"
          :trip="item"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.trip-list {
  margin: 0 auto;
  padding: 40px 0;
  display: flex;
  justify-content: center;
  background-color: rgb(241, 239, 239);
}

.trip-list__trips {
  width: 50%;
  padding-bottom: 25px;
}

.searching {
  margin: 30px 0;
}

@media (max-width: 920px) {
  .trip-list {
    flex-direction: column;
    gap: 50px;
  }
  .trip-list__trips {
    width: 100%;
  }
}
</style>

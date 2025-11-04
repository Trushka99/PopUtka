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
const loading = ref<boolean>(false);

const fetchTrips = async (filters?: any) => {
  loading.value = true;
  try {
    const response = await getTrips(filters);
    trips.value = response.data?.data || [];
  } catch (err) {
    console.error("Ошибка при получении поездок:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  const filters = {
    from: route.query.from as string,
    to: route.query.to as string,
    date: route.query.date as string,
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
      <Filters />
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

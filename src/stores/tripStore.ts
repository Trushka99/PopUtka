import { defineStore } from "pinia";
import { ref } from "vue";
import { getTrips } from "@/api";

export const useTripStore = defineStore("trip", () => {
  const trips = ref<any[]>([]);

  const fetchTrips = async () => {
    const response = await getTrips({
      departureAt: new Date().toISOString().split("T")[0],
    });
    trips.value = response.data?.data || [];
  };

  const addTrip = (trip: any) => {
    trips.value.unshift(trip);
  };

  return { trips, fetchTrips, addTrip };
});

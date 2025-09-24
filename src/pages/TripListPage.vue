<script setup lang="ts">
import TripComponent from "@/components/TripComponent.vue";
import SearchingForm from "@/components/SearchingForm.vue";
import Filters from "@/components/Filters.vue";
const trips: any = [
  {
    departure: "Москва",
    arrival: "Киев",
    price: 19000,
    duration: "8 часов",
    departureTime: "19:30",
    arrivalTime: "25:30",
    seatsAvailable: 9,
    driver: {
      avatar:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwjvv_gWyyWWlFgnGJ1L8hfSpnYAaWmWiqAg&s",
      name: "Futa DOM",
      rating: 5,
      varified: true,
    },
    instantBooking: true,
    maxTwoBackSeats: true,
  },
  {
    departure: "Москва",
    arrival: "Киев",
    price: 19000,
    duration: "8 часов",
    departureTime: "19:30",
    arrivalTime: "25:30",
    seatsAvailable: 9,
    driver: {
      avatar:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwjvv_gWyyWWlFgnGJ1L8hfSpnYAaWmWiqAg&s",
      name: "Futa DOM",
      rating: 5,
      varified: true,
    },
    instantBooking: true,
    maxTwoBackSeats: true,
  },
  {
    departure: "Москва",
    arrival: "Киев",
    price: 19000,
    duration: "8 часов",
    departureTime: "19:30",
    arrivalTime: "25:30",
    seatsAvailable: 9,
    driver: {
      avatar:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwjvv_gWyyWWlFgnGJ1L8hfSpnYAaWmWiqAg&s",
      name: "Futa DOM",
      rating: 5,
      varified: true,
    },
    instantBooking: true,
    maxTwoBackSeats: true,
  },
];
</script>
<template>
  <div class="searching">
    <SearchingForm />
  </div>
  <div class="trip-list">
    <Filters />
    <div class="trip-list__trips">
      <TripComponent v-for="(item, index) in trips" :key="index" :trip="item" />
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
  justify-self: end;
}
.searching {
  margin: 30px 0;
}
@media (max-width: 920px) {
  .trip-list__trips {
    width: 100%;
  }
}
</style>

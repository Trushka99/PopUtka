<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useLangStore } from "@/stores/langStore";
interface Driver {
  avatar: string;
  name: string;
  rating: number;
  verified: boolean;
}
const langStore = useLangStore();
interface Trip {
  departure: string;
  arrival: string;
  price: number;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  seatsAvailable: number;
  driver: Driver;
  instantBooking?: boolean;
  maxTwoBackSeats?: boolean;
}

const { trip } = defineProps<{ trip: Trip }>();
console.log(trip);
const date = new Date(trip.departureTime);
const hours = date.getHours().toString().padStart(2, "0");
const minutes = date.getMinutes().toString().padStart(2, "0");
</script>

<template>
  <RouterLink class="link" to="/tripMock">
    <v-card class="trip-card pa-4 mb-4" elevation="2" rounded="lg">
      <!-- Верхняя часть: время и цена -->

      <div class="time-line d-flex justify-space-between mb-2">
        <div class="time-route">
          <div class="trip_progress">
            <span class="time">{{ `${hours}:${minutes}` }}</span>
            <div class="line left"></div>
            <span class="duration">{{ trip.duration }}</span>
            <div class="line right"></div>
            <span class="time">{{ trip.arrivalTime }}</span>
          </div>
          <div class="location mt-1">
            <strong>{{ trip.departure }}</strong>
            <span class="mx-1">→</span>
            <strong>{{ trip.arrival }}</strong>
          </div>
        </div>
        <div class="price text-h5 font-weight-bold">
          {{ trip.price.toLocaleString() }} ₽
        </div>
      </div>

      <v-divider class="my-3"></v-divider>

      <!-- Нижняя часть: водитель и условия -->
      <div class="d-flex align-center">
        <v-icon icon="mdi-car" size="24" class="mr-2" />

        <v-avatar size="40" class="mr-3">
          <img :src="trip.driver.avatar" alt="Driver" />
        </v-avatar>

        <div class="driver-info flex-grow-1">
          <span class="font-weight-medium">{{ trip.driver.name }}</span>
          <span class="ml-1">★ {{ trip.driver.rating }}</span>
        </div>

        <div class="conditions d-flex align-center">
          <v-icon
            v-if="trip.instantBooking"
            icon="mdi-flash"
            size="20"
            class="mr-1"
          />
          <span v-if="trip.instantBooking" class="mr-4 text-caption">{{
            langStore.t("verified")
          }}</span>

          <v-icon
            v-if="trip.maxTwoBackSeats"
            icon="mdi-account-multiple"
            size="20"
            class="mr-1"
          />
          <span v-if="trip.maxTwoBackSeats" class="text-caption">{{
            langStore.t("instant")
          }}</span>
        </div>
      </div>
    </v-card></RouterLink
  >
</template>

<style lang="scss" scoped>
.link {
  text-decoration: none;
}
.trip-card {
  border-radius: 12px;
  width: 90%;
  margin: 0 auto;
  background-color: #fff;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border 0.3s ease;
  &:hover {
    border: 2px solid rgb(0, 174, 255);
  }
  font-family: "Roboto", sans-serif;
  .time-route {
    width: 80%;
  }
  .trip_progress {
    display: flex;
    width: 100%;
    align-items: center;
  }
  .line {
    flex: 1;
    height: 2px;
    background-color: #00414d;
    position: relative;
    margin: 0 8px;
    width: 100%;
  }
  .line.left::before {
    top: 50%;
    left: 0;
    content: "";
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: #00414d;
    border-radius: 50%;
    transform: translateY(-50%);
  }

  .line.right::after {
    top: 50%;
    right: 0;
    content: "";
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: #00414d;
    border-radius: 50%;
    transform: translateY(-50%);
  }

  .time {
    font-weight: bold;
    font-size: 16px;
  }

  .duration {
    font-size: 14px;
    color: #888;
  }

  .location {
    font-size: 14px;
    color: #333;
  }

  .price {
    color: #003366;
  }

  .driver-info {
    font-size: 14px;
  }

  .conditions {
    font-size: 12px;
    color: #666;
  }
}
@media (max-width: 920px) {
  .time-line {
    flex-direction: column;
    align-items: start;
    justify-content: start;
  }
}
</style>

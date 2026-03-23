<script setup lang="ts">
import { computed } from "vue";
import { useLangStore } from "@/stores/langStore";
import { useRouter } from "vue-router";
const router = useRouter();
const langstore = useLangStore();
interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  avatar: string;
  rating: number;
  isVerified: boolean;
  car: {
    year: number;
    color: string;
    model: string;
    photos: string[];
    licensePlate: string;
  };
  gender: string;
}

interface TripExample {
  id: number;
  driverId: number;
  from: { address: string; cityKey: string };
  to: { address: string; cityKey: string };
  departureAt: string;
  price: number;
  availableSeats: number;
  description: string;
  instantBooking: boolean;
  maxTwoBackSeats: boolean;
  status: string;
  tripInfo: any;
  createdAt: string;
  updatedAt: string;
  driver: Driver;
}

const props = defineProps<{
  trip: TripExample;
}>();
const goToTrip = () => {
  router.push({ name: "search", params: { id: props.trip.id } });
};
const avatarUrl = computed(() =>
  props.trip.driver.avatar
    ? `https://api.pop-utka.uz${props.trip.driver.avatar}`
    : null,
);
console.log(props.trip);
</script>

<template>
  <v-card class="trip-card" elevation="3">
    <!-- Верхняя часть с маршрутом и ценой -->
    <v-card-title class="trip-header">
      <span>{{ langstore.с(props.trip.from.cityKey.toLowerCase()) }}</span>
      <div class="arrow"></div>
      <span>{{ langstore.с(props.trip.to.cityKey.toLowerCase()) }}</span>
    </v-card-title>

    <!-- Информация о поездке -->
    <v-card-text class="trip-info">
      <div class="trip-flex">
        <div class="trip-column">
          <div class="trip-item">
            <v-icon size="24" color="blue">mdi-calendar</v-icon>
            <span class="trip-text"
              >{{
                new Date(props.trip.departureAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              }}
              {{
                new Date(props.trip.departureAt).toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }}</span
            >
          </div>

          <div class="trip-item">
            <v-icon size="24" color="blue">mdi-account-group</v-icon>
            <span class="trip-text"
              >{{ props.trip.availableSeats }}
              {{ langstore.t("available") }}</span
            >
          </div>

          <div class="trip-item">
            <v-icon size="24" color="blue">mdi-car</v-icon>
            <span class="trip-text">{{
              props.trip.driver.car
                ? `${props.trip.driver.car.model} - ${props.trip.driver.car.color}`
                : "Информация отсутствует"
            }}</span>
          </div>
        </div>
        <span class="price">{{ props.trip.price }} UZS</span>
      </div>
    </v-card-text>

    <v-divider></v-divider>

    <!-- Информация о водителе -->
    <v-card-text class="driver-info">
      <v-avatar size="32">
        <img class="avatar" v-if="avatarUrl" :src="avatarUrl" alt="Driver" />
        <span v-else="!props.trip.driver.avatar" class="driver-text">{{
          props.trip.driver.firstName[0]
        }}</span>
      </v-avatar>
      <span class="driver-text">{{ props.trip.driver.firstName }}</span>
      <div class="rating">
        <v-icon size="large" style="color: rgba(255, 200, 0, 1)"
          >mdi-star</v-icon
        >
        <span class="rating-value">{{ props.trip.driver.rating }}</span>
      </div>
      <v-card-actions>
        <v-btn
          block
          color="blue"
          class="trip_btn"
          rounded="lg"
          @click="goToTrip"
        >
          {{ langstore.t("more") }}
        </v-btn>
      </v-card-actions>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.trip-card {
  border-radius: 12px;
}
.driver-info {
  width: 90%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
}
.avatar {
  width: 50px;
  height: 50px;
  object-fit: cover;
}
.arrow {
  position: relative;
  width: 56px;
  height: 8px;
  background: linear-gradient(
    to right,
    rgba(0, 122, 255, 0) 0%,
    rgba(0, 122, 255, 0.4) 30%,
    #007aff 100%
  );
  border-radius: 4px;
}

.arrow::after {
  content: "";
  position: absolute;
  right: -2px;
  top: 50%;
  width: 16px;
  height: 16px;
  border-top: 4px solid #007aff;
  border-right: 4px solid #007aff;
  transform: translateY(-50%) rotate(45deg);
  border-radius: 2px;
}

.driver-text {
  font-size: 16px;
  font-weight: 600;
}
.trip_btn {
  text-transform: none;
  font-size: 16px;
  font-weight: 600;
}
.rating {
  display: flex;
  align-items: center;
  margin-right: auto;
}
.trip-header {
  display: flex;
  gap: 18px;
  font-weight: bold;
  align-items: center;
  font-size: 20px;
  padding: 40px;
}
.trip-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.trip-text {
  font-size: 16px;
}
.price {
  color: #ff6d00;
  align-self: end;
  font-size: 20px;
  font-weight: bold;
}
.trip-flex {
  display: flex;
  justify-content: space-between;
  width: 90%;
  margin: 0 auto;
}

.trip-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.driver-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  height: 36px;
}

.rating-value {
  font-size: 16px;
}
</style>

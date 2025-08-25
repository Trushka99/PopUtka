<script setup lang="ts">
import { ref } from "vue";

const trip = ref({
  from: "Ташкент",
  to: "Самарканд",
  price: "150,000 UZS",
  date: "2023-06-25 08:00",
  seats: 3,
  car: "Chevrolet Spark",
  driver: "Азиз",
  rating: 1,
});
</script>

<template>
  <v-card class="trip-card" elevation="3">
    <!-- Верхняя часть с маршрутом и ценой -->
    <v-card-title class="trip-header">
      <span>{{ trip.from }} → {{ trip.to }}</span>
      <span class="price">{{ trip.price }}</span>
    </v-card-title>

    <v-divider></v-divider>

    <!-- Информация о поездке -->
    <v-card-text class="trip-info">
      <div class="trip-item">
        <v-icon size="18" color="blue">mdi-calendar</v-icon>
        <span>{{ trip.date }}</span>
      </div>

      <div class="trip-item">
        <v-icon size="18" color="blue">mdi-account-group</v-icon>
        <span>{{ trip.seats }} свободных места</span>
      </div>

      <div class="trip-item">
        <v-icon size="18" color="blue">mdi-car</v-icon>
        <span>{{ trip.car }}</span>
      </div>
    </v-card-text>

    <v-divider></v-divider>

    <!-- Информация о водителе -->
    <v-card-text class="driver-info">
      <v-avatar color="blue" size="32">
        <span class="text-white">{{ trip.driver[0] }}</span>
      </v-avatar>
      <span class="driver-name">{{ trip.driver }}</span>
      <div class="driver-rating">
        <div>
          <v-rating
            v-model="trip.rating"
            color="amber"
            density="compact"
            half-increments
            readonly
            size="18"
          />
        </div>
        <span class="rating-value">{{ trip.rating }}</span>
      </div>
    </v-card-text>

    <!-- Кнопка Подробнее -->
    <v-card-actions>
      <v-btn block color="blue" class="text-white" rounded="lg">
        Подробнее
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style lang="scss" scoped>
.trip-card {
  border-radius: 12px;
}

.trip-header {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: 16px;
}

.price {
  color: #ff6d00;
}

.trip-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.trip-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.driver-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  height: 64px;
}

.driver-name {
  font-weight: bold;
  font-size: 14px;
}

.driver-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  height: 36px;
}

.rating-value {
  font-weight: bold;
  color: #ff6d00;
  font-size: 16px;
}
</style>

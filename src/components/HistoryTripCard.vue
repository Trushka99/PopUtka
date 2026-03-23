<script setup lang="ts">
import { useLangStore } from "@/stores/langStore";
import { ref } from "vue";
import TripReview from "./TripReview.vue";
const langStore = useLangStore();
interface Trip {
  to: {
    address: string;
    cityKey: string;
  };
  from: {
    address: string;
    cityKey: string;
  };
  role: string;
  price: number;
  status: string;
  tripId: string;
  passengers: {
    id: string;
    seats: number;
    avatar: string | null;
    lastName: string;
    firstName: string;
  }[];
  completedAt: string;
  departureAt: string;
}

const { trip } = defineProps<{ trip: Trip }>();
console.log(trip);
const showReview = ref(false);

const handleReview = (data: any) => {
  console.log("Отзыв:", data);

  // сюда отправка на бэк
};
</script>

<template>
  <v-card class="ticket-card mb-4" elevation="0">
    <div class="ticket-inner">
      <div class="top">
        <span class="time">{{
          new Date(trip.departureAt).toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          })
        }}</span>
        <span class="dash"></span>
        <span class="time">{{
          new Date(trip.completedAt).toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          })
        }}</span>
      </div>

      <div class="cities">
        <strong>{{ langStore.с(trip.from.cityKey.toLowerCase()) }}</strong>
        <span class="big-arrow">→</span>
        <strong>{{ langStore.с(trip.to.cityKey) }}</strong>
      </div>

      <div class="info">
        <span class="date">
          {{ new Date(trip.departureAt).toLocaleDateString("ru-RU") }}
        </span>
        <v-btn class="review-btn" @click="showReview = true">
          Оставить отзыв
        </v-btn>
      </div>
    </div>

    <div class="perforation"></div>
    <TripReview :trip="trip" v-model="showReview" @submit="handleReview" />
  </v-card>
</template>

<style scoped lang="scss">
.ticket-card {
  background: linear-gradient(145deg, #e6f6ff, #f9fdff);
  border-radius: 20px;
  border: 1px solid #b7e8ff;
  box-shadow: 0 8px 24px rgba(0, 90, 130, 0.12);
  position: relative;
  overflow: hidden;

  .ticket-inner {
    padding: 20px 24px;
  }

  .top {
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    .time {
      font-size: 16px;
      font-weight: 600;
      color: #004d60;
    }

    .dash {
      flex: 1;
      height: 2px;
      background: repeating-linear-gradient(
        to right,
        #8ecfe6,
        #8ecfe6 6px,
        transparent 6px,
        transparent 12px
      );
      margin: 0 12px;
    }
  }

  .cities {
    margin: 12px 0;
    font-size: 20px;
    display: flex;
    align-items: center;
    color: #003d52;

    .big-arrow {
      margin: 0 10px;
      font-size: 24px;
      color: #009fd4;
      font-weight: bold;
    }
  }

  .info {
    font-size: 14px;
    color: #336a7a;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .review-btn {
      background: linear-gradient(135deg, #90d6f7, #5eb8e5);
      color: #004d60;
      font-weight: 600;
      text-transform: uppercase;
      border-radius: 12px;
      padding: 8px 18px;
      box-shadow: 0 4px 12px rgba(30, 100, 140, 0.15);
      transition: all 0.25s ease;

      &:hover {
        background: linear-gradient(135deg, #a0e0fc, #6fc2eb);
        box-shadow: 0 6px 16px rgba(30, 110, 150, 0.2);
        transform: translateY(-2px);
      }

      &:active {
        transform: translateY(0);
        box-shadow: 0 3px 8px rgba(30, 90, 130, 0.2);
      }
    }
  }

  .perforation {
    height: 18px;
    background: radial-gradient(circle, transparent 40%, #c2edff 45%);
    background-size: 12px 12px;
    background-repeat: repeat-x;
  }
}
</style>

<script setup lang="ts">
import { useLangStore } from "@/stores/langStore";
const langStore = useLangStore();
interface Trip {
  id: number;
  from: { cityKey: string; address: string };
  to: { cityKey: string; address: string };
  departureDate: string;
  departureTime: string;
  tripInfo: { duration: number };
  bookings?: any;
}

const { trip } = defineProps<{ trip: Trip }>();
console.log(trip);
function formatDuration(minutes: number) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs === 0 ? `${mins} мин` : `${hrs} ч ${mins} мин`;
}

function addDurationToTime(timeStr: string, durationMinutes: number) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const total = hours * 60 + minutes + durationMinutes;
  const newHours = Math.floor((total / 60) % 24);
  const newMinutes = total % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(
    2,
    "0",
  )}`;
}
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
        <span class="time">
          {{
            addDurationToTime(
              new Date(trip.departureAt).toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              trip.tripInfo.duration,
            )
          }}
        </span>
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
        <span class="duration">{{
          formatDuration(trip.tripInfo.duration)
        }}</span>
      </div>
    </div>

    <div class="perforation"></div>
  </v-card>
</template>

<style scoped lang="scss">
.ticket-card {
  background: linear-gradient(135deg, #e9f7ff, #f4fbff);
  border-radius: 18px;
  border: 1px solid #b7e8ff;
  position: relative;
  overflow: hidden;

  .ticket-inner {
    padding: 18px 20px;
  }

  .top {
    display: flex;
    align-items: center;

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
    margin: 14px 0;
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
  }

  .perforation {
    height: 18px;
    background: radial-gradient(circle, transparent 40%, #c2edff 45%);
    background-size: 12px 12px;
    background-repeat: repeat-x;
  }
}
</style>

<script setup lang="ts">
import { computed, ref } from "vue";
import PayForm from "./PayForm.vue";
import { useLangStore } from "@/stores/langStore";
import {
  confirmBooking,
  rejectBooking,
  completeTrip,
  createPayment,
} from "@/api";
import { RouterLink } from "vue-router";
import PayButton from "./PayButton.vue";
import PayClickButton from "./PayClickButton.vue";
import type { TTripCard, TripCoordinates, Location } from "@/utils/types";
const sheet = ref();
const openSheet = () => {
  sheet.value.open();
};

const langStore = useLangStore();
const { trip } = defineProps<{ trip: TTripCard }>();
console.log(trip.data);
// Базовая поездка
const baseTrip = computed(() =>
  trip.type === "booking" ? trip.data.trip : trip.data,
);

// Проверка типа локации
const isLocation = (loc: Location | TripCoordinates): loc is Location =>
  "cityKey" in loc;

// Список бронирований (если trip)
const bookings = computed(() =>
  trip.type === "trip" ? trip.data.bookings : [],
);

const canFinishTrip = computed(
  () =>
    trip.type === "trip" &&
    trip.data.role === "driver" &&
    trip.data.status !== "completed",
);

// Методы
const finishTrip = async (id: string) => {
  try {
    const response = await completeTrip(id);
    const data = await response.json();

    if (!response.ok) {
      console.error("Ошибка завершения поездки:", data.message);
      return;
    }

    console.log("Поездка завершена:", data);
  } catch (err) {
    console.error("Сетевая ошибка при завершении поездки:", err);
  }
};

const confTrip = async (id: string) => {
  if (trip.data.status === "created") {
    openSheet();
    return;
  }
  try {
    const res = await confirmBooking(id);
    console.log("Бронь подтверждена:", res);
  } catch (err) {
    console.error(err);
  }
};

const rejTrip = async (id: string) => {
  try {
    const res = await rejectBooking(id);
    console.log("Бронь отклонена:", res);
  } catch (err) {
    console.error(err);
  }
};

// Утилиты
const formatDuration = (minutes: number) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs === 0
    ? `${mins} ${langStore.t("min")}`
    : `${hrs} ${langStore.t("hours")} ${mins} ${langStore.t("min")}`;
};

const addDurationToTime = (timeStr: string, durationMinutes: number) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const total = hours * 60 + minutes + durationMinutes;
  const newHours = Math.floor((total / 60) % 24);
  const newMinutes = total % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
};

// Вычисляемые даты/время для шаблона
const departureTime = computed(() =>
  new Date(baseTrip.value.departureAt).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }),
);

const arrivalTime = computed(() =>
  addDurationToTime(departureTime.value, baseTrip.value.tripInfo.duration),
);

const departureDate = computed(() =>
  new Date(baseTrip.value.departureAt).toLocaleDateString("ru-RU"),
);
</script>

<template>
  <v-card class="ticket-card mb-4" elevation="0">
    <div class="ticket-inner">
      <div class="top">
        <span class="time">{{ departureTime }}</span>
        <span class="dash"></span>
        <span class="time">{{ arrivalTime }}</span>
      </div>

      <v-row align="center" style="gap: 16px; width: 99.8%; margin: 0 auto">
        <div class="cities">
          <strong v-if="isLocation(baseTrip.from)">{{
            langStore.с(baseTrip.from.cityKey)
          }}</strong>
          <span class="big-arrow">→</span>
          <strong v-if="isLocation(baseTrip.to)">{{
            langStore.с(baseTrip.to.cityKey)
          }}</strong>
        </div>

        <RouterLink
          v-if="trip.type === 'trip' && trip.data.role != 'driver'"
          class="link"
          :to="{ name: 'bookings', params: { id: trip.data.id } }"
        >
          <v-chip class="my-booking-chip centered" prepend-icon="mdi-ticket"
            >Перейти к брони</v-chip
          >
        </RouterLink>
      </v-row>

      <div class="info">
        <span class="date">{{ departureDate }}</span>
        <span class="duration">{{
          formatDuration(baseTrip.tripInfo.duration)
        }}</span>
        <div class="actions" v-if="canFinishTrip">
          <v-btn block class="finish-btn" @click="finishTrip(baseTrip.id)">
            {{ langStore.t("complete") }}
          </v-btn>
        </div>
      </div>
    </div>

    <div class="perforation"></div>
    <div class="bookings">
      <div v-for="b in bookings" :key="b.id">
        <RouterLink
          class="link"
          :to="{ name: 'bookings', params: { id: b.id } }"
        >
          <div class="booking">
            <v-avatar size="56" class="mr-3 avatar">
              <v-img
                v-if="b.passenger.avatar"
                :src="`https://api.pop-utka.uz${b.passenger.avatar}`"
              />
              <span v-else class="text-h6">
                {{ b.passenger.firstName[0].toUpperCase() }}
              </span>
            </v-avatar>
            <div>
              <h3>{{ b.passenger.firstName }}</h3>
              <h5>{{ b.status }}</h5>
            </div>
          </div>
        </RouterLink>
        <div v-if="b.status === 'pending'">
          <v-btn @click="confTrip(b.id)" class="confirm">{{
            langStore.t("accept")
          }}</v-btn>
          <v-btn @click="rejTrip(b.id)" class="reject">{{
            langStore.t("reject")
          }}</v-btn>
        </div>

        <v-chip
          v-else
          color="success"
          variant="tonal"
          prepend-icon="mdi-check-circle"
          class="status-chip confirmed"
        >
          Подтверждено
        </v-chip>
      </div>
    </div>
  </v-card>
  <PayForm ref="sheet" :trip="trip" />
</template>

<style scoped lang="scss">
.actions {
  padding: 12px 0 0;
}
.link {
  text-decoration: none;
}
.avatar {
  border: 1px solid rgba(0, 0, 0, 0.2); /* мягкий контур */
  background-color: #d0ebff; /* светлый голубой фон */
  color: #1a1a1a; /* буква внутри — тёмная для контраста */
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border-radius: 50%;
}
.finish-btn {
  width: 100%;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  text-transform: uppercase;
  color: #004d60; // тёмно-голубой текст
  background: linear-gradient(
    135deg,
    rgba(135, 207, 240, 0.8),
    // светло-голубой
    rgba(128, 203, 235, 0.9) // чуть насыщеннее
  );
  box-shadow: 0 4px 12px rgba(30, 90, 130, 0.15);
  border: 1px solid rgba(100, 180, 210, 0.5);
  transition: all 0.25s ease;

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(150, 220, 245, 0.85),
      rgba(135, 210, 240, 0.9)
    );
    box-shadow: 0 6px 18px rgba(30, 100, 140, 0.2);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 3px 8px rgba(30, 90, 130, 0.2);
  }
}
.status-chip.confirmed {
  background: linear-gradient(
    135deg,
    rgba(120, 200, 230, 0.35),
    rgba(90, 170, 210, 0.35)
  );
  width: 100%;
  color: #0b5c75;
  display: flex;
  justify-content: center;
  border: 1px solid rgba(120, 190, 220, 0.6);

  box-shadow:
    0 4px 10px rgba(40, 120, 160, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);

  font-weight: 600;
  letter-spacing: 0.3px;
  border-radius: 10px;

  .v-icon {
    color: #0f6f8f;
  }
}
.ticket-card::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -10px;
  width: 100%;
  height: 20px;

  background: radial-gradient(
      circle at 10px 10px,
      #ffffff 9px,
      transparent 10px
    )
    repeat-x;

  background-size: 34px 30px;
}
.bookings {
  margin-top: 18px;
  padding: 12px 16px;

  display: flex;
  gap: 12px;
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c9d6df;
    border-radius: 4px;
  }
  .v-btn {
    margin-top: 6px;
    margin-right: 6px;
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    border-radius: 10px;
    transition: all 0.25s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    border: none;
  }

  /* Подтвердить — мягкий лазурный */
  .v-btn.confirm {
    background: linear-gradient(
      135deg,
      rgba(64, 179, 225, 0.85),
      rgba(48, 150, 200, 0.85)
    );
    color: #fff;
    box-shadow: 0 4px 10px rgba(0, 70, 100, 0.15);

    &:hover {
      background: linear-gradient(
        135deg,
        rgba(70, 190, 235, 0.9),
        rgba(52, 160, 210, 0.9)
      );
      box-shadow: 0 6px 14px rgba(0, 80, 120, 0.2);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 3px 8px rgba(0, 70, 100, 0.12);
    }
  }

  /* Отклонить — мягкий персиково-розовый */
  .v-btn.reject {
    background: linear-gradient(
      135deg,
      rgba(255, 145, 130, 0.85),
      rgba(255, 120, 110, 0.85)
    );
    color: #fff;
    box-shadow: 0 4px 10px rgba(180, 60, 60, 0.15);

    &:hover {
      background: linear-gradient(
        135deg,
        rgba(255, 155, 140, 0.9),
        rgba(255, 130, 115, 0.9)
      );
      box-shadow: 0 6px 14px rgba(180, 70, 70, 0.2);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 3px 8px rgba(180, 60, 60, 0.12);
    }
  }
}
.booking {
  display: flex;
  align-items: center;
  gap: 14px;

  padding: 12px 14px;
  margin-bottom: 10px;

  background: linear-gradient(
    180deg,
    rgba(235, 248, 255, 0.9),
    rgba(215, 238, 248, 0.9)
  );

  border-radius: 14px;
  border: 1px solid rgba(150, 200, 225, 0.6);

  backdrop-filter: blur(6px);

  box-shadow:
    0 6px 14px rgba(30, 80, 110, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);

  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow:
      0 10px 22px rgba(30, 80, 110, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }

  h3 {
    font-size: 15px;
    margin: 0;
    color: #003d52;
    font-weight: 600;
  }

  h5 {
    font-size: 11px;
    margin-top: 2px;
    color: #0b7285;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
}
.ticket-card {
  background: linear-gradient(
    180deg,
    rgba(135, 207, 240, 0.699),
    rgba(128, 203, 235, 0.658)
  );

  border-radius: 18px;
  border: 1px solid rgba(160, 200, 220, 0.6);
  border-bottom: none;

  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
  padding-bottom: 22px;

  box-shadow:
    0 12px 28px rgba(30, 80, 110, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
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

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { useLangStore } from "@/stores/langStore";
import {
  SEAT_FORMS,
  addMinutes,
  cityName,
  formatPrice,
  formatRating,
  initialsOf,
  mediaUrl,
  pluralize,
  timeOf,
} from "@/utils/tripFormat";

interface Driver {
  avatar: string | null;
  firstName: string;
  lastName: string;
  rating: number;
  isVerified?: boolean;
  car?: { brand?: string; model?: string; color?: string } | null;
}

interface Trip {
  id: number | string;
  from: { cityKey: string; address: string };
  to: { cityKey: string; address: string };
  price: number;
  departureAt: string;
  availableSeats?: number;
  maxTwoBackSeats?: boolean;
  tripInfo?: { distance?: number; duration?: number };
  driver: Driver;
}

const { trip } = defineProps<{ trip: Trip }>();
const langStore = useLangStore();
const route = useRoute();
// Сколько мест искали — столько и предложим забронировать на странице поездки
const tripLink = computed(() => ({
  name: "search",
  params: { id: String(trip.id) },
  query: route.query.seats ? { seats: String(route.query.seats) } : {},
}));
const t = (key: string) => langStore.t(key);

const duration = computed(() => Number(trip.tripInfo?.duration ?? 0));
const departure = computed(() => timeOf(trip.departureAt));
const arrival = computed(() =>
  timeOf(addMinutes(trip.departureAt, duration.value)),
);
const durationText = computed(() => {
  const hrs = Math.floor(duration.value / 60);
  const mins = Math.round(duration.value % 60);
  return hrs === 0
    ? `${mins} ${t("min")}`
    : `${hrs} ${t("hours")} ${mins} ${t("min")}`;
});

const fromCity = computed(() => cityName(trip.from, (k) => langStore.с(k)));
const toCity = computed(() => cityName(trip.to, (k) => langStore.с(k)));

const seats = computed(() => Number(trip.availableSeats ?? 0));
const seatsChip = computed(() => {
  if (seats.value <= 0) return { text: t("no_seats"), tone: "none" };
  if (seats.value === 1) return { text: t("seats_left_one"), tone: "hot" };
  return {
    text: `${seats.value} ${pluralize(langStore.currentLang, seats.value, SEAT_FORMS)}`,
    tone: "ok",
  };
});

const driverName = computed(() => {
  const d = trip.driver;
  if (!d) return "";
  return `${d.firstName ?? ""} ${d.lastName?.[0] ? `${d.lastName[0]}.` : ""}`.trim();
});

const carText = computed(() => {
  const car = trip.driver?.car;
  if (!car) return "";
  return [[car.brand, car.model].filter(Boolean).join(" "), car.color]
    .filter(Boolean)
    .join(" · ");
});
</script>

<template>
  <RouterLink class="trip" :to="tripLink">
    <div class="trip__top">
      <div class="trip__route">
        <div class="trip__point">
          <div class="trip__time">{{ departure }}</div>
          <div class="trip__city">{{ fromCity }}</div>
          <div v-if="trip.from?.address" class="trip__addr">
            {{ trip.from.address }}
          </div>
        </div>

        <div class="trip__line">
          <span v-if="duration" class="trip__duration">
            <v-icon size="13">mdi-car-side</v-icon>
            {{ durationText }}
          </span>
        </div>

        <div class="trip__point trip__point--end">
          <div class="trip__time">{{ duration ? arrival : "" }}</div>
          <div class="trip__city">{{ toCity }}</div>
          <div v-if="trip.to?.address" class="trip__addr">
            {{ trip.to.address }}
          </div>
        </div>
      </div>

      <div class="trip__price">
        <div class="trip__price-value">{{ formatPrice(trip.price) }}</div>
        <div class="trip__price-unit">UZS · {{ t("per_seat") }}</div>
      </div>
    </div>

    <div class="trip__bottom">
      <v-avatar size="36" class="trip__avatar">
        <v-img
          v-if="trip.driver?.avatar"
          :src="mediaUrl(trip.driver.avatar)"
          cover
        />
        <span v-else>{{
          initialsOf(trip.driver?.firstName, trip.driver?.lastName)
        }}</span>
      </v-avatar>

      <div class="trip__driver">
        <div class="trip__driver-row">
          <span class="trip__driver-name">{{ driverName }}</span>
          <span class="trip__rating">
            <v-icon size="13">mdi-star</v-icon>
            {{ formatRating(trip.driver?.rating) }}
          </span>
          <v-icon
            v-if="trip.driver?.isVerified"
            size="16"
            class="trip__verified"
            :title="t('verified')"
            >mdi-check-decagram</v-icon
          >
        </div>
        <div v-if="carText || trip.maxTwoBackSeats" class="trip__car">
          <span v-if="carText">{{ carText }}</span>
          <span v-if="trip.maxTwoBackSeats" class="trip__two-back">
            <v-icon size="14">mdi-account-multiple-outline</v-icon>
            {{ t("two_back") }}
          </span>
        </div>
      </div>

      <span class="trip__seats" :class="`trip__seats--${seatsChip.tone}`">
        <v-icon size="15">{{
          seatsChip.tone === "hot" ? "mdi-fire" : "mdi-seat-passenger"
        }}</v-icon>
        {{ seatsChip.text }}
      </span>
    </div>
  </RouterLink>
</template>

<style scoped lang="scss">
.trip {
  --ink: #0b3550;
  --ink-soft: #5a7085;

  display: block;
  overflow: hidden;
  border: 1px solid #e3ecf5;
  border-radius: 20px;
  background: #fff;
  color: var(--ink);
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(15, 40, 80, 0.05);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #9cc6f0;
    box-shadow: 0 12px 26px rgba(30, 100, 170, 0.14);
  }

  &:focus-visible {
    outline: 3px solid rgba(33, 150, 243, 0.35);
    outline-offset: 2px;
  }
}

/* --- Верх: маршрут и цена --- */
.trip__top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 16px 18px 14px;
  background:
    radial-gradient(200px 80px at 100% 0%, #e6f4fe, transparent 70%),
    #fff;
}

.trip__route {
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(70px, 1fr) minmax(0, auto);
  gap: 14px;
  align-items: start;
}

.trip__point {
  min-width: 0;
}

.trip__point--end {
  text-align: right;
}

.trip__time {
  min-height: 25px;
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.15;
}

.trip__city {
  font-size: 15px;
  font-weight: 600;
}

.trip__addr {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--ink-soft);

  .trip__point--end & {
    margin-left: auto;
  }
}

.trip__line {
  position: relative;
  height: 2px;
  margin-top: 12px;
  background: repeating-linear-gradient(
    90deg,
    #2b8fd6 0 6px,
    transparent 6px 11px
  );

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: -3px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2b8fd6;
  }

  &::before {
    left: -2px;
  }

  &::after {
    right: -2px;
  }
}

.trip__duration {
  position: absolute;
  left: 50%;
  top: 50%;
  translate: -50% -50%;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 9px;
  border: 1px solid #d6e6f5;
  border-radius: 999px;
  background: #fff;
  color: #3d6a8c;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.trip__price {
  padding-left: 16px;
  border-left: 2px dashed #e1ebf5;
  text-align: right;
}

.trip__price-value {
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  color: #d65500;
  white-space: nowrap;
}

.trip__price-unit {
  font-size: 12px;
  color: var(--ink-soft);
  white-space: nowrap;
}

/* --- Низ: водитель и места --- */
.trip__bottom {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px 12px;
  border-top: 1px dashed #e3ecf5;
}

.trip__avatar {
  flex: none;
  border: 2px solid #fff;
  background: #dbeafe;
  color: #0b4fa8;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(30, 100, 160, 0.15);
}

.trip__driver {
  flex: 1;
  min-width: 0;
}

.trip__driver-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.trip__driver-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 700;
}

.trip__rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 13px;
  font-weight: 600;
  color: #9a5200;

  .v-icon {
    color: #f5a300;
  }
}

.trip__verified {
  color: #1e88e5;
}

.trip__car {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px 10px;
  font-size: 12px;
  color: var(--ink-soft);
}

.trip__two-back {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.trip__seats {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 11px;
  border: 1px solid #d6e3f1;
  border-radius: 999px;
  background: #f4f8fc;
  color: #2c4a6e;
  font-size: 12px;
  font-weight: 600;

  &--hot {
    border-color: #ffd8a8;
    background: #fff3e0;
    color: #9a4a00;
  }

  &--none {
    color: #8a97a8;
  }
}

@media (max-width: 600px) {
  .trip__top {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    padding: 14px 14px 12px;
  }

  .trip__route {
    gap: 10px;
  }

  .trip__time {
    font-size: 19px;
  }

  .trip__addr {
    max-width: 110px;
  }

  .trip__price {
    display: flex;
    align-items: baseline;
    justify-content: flex-end;
    gap: 6px;
    padding: 8px 0 0;
    border-left: none;
    border-top: 1px dashed #e1ebf5;
  }

  .trip__bottom {
    flex-wrap: wrap;
    padding: 10px 14px 12px;
  }
}
</style>

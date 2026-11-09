<script setup lang="ts">
import { computed, ref } from "vue";
import { useLangStore } from "@/stores/langStore";
import TripReview from "./TripReview.vue";
import {
  PASSENGER_FORMS,
  cityName,
  dayLabel,
  formatPrice,
  initialsOf,
  mediaUrl,
  pluralize,
  timeOf,
} from "@/utils/tripFormat";

interface HistoryPerson {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  seats?: number;
}

interface Trip {
  to: { address: string; cityKey: string };
  from: { address: string; cityKey: string };
  role: string;
  price: number;
  status: string;
  tripId: string;
  passengers?: HistoryPerson[];
  withUser?: HistoryPerson;
  completedAt: string;
  departureAt: string;
}

const { trip } = defineProps<{ trip: Trip }>();
const langStore = useLangStore();
const t = (key: string) => langStore.t(key);
const showReview = ref(false);

const isDriver = computed(() => trip.role === "driver");
const isCancelled = computed(() => trip.status === "cancelled");

const fromCity = computed(() => cityName(trip.from, (k) => langStore.с(k)));
const toCity = computed(() => cityName(trip.to, (k) => langStore.с(k)));
const dateText = computed(
  () =>
    `${dayLabel(trip.departureAt, langStore.currentLang, t)} · ${timeOf(trip.departureAt)}`,
);

const passengers = computed(() => trip.passengers ?? []);
const visiblePassengers = computed(() => passengers.value.slice(0, 4));
const hiddenPassengers = computed(() =>
  Math.max(0, passengers.value.length - visiblePassengers.value.length),
);
const passengersText = computed(() => {
  const n = passengers.value.length;
  return `${n} ${pluralize(langStore.currentLang, n, PASSENGER_FORMS)}`;
});

// Водителю показываем, сколько он заработал; пассажиру — цену за место.
const amount = computed(() => {
  if (!isDriver.value) return trip.price;
  const seats = passengers.value.reduce((sum, p) => sum + (p.seats ?? 1), 0);
  return trip.price * Math.max(seats, 1);
});

const canReview = computed(
  () =>
    !isCancelled.value &&
    (isDriver.value ? passengers.value.length > 0 : !!trip.withUser),
);

const handleReview = (data: unknown) => {
  console.log("Отзыв:", data);
};
</script>

<template>
  <article
    class="pass"
    :class="{
      'pass--driver': isDriver,
      'pass--passenger': !isDriver,
      'pass--cancelled': isCancelled,
    }"
  >
    <div class="pass__main">
      <span class="pass__cloud" aria-hidden="true"></span>

      <div class="pass__date">
        <v-icon size="15">mdi-calendar-blank-outline</v-icon>
        {{ dateText }}
      </div>

      <div class="pass__route">
        <span class="pass__city">{{ fromCity }}</span>
        <span class="pass__line" aria-hidden="true"></span>
        <span class="pass__city">{{ toCity }}</span>
      </div>

      <div v-if="isCancelled" class="pass__note">
        <v-icon size="15">mdi-information-outline</v-icon>
        {{ t("trip_cancelled") }}
      </div>

      <div v-else-if="isDriver && passengers.length" class="pass__people">
        <div class="stack">
          <v-avatar
            v-for="p in visiblePassengers"
            :key="p.id"
            size="30"
            class="stack__item"
          >
            <v-img v-if="p.avatar" :src="mediaUrl(p.avatar)" cover />
            <span v-else>{{ initialsOf(p.firstName, p.lastName) }}</span>
          </v-avatar>
          <span v-if="hiddenPassengers" class="stack__item stack__more">
            +{{ hiddenPassengers }}
          </span>
        </div>
        <span class="pass__muted">{{ passengersText }}</span>
      </div>

      <RouterLink
        v-else-if="trip.withUser"
        class="pass__people pass__people--link"
        :to="{ name: 'user', params: { id: trip.withUser.id } }"
      >
        <v-avatar size="30" class="stack__item">
          <v-img
            v-if="trip.withUser.avatar"
            :src="mediaUrl(trip.withUser.avatar)"
            cover
          />
          <span v-else>{{
            initialsOf(trip.withUser.firstName, trip.withUser.lastName)
          }}</span>
        </v-avatar>
        <span class="pass__muted">
          {{ t("driver") }}: {{ trip.withUser.firstName }}
          {{ trip.withUser.lastName?.[0] ? `${trip.withUser.lastName[0]}.` : "" }}
        </span>
      </RouterLink>
    </div>

    <div class="pass__stub">
      <span class="pass__role">
        <v-icon size="14">{{
          isDriver ? "mdi-steering" : "mdi-account-outline"
        }}</v-icon>
        {{ isDriver ? t("driver") : t("passenger") }}
      </span>

      <div v-if="!isCancelled" class="pass__amount">
        <div class="pass__price">{{ formatPrice(amount) }}</div>
        <div class="pass__muted pass__caption">
          UZS · {{ isDriver ? t("earned") : t("per_seat") }}
        </div>
      </div>

      <v-btn
        v-if="canReview"
        class="pass__rate"
        variant="flat"
        prepend-icon="mdi-star-outline"
        @click="showReview = true"
      >
        {{ t("rate") }}
      </v-btn>
      <span v-else-if="isCancelled" class="pass__status">
        <v-icon size="14">mdi-cancel</v-icon>
        {{ t("status_cancelled") }}
      </span>
      <span v-else class="pass__status pass__status--done">
        <v-icon size="14">mdi-flag-checkered</v-icon>
        {{ t("trip_completed") }}
      </span>
    </div>

    <TripReview
      v-if="canReview"
      :trip="trip"
      v-model="showReview"
      @submit="handleReview"
    />
  </article>
</template>

<style scoped lang="scss">
.pass {
  --notch: var(--ticket-notch, #eeeeee);
  --ink: #0b3550;
  --ink-soft: #5a7085;
  --stub-bg: linear-gradient(180deg, #e3f3ff, #f6fbff);
  --accent: #0b4fa8;

  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 156px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid #dcebf7;
  box-shadow: 0 8px 22px rgba(30, 90, 140, 0.09);
  color: var(--ink);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 30px rgba(30, 90, 140, 0.14);
  }
}

.pass--passenger {
  --stub-bg: linear-gradient(180deg, #e6f7ee, #f7fdf9);
  --accent: #0f6b3d;
}

.pass--cancelled {
  --ink: #536170;
  --ink-soft: #7a8696;
  --stub-bg: #f1f3f6;
  --accent: #7a2e2e;
  box-shadow: none;

  .pass__main {
    background: #f7f8fa;
  }

  .pass__city {
    text-decoration: line-through;
    text-decoration-color: #b5bfcb;
  }

  .pass__line {
    background: repeating-linear-gradient(
      90deg,
      #c3ccd6 0 5px,
      transparent 5px 9px
    );
  }

  &:hover {
    transform: none;
    box-shadow: none;
  }
}

.pass__main {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  min-width: 0;
  padding: 16px 20px;
  background:
    radial-gradient(180px 80px at 100% 0%, #e0f2ff, transparent 70%),
    linear-gradient(150deg, #f3faff, #ffffff);
}

.pass__cloud {
  position: absolute;
  z-index: -1;
  top: 22px;
  right: 26px;
  width: 54px;
  height: 17px;
  border-radius: 17px;
  background: #d3ecfc;
  opacity: 0.9;

  &::before,
  &::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    background: inherit;
  }

  &::before {
    width: 26px;
    height: 26px;
    top: -13px;
    left: 8px;
  }

  &::after {
    width: 19px;
    height: 19px;
    top: -8px;
    left: 27px;
  }

  .pass--cancelled & {
    display: none;
  }
}

.pass__date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ink-soft);
}

.pass__route {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 10px 0 12px;
  min-width: 0;
}

.pass__city {
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pass__line {
  position: relative;
  flex: 1 1 40px;
  min-width: 28px;
  max-width: 110px;
  height: 2px;
  background: repeating-linear-gradient(
    90deg,
    #7cc0ea 0 5px,
    transparent 5px 9px
  );

  &::after {
    content: "";
    position: absolute;
    right: -2px;
    top: -3px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #7cc0ea;
  }
}

.pass__people {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;

  &--link:hover .pass__muted {
    color: var(--accent);
  }
}

.pass__note {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ink-soft);
}

.pass__muted {
  font-size: 13px;
  color: var(--ink-soft);
}

.stack {
  display: flex;
}

.stack__item {
  border: 2px solid #fff;
  background: #dbeafe;
  color: #0b4fa8;
  font-size: 11px;
  font-weight: 600;

  & + & {
    margin-left: -9px;
  }
}

.stack__more {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: inline-grid;
  place-items: center;
  background: #eef3f8;
  color: var(--ink-soft);
}

/* Отрывной корешок */
.pass__stub {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 16px 14px;
  border-left: 2px dashed #cfe3f3;
  background: var(--stub-bg);
  text-align: center;

  &::before,
  &::after {
    content: "";
    position: absolute;
    left: -12px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--notch);
  }

  &::before {
    top: -12px;
  }

  &::after {
    bottom: -12px;
  }
}

.pass__role {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  background: #fff;
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
}

.pass__price {
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.1;
  color: #d65500;
}

.pass__caption {
  font-size: 11px;
}

.pass__rate {
  width: 100%;
  border-radius: 12px;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
  color: #fff !important;
  background: linear-gradient(135deg, #1e88e5, #42a5f5) !important;
  box-shadow: 0 4px 12px rgba(30, 136, 229, 0.3);
}

.pass__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);

  &--done {
    color: #0f6b3d;
  }
}

@media (max-width: 560px) {
  .pass {
    grid-template-columns: 1fr;
  }

  .pass__stub {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    border-left: none;
    border-top: 2px dashed #cfe3f3;
    text-align: left;

    &::before,
    &::after {
      top: -12px;
      bottom: auto;
    }

    &::before {
      left: -12px;
    }

    &::after {
      left: auto;
      right: -12px;
    }
  }

  .pass__rate {
    width: auto;
    flex: 1 0 100%;
  }
}
</style>

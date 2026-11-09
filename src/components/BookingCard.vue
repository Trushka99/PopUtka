<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import PayForm from "./PayForm.vue";
import { useLangStore } from "@/stores/langStore";
import {
  confirmBooking,
  rejectBooking,
  completeTrip,
  openChatWith,
} from "@/api";
import type { Booking, TTripCard } from "@/utils/types";
import {
  SEAT_FORMS,
  addMinutes,
  cityName,
  dayLabel,
  formatPrice,
  formatRating,
  initialsOf,
  mediaUrl,
  pluralize,
  timeOf,
} from "@/utils/tripFormat";

const { trip } = defineProps<{ trip: TTripCard }>();

const langStore = useLangStore();
const router = useRouter();
const t = (key: string) => langStore.t(key);
const seatsWord = (n: number) =>
  pluralize(langStore.currentLang, n, SEAT_FORMS);

const sheet = ref();
const selectedBooking = ref<string>("");
const openSheet = (id: string) => {
  sheet.value.open();
  selectedBooking.value = id;
};

// ---------- Данные ----------
const isBooking = computed(() => trip.type === "booking");

// Базовая поездка (для брони пассажира она лежит внутри booking.trip)
const baseTrip = computed<any>(() =>
  trip.type === "booking" ? trip.data.trip : trip.data,
);

const isDriverTrip = computed(
  () => trip.type === "trip" && trip.data.role === "driver",
);

const bookings = computed<Booking[]>(() =>
  trip.type === "trip" ? (trip.data.bookings ?? []) : [],
);
const pendingBookings = computed(() =>
  bookings.value.filter((b) => b.status === "pending"),
);
const confirmedBookings = computed(() =>
  bookings.value.filter((b) => b.status === "confirmed"),
);

// Водитель — для брони пассажира
const driver = computed<any>(() =>
  trip.type === "booking" ? trip.data.trip?.driver : (trip.data as any).driver,
);

// Своя бронь пассажира: статус, места, id
const myBooking = computed<any>(() =>
  trip.type === "booking" ? trip.data : (trip.data as any).myBooking,
);
const bookingId = computed<string>(
  () => myBooking.value?.id ?? baseTrip.value?.id,
);

const canFinishTrip = computed(
  () =>
    trip.type === "trip" &&
    trip.data.role === "driver" &&
    trip.data.status !== "completed" &&
    Date.parse(trip.data.departureAt) < Date.now(),
);

// ---------- Внешний вид ----------
type Tone = "wait" | "ok" | "info" | "bad" | "muted";
type Variant = "sky" | "dawn" | "deep" | "fog";

const tripClosed = computed(
  () =>
    baseTrip.value?.status === "completed" ||
    baseTrip.value?.status === "cancelled",
);

const variant = computed<Variant>(() => {
  if (!isDriverTrip.value) {
    const s = myBooking.value?.status;
    if (tripClosed.value || s === "rejected" || s === "cancelled") return "fog";
    if (s === "pending") return "dawn";
    return "sky";
  }
  return pendingBookings.value.length ? "dawn" : "deep";
});

const status = computed<{
  text: string;
  tone: Tone;
  icon?: string;
  pulse?: boolean;
}>(() => {
  if (isDriverTrip.value) {
    const n = pendingBookings.value.length;
    if (n)
      return {
        text: n > 1 ? `${t("new_requests")} · ${n}` : t("new_request"),
        tone: "wait",
        pulse: true,
      };
    return {
      text: `${t("you_driver")} · ${dayLabel(baseTrip.value.departureAt, langStore.currentLang, t)}`,
      tone: "info",
      icon: "mdi-steering",
    };
  }

  if (baseTrip.value?.status === "completed")
    return { text: t("trip_completed"), tone: "muted", icon: "mdi-flag-checkered" };
  if (baseTrip.value?.status === "cancelled")
    return { text: t("trip_cancelled"), tone: "muted", icon: "mdi-cancel" };

  switch (myBooking.value?.status) {
    case "confirmed":
      return { text: t("booking_confirmed"), tone: "ok", icon: "mdi-check-circle-outline" };
    case "pending":
      return { text: t("awaiting_driver"), tone: "wait", pulse: true };
    case "rejected":
      return { text: t("booking_rejected"), tone: "bad", icon: "mdi-close-circle-outline" };
    case "cancelled":
      return { text: t("status_cancelled"), tone: "muted", icon: "mdi-cancel" };
    default:
      return { text: t("booking"), tone: "info", icon: "mdi-ticket-confirmation-outline" };
  }
});

// ---------- Маршрут ----------
const fromCity = computed(() =>
  cityName(baseTrip.value?.from, (k) => langStore.с(k)),
);
const toCity = computed(() =>
  cityName(baseTrip.value?.to, (k) => langStore.с(k)),
);

const durationMin = computed(() => baseTrip.value?.tripInfo?.duration ?? 0);

const formatDuration = (minutes: number) => {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return hrs === 0
    ? `${mins} ${t("min")}`
    : `${hrs} ${t("hours")} ${mins} ${t("min")}`;
};

const departureTime = computed(() => timeOf(baseTrip.value.departureAt));
const arrivalTime = computed(() =>
  timeOf(addMinutes(baseTrip.value.departureAt, durationMin.value)),
);
const departureDay = computed(() =>
  dayLabel(baseTrip.value.departureAt, langStore.currentLang, t),
);
const distanceText = computed(() => {
  const d = Number(baseTrip.value?.tripInfo?.distance);
  return d ? `${Math.round(d)} ${t("km")}` : "";
});

const priceUnit = computed(() => {
  if (isDriverTrip.value) return t("per_seat");
  const seats = myBooking.value?.seats ?? 1;
  return `${seats} ${seatsWord(seats)}`;
});

const seatsMeta = computed(() => {
  if (isDriverTrip.value) return String(baseTrip.value?.availableSeats ?? 0);
  return String(myBooking.value?.seats ?? 1);
});

const plate = computed<string>(() => driver.value?.car?.licensePlate ?? "");
const carText = computed(() => {
  const car = driver.value?.car;
  if (!car) return "";
  return [[car.brand, car.model].filter(Boolean).join(" "), car.color]
    .filter(Boolean)
    .join(" · ");
});

// ---------- Действия ----------
const finishTrip = async (id: string) => {
  try {
    const trip = langStore.user.activeTrips.find((trip: any) => trip.id === id);

    const historyTrip = {
      tripId: trip.id,
      role: trip.role,
      from: trip.from,
      to: trip.to,
      price: trip.price,
      status: "completed",
      departureAt: trip.departureAt,
      completedAt: new Date().toISOString(),

      passengers: trip.bookings.map((booking: any) => ({
        id: booking.passenger.id,
        seats: booking.seats,
        avatar: booking.passenger.avatar,
        firstName: booking.passenger.firstName,
        lastName: booking.passenger.lastName,
      })),
    };
    const updatedUser = {
      ...langStore.user,
      activeTrips: langStore.user.activeTrips.filter(
        (trip: any) => trip.id !== id,
      ),
      tripHistory: [historyTrip, ...(langStore.user.tripHistory || [])],
    };

    langStore.setUser(updatedUser);
    await completeTrip(id);
  } catch (err) {
    console.error("Ошибка завершения поездки:", err);
  }
};

const confTrip = async (id: string) => {
  if (trip.data.status === "created") {
    openSheet(id);
    return;
  }
  try {
    const res = await confirmBooking(id);
    const trip = langStore.user.activeTrips.find((trip: any) =>
      trip.bookings?.some((b: any) => b.id === id),
    );

    const booking = trip.bookings.find((b: any) => b.id === id);

    if (booking) {
      booking.status = "confirmed";
    }

    console.log("Бронь подтверждена:", res);
  } catch (err) {
    console.error(err);
  }
};

const rejTrip = async (id: string) => {
  try {
    const res = await rejectBooking(id);
    const trip = langStore.user.activeTrips.find((trip: any) =>
      trip.bookings?.some((b: any) => b.id === id),
    );

    const booking = trip.bookings.find((b: any) => b.id === id);

    if (booking) {
      booking.status = "rejected";
    }

    console.log("Бронь отклонена:", res);
  } catch (err) {
    console.error(err);
  }
};

const writeDriver = async () => {
  if (!driver.value?.id) return;
  try {
    const chatId = await openChatWith(driver.value.id);
    router.push(`/chats/${chatId}`);
  } catch (err) {
    console.error(err);
  }
};
</script>

<template>
  <article class="ticket" :class="`ticket--${variant}`">
    <span class="cloud cloud--a" aria-hidden="true"></span>
    <span class="cloud cloud--b" aria-hidden="true"></span>
    <span class="cloud cloud--c" aria-hidden="true"></span>

    <div class="ticket__body">
      <header class="ticket__head">
        <span class="status" :class="`status--${status.tone}`">
          <span v-if="status.pulse" class="status__pulse"></span>
          <v-icon v-else-if="status.icon" size="15">{{ status.icon }}</v-icon>
          {{ status.text }}
        </span>

        <span class="glass price-tag">
          <span class="price-tag__value">{{ formatPrice(baseTrip.price) }}</span>
          <span class="price-tag__unit">UZS · {{ priceUnit }}</span>
        </span>
      </header>

      <div class="route">
        <div class="route__point">
          <div class="route__time">{{ departureTime }}</div>
          <div class="route__city">{{ fromCity }}</div>
          <div v-if="baseTrip.from?.address" class="route__addr">
            {{ baseTrip.from.address }}
          </div>
        </div>

        <div class="route__path">
          <span>{{ formatDuration(durationMin) }}</span>
          <div class="route__line">
            <span class="route__car">
              <v-icon size="16">mdi-car-side</v-icon>
            </span>
          </div>
          <span>{{ distanceText }}</span>
        </div>

        <div class="route__point route__point--end">
          <div class="route__time">{{ arrivalTime }}</div>
          <div class="route__city">{{ toCity }}</div>
          <div v-if="baseTrip.to?.address" class="route__addr">
            {{ baseTrip.to.address }}
          </div>
        </div>
      </div>

      <div class="glass meta">
        <div class="meta__item">
          <span class="meta__label">{{ t("date") }}</span>
          <strong>{{ departureDay }}</strong>
        </div>
        <div class="meta__item">
          <span class="meta__label">{{
            isDriverTrip ? t("seats_free") : t("seats_booked")
          }}</span>
          <strong>{{ seatsMeta }}</strong>
        </div>
        <div class="meta__item meta__item--wide">
          <span class="meta__label">{{ t("booking") }}</span>
          <strong>{{
            baseTrip.instantBooking ? t("instant") : t("with_confirmation")
          }}</strong>
        </div>
      </div>
    </div>

    <div class="perforation" aria-hidden="true"></div>

    <div class="ticket__stub">
      <!-- Водитель: заявки и пассажиры -->
      <template v-if="isDriverTrip">
        <div v-for="b in pendingBookings" :key="b.id" class="glass person">
          <RouterLink
            class="person__link"
            :to="{ name: 'bookings', params: { id: b.id } }"
          >
            <v-avatar size="42" class="avatar avatar--warm">
              <v-img
                v-if="b.passenger?.avatar"
                :src="mediaUrl(b.passenger.avatar)"
                cover
              />
              <span v-else>{{
                initialsOf(b.passenger?.firstName, b.passenger?.lastName)
              }}</span>
            </v-avatar>
            <div class="person__text">
              <div class="person__name">
                {{ b.passenger?.firstName }} {{ b.passenger?.lastName }}
              </div>
              <div class="person__sub">
                ★ {{ formatRating(b.passenger?.rating) }} · {{ b.seats }}
                {{ seatsWord(b.seats) }}
              </div>
            </div>
          </RouterLink>
          <div class="person__actions">
            <v-btn
              variant="flat"
              class="btn-glass btn-glass--danger"
              prepend-icon="mdi-close"
              @click="rejTrip(b.id)"
            >
              {{ t("reject") }}
            </v-btn>
            <v-btn
              variant="flat"
              class="btn-sky"
              prepend-icon="mdi-check"
              @click="confTrip(b.id)"
            >
              {{ t("accept") }}
            </v-btn>
          </div>
        </div>

        <div class="chips">
          <RouterLink
            v-for="b in confirmedBookings"
            :key="b.id"
            class="glass chip"
            :to="{ name: 'bookings', params: { id: b.id } }"
          >
            <v-avatar size="28" class="avatar">
              <v-img
                v-if="b.passenger?.avatar"
                :src="mediaUrl(b.passenger.avatar)"
                cover
              />
              <span v-else>{{
                initialsOf(b.passenger?.firstName, b.passenger?.lastName)
              }}</span>
            </v-avatar>
            <span class="chip__name">{{ b.passenger?.firstName }}</span>
            <span class="chip__seats" v-if="b.seats > 1">×{{ b.seats }}</span>
            <v-icon size="17" class="chip__ok">mdi-check-circle</v-icon>
          </RouterLink>

          <span
            v-if="(baseTrip.availableSeats ?? 0) > 0"
            class="glass chip chip--empty"
          >
            <v-icon size="17">mdi-seat-passenger</v-icon>
            {{ t("seats_free") }}: {{ baseTrip.availableSeats }}
          </span>

          <v-btn
            v-if="canFinishTrip"
            variant="flat"
            class="btn-white chips__finish"
            prepend-icon="mdi-flag-checkered"
            @click="finishTrip(baseTrip.id)"
          >
            {{ t("complete") }}
          </v-btn>
        </div>
      </template>

      <!-- Пассажир: водитель и машина -->
      <div v-else class="glass person">
        <RouterLink
          v-if="driver"
          class="person__link"
          :to="{ name: 'user', params: { id: driver.id } }"
        >
          <v-avatar size="42" class="avatar">
            <v-img v-if="driver.avatar" :src="mediaUrl(driver.avatar)" cover />
            <span v-else>{{
              initialsOf(driver.firstName, driver.lastName)
            }}</span>
          </v-avatar>
          <div class="person__text">
            <div class="person__name">
              {{ driver.firstName }} {{ driver.lastName }}
              <span class="person__rating"
                >★ {{ formatRating(driver.rating) }}</span
              >
            </div>
            <div class="person__sub">
              <span v-if="carText">{{ carText }}</span>
              <span v-else>{{ t("driver") }}</span>
              <span v-if="plate" class="plate">{{ plate }}</span>
            </div>
          </div>
        </RouterLink>

        <div class="person__actions">
          <v-btn
            v-if="driver"
            icon
            variant="flat"
            size="40"
            class="btn-glass"
            :aria-label="t('contact_drive')"
            @click="writeDriver"
          >
            <v-icon size="20">mdi-message-outline</v-icon>
          </v-btn>
          <v-btn
            variant="flat"
            class="btn-sky"
            :to="{ name: 'bookings', params: { id: bookingId } }"
          >
            {{ t("open_booking") }}
          </v-btn>
        </div>
      </div>
    </div>
  </article>
  <PayForm :bookingId="selectedBooking" ref="sheet" :trip="trip" />
</template>

<style scoped lang="scss">
.ticket {
  --ink: #0b3550;
  --ink-soft: rgba(11, 53, 80, 0.62);
  --notch: var(--ticket-notch, #eeeeee);
  --line: #2b8fd6;

  position: relative;
  overflow: hidden;
  isolation: isolate;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  color: var(--ink);
  box-shadow:
    0 12px 28px rgba(30, 90, 140, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 18px 36px rgba(30, 90, 140, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
  }
}

/* --- Небо под разные состояния --- */
.ticket--sky {
  background:
    radial-gradient(
      280px 110px at 88% 0%,
      rgba(255, 255, 255, 0.9),
      transparent 70%
    ),
    radial-gradient(
      340px 130px at 0% 100%,
      rgba(255, 255, 255, 0.75),
      transparent 70%
    ),
    linear-gradient(160deg, #7fcaf2 0%, #bfe6fb 50%, #eaf7ff 100%);
}

.ticket--dawn {
  background:
    radial-gradient(
      280px 110px at 90% 0%,
      rgba(255, 255, 255, 0.85),
      transparent 70%
    ),
    radial-gradient(
      340px 130px at 0% 100%,
      rgba(255, 255, 255, 0.7),
      transparent 70%
    ),
    linear-gradient(160deg, #ffc58f 0%, #ffe2c4 38%, #cdeafd 100%);
}

.ticket--deep {
  --ink: #062b45;
  --ink-soft: rgba(6, 43, 69, 0.66);
  background:
    radial-gradient(
      300px 110px at 85% 0%,
      rgba(255, 255, 255, 0.55),
      transparent 70%
    ),
    radial-gradient(
      360px 140px at 0% 100%,
      rgba(255, 255, 255, 0.6),
      transparent 70%
    ),
    linear-gradient(160deg, #3d9be9 0%, #86c9f5 50%, #d9f0ff 100%);
}

.ticket--fog {
  --ink: #3d4b5c;
  --ink-soft: rgba(61, 75, 92, 0.62);
  --line: #8a9bb0;
  background:
    radial-gradient(
      280px 110px at 88% 0%,
      rgba(255, 255, 255, 0.8),
      transparent 70%
    ),
    linear-gradient(160deg, #c9d3de 0%, #e4e9ef 55%, #f4f6f9 100%);

  .cloud {
    opacity: 0.55;
  }

  .route__car {
    color: #6b7c90;
  }

  .price-tag__value {
    color: #8a7766;
  }

  .btn-sky {
    color: #3d4b5c !important;
    background: rgba(255, 255, 255, 0.7) !important;
    box-shadow: none;
  }
}

/* --- Облака --- */
.cloud {
  position: absolute;
  z-index: -1;
  width: 72px;
  height: 22px;
  border-radius: 22px;
  background: #fff;
  opacity: 0.75;
  pointer-events: none;
  animation: drift 9s ease-in-out infinite alternate;

  &::before,
  &::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    background: inherit;
  }

  &::before {
    width: 34px;
    height: 34px;
    top: -17px;
    left: 10px;
  }

  &::after {
    width: 26px;
    height: 26px;
    top: -11px;
    left: 36px;
  }
}

.cloud--a {
  top: 34px;
  right: 26%;
}

.cloud--b {
  top: 26px;
  left: 44%;
  scale: 0.55;
  opacity: 0.6;
  animation-duration: 12s;
}

.cloud--c {
  bottom: 26px;
  left: 4%;
  scale: 0.7;
  opacity: 0.45;
  animation-duration: 14s;
  animation-direction: alternate-reverse;
}

@keyframes drift {
  from {
    translate: 0 0;
  }
  to {
    translate: 14px 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cloud,
  .status__pulse {
    animation: none;
  }
}

/* --- Стекло --- */
.glass {
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 14px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.ticket__body {
  padding: 16px 20px 18px;
}

.ticket__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

/* --- Статус --- */
.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
}

.status--wait {
  background: #fff3e0;
  color: #9a4a00;
}

.status--ok {
  background: rgba(255, 255, 255, 0.88);
  color: #0b6b3a;
}

.status--info {
  background: rgba(255, 255, 255, 0.88);
  color: #0b4fa8;
}

.status--bad {
  background: #fdecea;
  color: #a32020;
}

.status--muted {
  background: rgba(255, 255, 255, 0.75);
  color: #5a6676;
}

.status__pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff8a00;
  animation: pulse 1.8s ease-out infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 138, 0, 0.55);
  }
  100% {
    box-shadow: 0 0 0 9px rgba(255, 138, 0, 0);
  }
}

/* --- Цена --- */
.price-tag {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 12px;
}

.price-tag__value {
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #d65500;
}

.price-tag__unit {
  font-size: 12px;
  color: var(--ink-soft);
}

/* --- Маршрут --- */
.route {
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(70px, 1fr) minmax(0, auto);
  align-items: center;
  gap: 16px;
  margin: 16px 0;
}

.route__point {
  min-width: 0;
}

.route__point--end {
  text-align: right;
}

.route__time {
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.05;
}

.route__city {
  margin-top: 2px;
  font-size: 15px;
  font-weight: 600;
}

.route__addr {
  max-width: 200px;
  font-size: 12px;
  color: var(--ink-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .route__point--end & {
    margin-left: auto;
  }
}

.route__path {
  text-align: center;
  font-size: 12px;
  color: var(--ink-soft);
}

.route__line {
  position: relative;
  height: 2px;
  margin: 16px 4px;
  background: repeating-linear-gradient(
    90deg,
    var(--line) 0 6px,
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
    background: var(--line);
  }

  &::before {
    left: -4px;
  }

  &::after {
    right: -4px;
  }
}

.route__car {
  position: absolute;
  left: 50%;
  top: 50%;
  translate: -50% -50%;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #fff;
  color: #1a7cc9;
  box-shadow: 0 3px 10px rgba(30, 100, 160, 0.25);
}

/* --- Мета --- */
.meta {
  display: flex;
  justify-content: space-between;
  gap: 12px 20px;
  flex-wrap: wrap;
  padding: 10px 16px;
}

.meta__item {
  display: flex;
  flex-direction: column;

  strong {
    font-size: 14px;
    font-weight: 600;
  }
}

.meta__label {
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

/* --- Перфорация --- */
.perforation {
  position: relative;
  height: 0;
  margin: 0 18px;
  border-top: 2px dashed rgba(255, 255, 255, 0.95);

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: -12px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--notch);
  }

  &::before {
    left: -30px;
  }

  &::after {
    right: -30px;
  }
}

.ticket__stub {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 20px 18px;
}

/* --- Человек (заявка / водитель) --- */
.person {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  flex-wrap: wrap;
}

.person__link {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 220px;
  min-width: 0;
  color: inherit;
  text-decoration: none;

  &:hover .person__name {
    color: #0b4fa8;
  }
}

.person__text {
  min-width: 0;
}

.person__name {
  font-weight: 600;
  font-size: 15px;
  transition: color 0.2s ease;
}

.person__rating {
  margin-left: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-soft);
}

.person__sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  color: var(--ink-soft);
}

.person__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.avatar {
  border: 2px solid #fff;
  background: #dbeafe;
  color: #0b4fa8;
  font-size: 13px;
  font-weight: 700;
}

.avatar--warm {
  background: #ffe0c2;
  color: #8a3d00;
}

.plate {
  padding: 0 5px;
  border: 1.5px solid currentColor;
  border-radius: 4px;
  background: #fff;
  color: var(--ink);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.05em;
}

/* --- Пассажиры водителя --- */
.chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border-radius: 999px;
  color: inherit;
  text-decoration: none;
  font-size: 13px;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.8);
  }
}

.chip__name {
  font-weight: 600;
}

.chip__seats {
  color: var(--ink-soft);
}

.chip__ok {
  color: #1f9d55;
}

.chip--empty {
  padding: 6px 12px;
  border-style: dashed;
  color: var(--ink-soft);
}

.chips__finish {
  margin-left: auto;
}

/* --- Кнопки --- */
.btn-sky,
.btn-glass,
.btn-white {
  border-radius: 12px;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}

.btn-sky {
  color: #fff !important;
  background: linear-gradient(135deg, #1e88e5, #42a5f5) !important;
  box-shadow: 0 4px 12px rgba(30, 136, 229, 0.35);
}

.btn-glass {
  color: #0b4fa8 !important;
  background: rgba(255, 255, 255, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.9);
}

.btn-glass--danger {
  color: #c0362c !important;
}

.btn-white {
  color: #0b4fa8 !important;
  background: #fff !important;
  box-shadow: 0 4px 12px rgba(10, 60, 110, 0.15);
}

@media (max-width: 600px) {
  .ticket__body {
    padding: 14px 16px 16px;
  }

  .ticket__stub {
    padding: 12px 16px 16px;
  }

  .route {
    gap: 10px;
  }

  .route__time {
    font-size: 20px;
  }

  .route__city {
    font-size: 14px;
  }

  .route__addr {
    max-width: 110px;
  }

  .person__actions {
    width: 100%;
    margin-left: 0;

    .btn-sky,
    .btn-glass--danger {
      flex: 1;
    }
  }

  .meta__item--wide {
    display: none;
  }

  .chips__finish {
    width: 100%;
    margin-left: 0;
  }
}
</style>

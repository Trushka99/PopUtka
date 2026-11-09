<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { bookTrip, getTrip, openChatWith } from "@/api";
import Loading from "@/components/Loading.vue";
import TripTicket from "@/components/TripTicket.vue";
import { useLangStore } from "@/stores/langStore";
import { useSnackbarStore } from "@/stores/snackbarStore";
import {
  SEAT_FORMS,
  capitalize,
  formatPrice,
  formatRating,
  initialsOf,
  localeOf,
  mediaUrl,
  pluralize,
} from "@/utils/tripFormat";

const route = useRoute();
const router = useRouter();
const langStore = useLangStore();
const snackbar = useSnackbarStore();
const t = (key: string) => langStore.t(key);

const trip = ref<any | null>(null);
const loading = ref(false);
const sending = ref(false);
const opening = ref(false);

const tripId = computed(() => String(route.params.id));

async function load() {
  loading.value = true;
  try {
    const res = await getTrip(tripId.value);
    trip.value = res.data.data ?? null;
  } catch (err) {
    console.error("Не удалось загрузить поездку", err);
    trip.value = null;
  } finally {
    loading.value = false;
  }
}

watch(tripId, load, { immediate: true });

// ---------- Кто смотрит ----------
const driver = computed<any>(() => trip.value?.driver ?? null);
const isOwnTrip = computed(
  () => !!trip.value && trip.value.driverId === langStore.user.id,
);

// Своя активная бронь на эту поездку — берём из профиля (myBookings есть у всех ролей)
const myBooking = computed<any>(() =>
  (langStore.user.myBookings ?? []).find(
    (b: any) =>
      b.tripId === trip.value?.id && ["pending", "confirmed"].includes(b.status),
  ),
);

// ---------- Даты и места ----------
const dateTitle = computed(() =>
  trip.value?.departureAt
    ? capitalize(
        new Date(trip.value.departureAt).toLocaleDateString(
          localeOf(langStore.currentLang),
          { weekday: "long", day: "numeric", month: "long" },
        ),
      )
    : "",
);

const seatsLeft = computed(() => Number(trip.value?.availableSeats ?? 0));
const seatsWord = (n: number) => pluralize(langStore.currentLang, n, SEAT_FORMS);

const closed = computed(() =>
  ["completed", "cancelled"].includes(trip.value?.status),
);
const departed = computed(
  () =>
    !!trip.value?.departureAt &&
    new Date(trip.value.departureAt).getTime() < Date.now(),
);

const status = computed<{
  text: string;
  tone: "ok" | "wait" | "muted";
  icon: string;
}>(() => {
  if (trip.value?.status === "completed")
    return { text: t("trip_completed"), tone: "muted", icon: "mdi-flag-checkered" };
  if (trip.value?.status === "cancelled")
    return { text: t("trip_cancelled"), tone: "muted", icon: "mdi-cancel" };
  if (departed.value)
    return { text: t("trip_departed"), tone: "muted", icon: "mdi-car-clock" };
  if (seatsLeft.value <= 0)
    return { text: t("no_seats"), tone: "muted", icon: "mdi-seat-passenger" };
  return {
    text: `${seatsLeft.value} ${seatsWord(seatsLeft.value)} ${t("seats_free_suffix")}`,
    tone: seatsLeft.value <= 1 ? "wait" : "ok",
    icon: "mdi-seat-passenger",
  };
});

const ticketMeta = computed(() => [
  { label: t("seats_free"), value: Math.max(seatsLeft.value, 0) },
  { label: t("booking"), value: t("with_confirmation") },
  ...(trip.value?.maxTwoBackSeats ? [{ label: t("maxTwoBackSeats") }] : []),
]);

// ---------- Бронирование ----------
const clampSeats = (n: number) =>
  Math.min(Math.max(1, Math.round(n) || 1), Math.max(1, seatsLeft.value));

const seats = ref(clampSeats(Number(route.query.seats ?? 1)));
watch(seatsLeft, () => (seats.value = clampSeats(Number(route.query.seats ?? seats.value))));

const seatsText = computed(() => `${seats.value} ${seatsWord(seats.value)}`);
const total = computed(() => Number(trip.value?.price ?? 0) * seats.value);

// Поездка вообще открыта для брони (иначе прячем счётчик мест и сумму)
const bookable = computed(
  () => !closed.value && !departed.value && seatsLeft.value > 0,
);
const canBook = computed(() => bookable.value && !sending.value);

const bookLabel = computed(() => {
  if (closed.value || departed.value) return status.value.text;
  if (seatsLeft.value <= 0) return t("no_seats");
  return t("book");
});

const errorText = (err: any) => {
  const key = String(err?.response?.data?.code ?? "").toLowerCase();
  const text = key ? t(key) : "";
  return text && text !== key ? text : t("booking_create_error");
};

const createBooking = async () => {
  if (!canBook.value) return;
  sending.value = true;
  try {
    const res = await bookTrip({ tripId: trip.value.id, seats: seats.value });
    const created = res.data?.data?.booking;
    snackbar.success(t("booking_pending"));
    // Обновляем профиль: там появится бронь, а тут — блок «Вы уже забронировали».
    // Свободные места сервер списывает только после подтверждения водителем.
    await langStore.initUser();
    if (created?.id && !myBooking.value) {
      langStore.user.myBookings = [
        { id: created.id, tripId: trip.value.id, seats: seats.value, status: "pending" },
        ...(langStore.user.myBookings ?? []),
      ];
    }
  } catch (err) {
    console.error(err);
    snackbar.error(errorText(err));
  } finally {
    sending.value = false;
  }
};

// ---------- Водитель ----------
const driverLink = computed(() =>
  isOwnTrip.value
    ? "/users/me"
    : { name: "user", params: { id: trip.value?.driverId } },
);

const car = computed<any>(() => driver.value?.car ?? null);
const carPhoto = computed(() => car.value?.photos?.[0] ?? "");
const carSub = computed(() =>
  car.value ? [car.value.year, car.value.color].filter(Boolean).join(" · ") : "",
);

const writeDriver = async () => {
  if (!driver.value?.id || opening.value) return;
  opening.value = true;
  try {
    const chatId = await openChatWith(driver.value.id);
    router.push({ name: "chats", params: { id: chatId } });
  } catch (err) {
    console.error(err);
    snackbar.error(t("chat_create_error"));
  } finally {
    opening.value = false;
  }
};

// ---------- Назад ----------
const goBack = () => {
  if (window.history.state?.back) router.back();
  else router.push("/");
};
</script>

<template>
  <Loading v-if="loading" />

  <div v-else-if="trip" class="tp">
    <div class="tp__top">
      <button type="button" class="tp__back" @click="goBack">
        <v-icon size="20">mdi-arrow-left</v-icon>
        {{ t("back") }}
      </button>
      <span class="status" :class="`status--${status.tone}`">
        <v-icon size="15">{{ status.icon }}</v-icon>
        {{ status.text }}
      </span>
    </div>

    <h1 class="tp__title">{{ dateTitle }}</h1>

    <div class="tp__grid">
      <TripTicket class="tp__ticket" :trip="trip" :meta="ticketMeta" />

      <!-- ===== Итог и бронь ===== -->
      <aside class="tp__side">
        <section class="panel summary">
          <div class="summary__head">
            <span class="summary__price">
              {{ formatPrice(trip.price) }} <small>UZS</small>
            </span>
            <span class="summary__per">{{ t("per_seat") }}</span>
          </div>

          <!-- Своя поездка -->
          <template v-if="isOwnTrip">
            <div class="note note--info">
              <v-icon size="20">mdi-steering</v-icon>
              <span>{{ t("your_trip_note") }}</span>
            </div>
            <RouterLink
              class="btn-soft btn-block"
              :to="{ path: '/users/me', query: { tab: 'bookings' } }"
            >
              <v-icon size="18">mdi-ticket-confirmation-outline</v-icon>
              {{ t("to_my_trips") }}
            </RouterLink>
          </template>

          <!-- Уже есть бронь -->
          <template v-else-if="myBooking">
            <div
              class="note"
              :class="myBooking.status === 'confirmed' ? 'note--ok' : 'note--wait'"
            >
              <span v-if="myBooking.status !== 'confirmed'" class="note__pulse"></span>
              <v-icon v-else size="20">mdi-check-circle-outline</v-icon>
              <span>
                <strong>{{
                  myBooking.status === "confirmed"
                    ? t("booking_confirmed")
                    : t("awaiting_driver")
                }}</strong>
                <span class="note__sub">
                  {{ t("you_booked") }} {{ myBooking.seats }}
                  {{ seatsWord(Number(myBooking.seats)) }}
                </span>
              </span>
            </div>
            <RouterLink
              class="btn-sky btn-block"
              :to="{ name: 'bookings', params: { id: myBooking.id } }"
            >
              {{ t("open_booking") }}
              <v-icon size="18">mdi-arrow-right</v-icon>
            </RouterLink>
          </template>

          <!-- Можно бронировать -->
          <template v-else>
            <template v-if="bookable">
              <div class="stepper">
                <span class="stepper__label">{{ t("how_many_seats") }}</span>
                <div class="stepper__ctrl">
                  <button
                    type="button"
                    :disabled="seats <= 1 || !canBook"
                    :aria-label="t('less_seats')"
                    @click="seats--"
                  >
                    <v-icon size="18">mdi-minus</v-icon>
                  </button>
                  <span class="stepper__value" aria-live="polite">{{ seats }}</span>
                  <button
                    type="button"
                    :disabled="seats >= seatsLeft || !canBook"
                    :aria-label="t('more_seats')"
                    @click="seats++"
                  >
                    <v-icon size="18">mdi-plus</v-icon>
                  </button>
                </div>
              </div>

              <div class="summary__total-row">
                <span class="summary__calc">
                  {{ formatPrice(trip.price) }} UZS × {{ seatsText }}
                </span>
                <span class="summary__total">{{ formatPrice(total) }} UZS</span>
              </div>
            </template>

            <v-btn
              variant="flat"
              class="btn-sky btn-block"
              :class="{ 'summary__closed': !bookable }"
              :disabled="!canBook"
              :loading="sending"
              @click="createBooking"
            >
              <v-icon v-if="bookable" start size="19">mdi-ticket-confirmation-outline</v-icon>
              {{ bookLabel }}
            </v-btn>

            <p v-if="bookable" class="summary__hint">
              <v-icon size="16">mdi-information-outline</v-icon>
              {{ t("booking_hint") }}
            </p>
          </template>
        </section>
      </aside>

      <!-- ===== Водитель ===== -->
      <section v-if="driver" class="panel person tp__driver">
        <RouterLink class="person__link" :to="driverLink">
          <v-avatar size="52" class="person__avatar">
            <v-img v-if="driver.avatar" :src="mediaUrl(driver.avatar)" cover />
            <span v-else>{{ initialsOf(driver.firstName, driver.lastName) }}</span>
          </v-avatar>
          <div class="person__text">
            <div class="person__name">
              {{ driver.firstName }} {{ driver.lastName }}
              <span class="person__rating">
                <v-icon size="14">mdi-star</v-icon>
                {{ formatRating(driver.rating) }}
              </span>
            </div>
            <div class="person__sub">
              {{ isOwnTrip ? t("you_driver") : t("driver") }}
              <span v-if="driver.isVerified" class="person__verified">
                <v-icon size="14">mdi-check-decagram</v-icon>
                {{ t("verified") }}
              </span>
            </div>
          </div>
          <v-icon class="person__chevron">mdi-chevron-right</v-icon>
        </RouterLink>

        <div v-if="car" class="car">
          <div class="car__pic">
            <img v-if="carPhoto" :src="mediaUrl(carPhoto)" alt="" />
            <v-icon v-else size="26">mdi-car-side</v-icon>
          </div>
          <div class="car__text">
            <div class="car__model">{{ car.model || t("car") }}</div>
            <div v-if="carSub" class="car__sub">{{ carSub }}</div>
          </div>
          <span v-if="car.licensePlate" class="plate">{{ car.licensePlate }}</span>
        </div>

        <button
          v-if="!isOwnTrip"
          type="button"
          class="btn-soft btn-block person__write"
          :disabled="opening"
          @click="writeDriver"
        >
          <v-icon size="18">mdi-message-text-outline</v-icon>
          {{ t("write_driver") }}
        </button>
      </section>

      <section v-if="trip.description" class="panel tp__desc">
        <div class="panel__title">{{ t("driver_comment") }}</div>
        <p class="panel__text">{{ trip.description }}</p>
      </section>
    </div>
  </div>

  <div v-else class="tp-empty">
    <span class="tp-empty__icon"><v-icon size="30">mdi-map-marker-question-outline</v-icon></span>
    <h3>{{ t("trip_not_found") }}</h3>
    <button type="button" class="tp__back" @click="goBack">
      <v-icon size="20">mdi-arrow-left</v-icon>
      {{ t("back") }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.tp {
  --ink: #0b3550;
  --ink-soft: #5a7085;

  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 36px 20px 48px;
  box-sizing: border-box;
  color: var(--ink);
}

.tp__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tp__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px 6px 8px;
  border: none;
  border-radius: 999px;
  background: none;
  color: #43526a;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.8);
  }
}

.tp__title {
  margin: 10px 0 18px;
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.15;
}

/* Слева билет, водитель, комментарий; справа — итог, он едет вместе с прокруткой */
.tp__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  grid-template-areas:
    "ticket side"
    "driver side"
    "desc   side";
  grid-template-rows: auto auto 1fr;
  gap: 16px 20px;
  align-items: start;
}

.tp__ticket {
  grid-area: ticket;
}

.tp__side {
  grid-area: side;
  position: sticky;
  top: 20px;
  min-width: 0;
}

.tp__driver {
  grid-area: driver;
}

.tp__desc {
  grid-area: desc;
}

/* --- Статус --- */
.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;

  &--ok {
    background: #e7f6ee;
    color: #0f6b3d;
  }

  &--wait {
    background: #fff3e0;
    color: #9a4a00;
  }

  &--muted {
    background: #eef1f5;
    color: #5a6676;
  }
}

/* --- Панели --- */
.panel {
  padding: 16px 18px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
}

.panel__title {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #66758a;
}

.panel__text {
  margin: 0;
  line-height: 1.6;
  color: #2b3a52;
  white-space: pre-line;
  word-break: break-word;
}

/* --- Итог --- */
.summary {
  padding: 20px;
}

.summary__head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-bottom: 14px;
  border-bottom: 2px dashed #e3ecf5;
}

.summary__price {
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  color: #d65500;

  small {
    font-size: 15px;
  }
}

.summary__per {
  color: var(--ink-soft);
}

.stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}

.stepper__label {
  font-weight: 600;
}

.stepper__ctrl {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border: 1px solid #e3e9f1;
  border-radius: 999px;
  background: #f3f6fa;

  button {
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: #fff;
    color: #0b4fa8;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(20, 60, 110, 0.12);
    transition: background 0.2s ease;

    &:hover:not(:disabled) {
      background: #eaf3fc;
    }

    &:disabled {
      background: transparent;
      color: #b4bfcc;
      box-shadow: none;
      cursor: default;
    }
  }
}

.stepper__value {
  min-width: 28px;
  text-align: center;
  font-size: 17px;
  font-weight: 700;
}

.summary__total-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin: 16px 0 14px;
}

.summary__calc {
  color: var(--ink-soft);
}

.summary__total {
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 22px;
  font-weight: 700;
}

.summary__closed {
  margin-top: 16px;
}

.summary__hint {
  display: flex;
  gap: 6px;
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: #66758a;

  .v-icon {
    flex: none;
    margin-top: 1px;
    color: #8aa7c4;
  }
}

.note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 16px 0 14px;
  padding: 12px 14px;
  border-radius: 14px;
  line-height: 1.4;

  strong {
    display: block;
    font-weight: 700;
  }

  &--info {
    background: #eef5fc;
    color: #0b4fa8;
  }

  &--wait {
    background: #fff3e0;
    color: #8a4300;
  }

  &--ok {
    background: #e7f6ee;
    color: #0f6b3d;
  }
}

.note__sub {
  font-size: 13px;
  opacity: 0.85;
}

.note__pulse {
  flex: none;
  width: 10px;
  height: 10px;
  margin: 5px 5px 0;
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

@media (prefers-reduced-motion: reduce) {
  .note__pulse {
    animation: none;
  }
}

/* --- Кнопки --- */
.btn-block {
  width: 100%;
}

.btn-sky {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 48px !important;
  border-radius: 14px;
  color: #fff !important;
  background: linear-gradient(135deg, #1e88e5, #42a5f5) !important;
  box-shadow: 0 6px 16px rgba(30, 136, 229, 0.3);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  text-decoration: none;

  &.v-btn--disabled {
    background: #e6ebf1 !important;
    color: #7d8a9a !important;
    box-shadow: none;
    opacity: 1;

    :deep(.v-btn__overlay) {
      opacity: 0;
    }
  }
}

.btn-soft {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 42px;
  border: 1px solid #d6e3f0;
  border-radius: 12px;
  background: #f6f9fc;
  color: #0b4fa8;
  font: inherit;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover:not(:disabled) {
    background: #eaf3fc;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

/* --- Водитель --- */
.person__link {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: -6px;
  padding: 6px;
  border-radius: 16px;
  color: inherit;
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    background: #f3f7fb;
  }
}

.person__avatar {
  flex: none;
  border: 2px solid #fff;
  background: #dbeafe;
  color: #0b4fa8;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(30, 100, 160, 0.15);
}

.person__text {
  flex: 1;
  min-width: 0;
}

.person__name {
  font-size: 16px;
  font-weight: 700;
}

.person__rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #9a5200;

  .v-icon {
    color: #f5a300;
  }
}

.person__sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px 10px;
  font-size: 13px;
  color: var(--ink-soft);
}

.person__verified {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #1a73c9;
}

.person__chevron {
  color: #9aa6b5;
}

.car {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #f5f8fc;
}

.car__pic {
  flex: none;
  width: 64px;
  height: 44px;
  border-radius: 10px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, #bfe6fb, #eaf7ff);
  color: #1a7cc9;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.car__text {
  flex: 1;
  min-width: 0;
}

.car__model {
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.car__sub {
  font-size: 13px;
  color: var(--ink-soft);
}

.plate {
  flex: none;
  padding: 1px 6px;
  border: 1.5px solid var(--ink);
  border-radius: 4px;
  background: #fff;
  color: var(--ink);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.person__write {
  margin-top: 14px;
}

/* --- Не найдено --- */
.tp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  max-width: 420px;
  margin: 60px auto;
  padding: 36px 20px;
  border-radius: 22px;
  background: #fff;
  text-align: center;

  h3 {
    margin: 6px 0;
  }
}

.tp-empty__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, #bfe6fb, #eaf7ff);
  color: #1a7cc9;
}

/* --- Адаптив: билет → итог → водитель → комментарий --- */
@media (max-width: 900px) {
  .tp {
    padding: 28px 12px 90px;
  }

  .tp__title {
    font-size: 24px;
  }

  .tp__grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "ticket"
      "side"
      "driver"
      "desc";
    grid-template-rows: none;
  }

  .tp__side {
    position: static;
  }
}
</style>

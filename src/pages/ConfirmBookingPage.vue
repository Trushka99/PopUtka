<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import Chat from "@/components/Chat.vue";
import Loading from "@/components/Loading.vue";
import PayForm from "@/components/PayForm.vue";
import TripTicket from "@/components/TripTicket.vue";
import { confirmBooking, getBooking, rejectBooking } from "@/api";
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
const langStore = useLangStore();
const snackbar = useSnackbarStore();
const t = (key: string) => langStore.t(key);

// Сервер отдаёт { booking }, внутри — trip (с driver) и passenger
const booking = ref<any | null>(null);
const loading = ref(false);
const acting = ref(false);
const sheet = ref();

const bookingId = computed(() => String(route.params.id));

async function load() {
  loading.value = true;
  try {
    const res = await getBooking(bookingId.value);
    booking.value = res.data.data.booking ?? null;
  } catch (err) {
    console.error("Не удалось загрузить бронь", err);
    booking.value = null;
  } finally {
    loading.value = false;
  }
}

watch(bookingId, load, { immediate: true });

// ---------- Кто есть кто ----------
const trip = computed<any>(() => booking.value?.trip ?? {});
const isDriverView = computed(
  () => !!booking.value && trip.value.driverId === langStore.user.id,
);
// Второй участник: для водителя — пассажир, для пассажира — водитель
const counterpart = computed<any>(() =>
  isDriverView.value ? booking.value?.passenger : trip.value.driver,
);
const counterpartRole = computed(() =>
  isDriverView.value ? t("passenger") : t("driver"),
);

// ---------- Маршрут и цена ----------
const dateTitle = computed(() =>
  trip.value.departureAt
    ? capitalize(
        new Date(trip.value.departureAt).toLocaleDateString(
          localeOf(langStore.currentLang),
          { weekday: "long", day: "numeric", month: "long" },
        ),
      )
    : "",
);

const seats = computed(() => Number(booking.value?.seats ?? 1));
const seatsText = computed(
  () =>
    `${seats.value} ${pluralize(langStore.currentLang, seats.value, SEAT_FORMS)}`,
);
const total = computed(() => Number(trip.value.price ?? 0) * seats.value);

const ticketMeta = computed(() => [
  { label: t("seats_booked"), value: seats.value },
  ...(trip.value.maxTwoBackSeats ? [{ label: t("maxTwoBackSeats") }] : []),
  {
    label: t("booking"),
    value: trip.value.instantBooking ? t("instant") : t("with_confirmation"),
  },
]);

// ---------- Статус ----------
const tripClosed = computed(() =>
  ["completed", "cancelled"].includes(trip.value.status),
);

const status = computed<{
  text: string;
  tone: "wait" | "ok" | "bad" | "muted";
  icon?: string;
}>(() => {
  if (trip.value.status === "completed")
    return { text: t("trip_completed"), tone: "muted", icon: "mdi-flag-checkered" };
  if (trip.value.status === "cancelled")
    return { text: t("trip_cancelled"), tone: "muted", icon: "mdi-cancel" };
  switch (booking.value?.status) {
    case "confirmed":
      return { text: t("booking_confirmed"), tone: "ok", icon: "mdi-check-circle-outline" };
    case "rejected":
      return { text: t("booking_rejected"), tone: "bad", icon: "mdi-close-circle-outline" };
    case "cancelled":
      return { text: t("status_cancelled"), tone: "muted", icon: "mdi-cancel" };
    default:
      return {
        text: isDriverView.value ? t("new_request") : t("awaiting_driver"),
        tone: "wait",
      };
  }
});

const shortStamp = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString(localeOf(langStore.currentLang), {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// Лесенка: заявка → ответ водителя → поездка
const steps = computed(() => {
  const s = booking.value?.status;
  const answer =
    s === "confirmed"
      ? { label: t("driver_confirmed"), state: "done", time: shortStamp(booking.value?.updatedAt) }
      : s === "rejected"
        ? { label: t("driver_rejected"), state: "fail", time: shortStamp(booking.value?.updatedAt) }
        : s === "cancelled"
          ? { label: t("booking_cancelled_step"), state: "fail", time: shortStamp(booking.value?.updatedAt) }
          : { label: t("driver_answer"), state: "current", time: "" };

  const tripStep =
    trip.value.status === "completed"
      ? { label: t("trip_completed"), state: "done", time: "" }
      : trip.value.status === "cancelled"
        ? { label: t("trip_cancelled"), state: "fail", time: "" }
        : {
            label: t("trip_step"),
            state: s === "confirmed" ? "current" : "todo",
            time: dateTitle.value,
          };

  return [
    {
      key: "sent",
      label: t("request_sent"),
      state: "done",
      time: shortStamp(booking.value?.createdAt),
    },
    { key: "answer", ...answer },
    { key: "trip", ...tripStep },
  ];
});

// ---------- Действия водителя ----------
const canAnswer = computed(
  () =>
    isDriverView.value && booking.value?.status === "pending" && !tripClosed.value,
);

// Держим статус в сторе в актуальном состоянии (плашки в профиле)
const syncStore = (newStatus: string) => {
  for (const tr of langStore.user.activeTrips ?? []) {
    const b = tr.bookings?.find((x: any) => x.id === booking.value?.id);
    if (b) b.status = newStatus;
  }
};

const confirm = async () => {
  if (trip.value.status === "created") {
    sheet.value?.open();
    return;
  }
  acting.value = true;
  try {
    await confirmBooking(bookingId.value);
    booking.value.status = "confirmed";
    booking.value.updatedAt = new Date().toISOString();
    syncStore("confirmed");
    snackbar.success(t("booking_confirmed"));
  } catch (err) {
    console.error(err);
    snackbar.error(t("booking_confirm_error"));
  } finally {
    acting.value = false;
  }
};

const reject = async () => {
  acting.value = true;
  try {
    await rejectBooking(bookingId.value);
    booking.value.status = "rejected";
    booking.value.updatedAt = new Date().toISOString();
    syncStore("rejected");
    snackbar.info(t("booking_rejected"));
  } catch (err) {
    console.error(err);
    snackbar.error(t("booking_reject_error"));
  } finally {
    acting.value = false;
  }
};

// ---------- Контакты (только после подтверждения) ----------
const showContacts = computed(
  () => booking.value?.status === "confirmed" && !tripClosed.value,
);
const phoneHref = computed(() => {
  const phone = String(counterpart.value?.phone ?? "").replace(/[^\d+]/g, "");
  return phone ? `tel:${phone}` : "";
});
const telegramHref = computed(() => {
  const tg = String(counterpart.value?.telegram ?? "")
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/t\.me\//, "");
  return tg ? `https://t.me/${tg}` : "";
});

// Машина — когда второй участник водитель
const car = computed<any>(() => (isDriverView.value ? null : trip.value.driver?.car));
const carText = computed(() =>
  car.value
    ? [[car.value.brand, car.value.model].filter(Boolean).join(" "), car.value.color]
        .filter(Boolean)
        .join(" · ")
    : "",
);
</script>

<template>
  <Loading v-if="loading" />

  <div v-else-if="booking" class="bp">
    <div class="bp__top">
      <RouterLink class="bp__back" :to="{ path: '/users/me', query: { tab: 'bookings' } }">
        <v-icon size="20">mdi-arrow-left</v-icon>
        {{ t("bookings") }}
      </RouterLink>
      <span class="status" :class="`status--${status.tone}`">
        <span v-if="status.tone === 'wait'" class="status__pulse"></span>
        <v-icon v-else-if="status.icon" size="15">{{ status.icon }}</v-icon>
        {{ status.text }}
      </span>
    </div>

    <h1 class="bp__title">{{ dateTitle }}</h1>

    <div class="bp__grid">
      <!-- ===== Левая колонка ===== -->
      <div class="bp__col">
        <TripTicket :trip="trip" :meta="ticketMeta" />

        <section v-if="counterpart" class="panel person">
          <RouterLink
            class="person__link"
            :to="{ name: 'user', params: { id: counterpart.id } }"
          >
            <v-avatar size="52" class="person__avatar">
              <v-img
                v-if="counterpart.avatar"
                :src="mediaUrl(counterpart.avatar)"
                cover
              />
              <span v-else>{{
                initialsOf(counterpart.firstName, counterpart.lastName)
              }}</span>
            </v-avatar>
            <div class="person__text">
              <div class="person__name">
                {{ counterpart.firstName }} {{ counterpart.lastName }}
                <span class="person__rating">
                  <v-icon size="14">mdi-star</v-icon>
                  {{ formatRating(counterpart.rating) }}
                </span>
              </div>
              <div class="person__sub">
                {{ counterpartRole }}
                <span v-if="counterpart.phoneVerified" class="person__verified">
                  <v-icon size="14">mdi-phone-check</v-icon>
                  {{ t("phone_verified") }}
                </span>
              </div>
              <div v-if="carText" class="person__car">
                <v-icon size="15">mdi-car-side</v-icon>
                {{ carText }}
                <span v-if="car?.licensePlate" class="plate">{{
                  car.licensePlate
                }}</span>
              </div>
            </div>
            <v-icon class="person__chevron">mdi-chevron-right</v-icon>
          </RouterLink>

          <div v-if="showContacts && (phoneHref || telegramHref)" class="person__actions">
            <a v-if="phoneHref" class="btn-soft" :href="phoneHref">
              <v-icon size="18">mdi-phone-outline</v-icon>
              {{ t("call") }}
            </a>
            <a
              v-if="telegramHref"
              class="btn-soft"
              :href="telegramHref"
              target="_blank"
              rel="noopener noreferrer"
            >
              <v-icon size="18">mdi-send-outline</v-icon>
              Telegram
            </a>
          </div>
        </section>

        <section v-if="trip.description" class="panel">
          <div class="panel__title">{{ t("description") }}</div>
          <p class="panel__text">{{ trip.description }}</p>
        </section>
      </div>

      <!-- ===== Правая колонка ===== -->
      <div class="bp__col">
        <section class="panel summary">
          <div class="summary__price">
            <span class="summary__calc">
              {{ formatPrice(trip.price) }} UZS × {{ seatsText }}
            </span>
            <span class="summary__total">{{ formatPrice(total) }} UZS</span>
          </div>

          <ol class="steps">
            <li
              v-for="step in steps"
              :key="step.key"
              class="step"
              :class="`step--${step.state}`"
            >
              <span class="step__mark">
                <v-icon v-if="step.state === 'done'" size="13">mdi-check</v-icon>
                <v-icon v-else-if="step.state === 'fail'" size="13">mdi-close</v-icon>
              </span>
              <span class="step__label">{{ step.label }}</span>
              <span v-if="step.time" class="step__time">{{ step.time }}</span>
            </li>
          </ol>

          <div v-if="canAnswer" class="summary__actions">
            <v-btn
              variant="flat"
              class="btn-outline-danger"
              prepend-icon="mdi-close"
              :disabled="acting"
              @click="reject"
            >
              {{ t("reject") }}
            </v-btn>
            <v-btn
              variant="flat"
              class="btn-sky"
              prepend-icon="mdi-check"
              :loading="acting"
              @click="confirm"
            >
              {{ t("accept") }}
            </v-btn>
          </div>
        </section>

        <Chat
          v-if="counterpart"
          :partner-id="counterpart.id"
          :partner="counterpart"
          variant="embedded"
        />
      </div>
    </div>
  </div>

  <div v-else class="bp-empty">
    <span class="bp-empty__icon"><v-icon size="30">mdi-ticket-confirmation-outline</v-icon></span>
    <h3>{{ t("booking_not_found") }}</h3>
    <RouterLink class="bp__back" :to="{ path: '/users/me', query: { tab: 'bookings' } }">
      <v-icon size="20">mdi-arrow-left</v-icon>
      {{ t("bookings") }}
    </RouterLink>
  </div>

  <PayForm
    v-if="booking"
    ref="sheet"
    :bookingId="bookingId"
    :trip="{ type: 'booking', data: booking.trip }"
  />
</template>

<style scoped lang="scss">
.bp {
  --ink: #0b3550;
  --ink-soft: #5a7085;

  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 36px 20px 48px;
  box-sizing: border-box;
  color: var(--ink);
}

.bp__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.bp__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px 6px 8px;
  border-radius: 999px;
  color: #43526a;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.8);
  }
}

.bp__title {
  margin: 10px 0 18px;
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.15;
}

.bp__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.bp__col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
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

  &--wait {
    background: #fff3e0;
    color: #9a4a00;
  }

  &--ok {
    background: #e7f6ee;
    color: #0f6b3d;
  }

  &--bad {
    background: #fdecea;
    color: #a32020;
  }

  &--muted {
    background: #eef1f5;
    color: #5a6676;
  }
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

@media (prefers-reduced-motion: reduce) {
  .status__pulse {
    animation: none;
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

/* --- Второй участник --- */
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

.person__sub,
.person__car {
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
  color: #0f6b3d;
}

.person__car {
  margin-top: 2px;
}

.plate {
  padding: 0 5px;
  border: 1.5px solid var(--ink);
  border-radius: 4px;
  background: #fff;
  color: var(--ink);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.person__chevron {
  color: #9aa6b5;
}

.person__actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.btn-soft {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 42px;
  border: 1px solid #d6e3f0;
  border-radius: 12px;
  background: #f6f9fc;
  color: #0b4fa8;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    background: #eaf3fc;
  }
}

/* --- Итог и статус --- */
.summary__price {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px 12px;
  padding-bottom: 14px;
  border-bottom: 2px dashed #e3ecf5;
}

.summary__calc {
  color: var(--ink-soft);
}

.summary__total {
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #d65500;
}

.steps {
  position: relative;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.step {
  position: relative;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 7px 0;

  &:not(:last-child)::after {
    content: "";
    position: absolute;
    left: 10px;
    top: 30px;
    bottom: -8px;
    width: 2px;
    background: #e3ecf5;
  }

  &--done:not(:last-child)::after {
    background: #9ad7b3;
  }
}

.step__mark {
  position: relative;
  z-index: 1;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 2px solid #d6dee8;
  background: #fff;
  color: #fff;

  .step--done & {
    border-color: #1f9d55;
    background: #1f9d55;
  }

  .step--fail & {
    border-color: #d64545;
    background: #d64545;
  }

  .step--current & {
    border-color: #ff8a00;
    background: #fff3e0;
  }
}

.step__label {
  font-weight: 600;

  .step--todo & {
    color: #9aa6b5;
    font-weight: 500;
  }
}

.step__time {
  font-size: 12px;
  color: #8a97a8;
  text-align: right;
}

.summary__actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;

  .v-btn {
    flex: 1;
    height: 44px;
  }
}

.btn-sky,
.btn-outline-danger {
  border-radius: 12px;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}

.btn-sky {
  color: #fff !important;
  background: linear-gradient(135deg, #1e88e5, #42a5f5) !important;
  box-shadow: 0 4px 12px rgba(30, 136, 229, 0.3);
}

.btn-outline-danger {
  color: #c0362c !important;
  background: #fff !important;
  border: 1px solid #f3c7c2;
}

/* --- Не найдено --- */
.bp-empty {
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

.bp-empty__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, #bfe6fb, #eaf7ff);
  color: #1a7cc9;
}

/* --- Адаптив --- */
@media (max-width: 900px) {
  .bp {
    padding: 28px 12px 90px;
  }

  .bp__title {
    font-size: 24px;
  }

  .bp__grid {
    grid-template-columns: 1fr;
  }
}
</style>

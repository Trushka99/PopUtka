<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import cities from "../utils/dictionary.json";
import { createTrip } from "@/api";
import { useLangStore } from "@/stores/langStore";
import { useSnackbarStore } from "@/stores/snackbarStore";
import { useTripStore } from "@/stores/tripStore";
import {
  SEAT_FORMS,
  capitalize,
  dayLabel,
  formatPrice,
  localeOf,
  pluralize,
} from "@/utils/tripFormat";

const props = defineProps<{
  closeDialog?: () => void;
}>();

const router = useRouter();
const langStore = useLangStore();
const snackbar = useSnackbarStore();
const tripStore = useTripStore();
const t = (key: string) => langStore.t(key);

// ---------- Даты ----------
// Локальная дата YYYY-MM-DD (toISOString дал бы дату по UTC — около полуночи это «вчера»)
const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayStr = () => localDate(new Date());
const tomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return localDate(d);
};

// ---------- Поля формы ----------
const from = ref("");
const to = ref("");
const fromAddress = ref("");
const toAddress = ref("");
const date = ref(todayStr());
const departureTime = ref("");
const price = ref<number | null>(null);
const availableSeats = ref(3);
const description = ref("");
const maxTwoBackSeats = ref(false);

const dateMenu = ref(false);
const timeMenu = ref(false);

const cityList = computed(() =>
  Object.values(cities[langStore.currentLang as keyof typeof cities] || {}),
);

const swapCities = () => {
  [from.value, to.value] = [to.value, from.value];
  [fromAddress.value, toAddress.value] = [toAddress.value, fromAddress.value];
};

// --- Когда ---
const QUICK_TIMES = ["07:00", "09:00", "14:00", "18:00"];

const departure = computed(() =>
  date.value && departureTime.value
    ? new Date(`${date.value}T${departureTime.value}:00`)
    : null,
);

const isPastTime = (time: string) =>
  new Date(`${date.value}T${time}:00`).getTime() <= Date.now();

const dateKind = computed(() => {
  if (date.value === todayStr()) return "today";
  if (date.value === tomorrowStr()) return "tomorrow";
  return "other";
});

const otherDateLabel = computed(() =>
  dateKind.value === "other"
    ? capitalize(
        new Date(`${date.value}T00:00:00`).toLocaleDateString(
          localeOf(langStore.currentLang),
          { weekday: "short", day: "numeric", month: "short" },
        ),
      )
    : t("other_date"),
);

const pickDay = (kind: "today" | "tomorrow") => {
  date.value = kind === "today" ? todayStr() : tomorrowStr();
  // Если выбранное время уже прошло сегодня — сбрасываем его
  if (departureTime.value && isPastTime(departureTime.value)) {
    departureTime.value = "";
  }
};

const onDatePicked = (val: unknown) => {
  if (val instanceof Date) date.value = localDate(val);
  else if (typeof val === "string") date.value = val.slice(0, 10);
  dateMenu.value = false;
  if (departureTime.value && isPastTime(departureTime.value)) {
    departureTime.value = "";
  }
};

const customTime = computed(
  () => !!departureTime.value && !QUICK_TIMES.includes(departureTime.value),
);

const onTimePicked = (val: string) => {
  departureTime.value = val;
  if (val?.length === 5) timeMenu.value = false;
};

// --- Места и цена ---
const MAX_SEATS = 8;
const seatSlots = computed(() => Math.max(4, availableSeats.value));
const seatsText = computed(
  () =>
    `${availableSeats.value} ${pluralize(langStore.currentLang, availableSeats.value, SEAT_FORMS)}`,
);

const PRICE_STEP = 5000;
const changePrice = (delta: number) => {
  price.value = Math.max(0, (price.value ?? 0) + delta);
};

// ---------- Прогресс (по нему едет машинка) ----------
const stepRouteDone = computed(
  () => !!from.value && !!to.value && from.value !== to.value,
);
const stepWhenDone = computed(
  () => !!departure.value && departure.value.getTime() > Date.now(),
);
const stepSeatsDone = computed(
  () => (price.value ?? 0) > 0 && availableSeats.value >= 1,
);
const progress = computed(
  () =>
    [stepRouteDone.value, stepWhenDone.value, stepSeatsDone.value].filter(
      Boolean,
    ).length / 3,
);

// ---------- Превью ----------
const previewDay = computed(() =>
  date.value
    ? dayLabel(`${date.value}T12:00:00`, langStore.currentLang, t)
    : "",
);
const total = computed(() => (price.value ?? 0) * availableSeats.value);

// ---------- Отправка ----------
type Phase = "form" | "sending" | "done";
const phase = ref<Phase>("form");
const formError = ref("");

const validationError = computed(() => {
  if (!from.value) return t("selDeparture");
  if (!to.value) return t("selDest");
  if (from.value === to.value) return t("same_cities");
  if (!departureTime.value) return t("selectDepartureTime");
  if (!departure.value || departure.value.getTime() <= Date.now())
    return t("departureMustBeFuture");
  if (!price.value || price.value <= 0) return t("enterPrice");
  return "";
});

const tripData = computed(() => ({
  from: { cityKey: langStore.cKeyByValue(from.value), address: fromAddress.value },
  to: { cityKey: langStore.cKeyByValue(to.value), address: toAddress.value },
  departureAt: departure.value ? departure.value.toISOString() : "",
  price: price.value ?? 0,
  availableSeats: availableSeats.value,
  description: description.value,
  maxTwoBackSeats: maxTwoBackSeats.value,
}));

const publishedSummary = ref("");

const submitTrip = async () => {
  formError.value = "";
  if (validationError.value) {
    formError.value = validationError.value;
    return;
  }

  phase.value = "sending";
  const startedAt = Date.now();
  try {
    const res = await createTrip(tripData.value);
    tripStore.addTrip(res.data.data);
    // Дадим утке доехать хотя бы до середины — иначе анимация мелькнёт
    const wait = 900 - (Date.now() - startedAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));

    publishedSummary.value = `${from.value} → ${to.value}, ${previewDay.value.toLowerCase()} · ${departureTime.value}`;
    phase.value = "done";
    snackbar.success(t("tripCreated"));
    // Обновляем профиль, чтобы новая поездка сразу появилась в «Бронированиях»
    langStore.initUser();
  } catch (err) {
    console.error(err);
    phase.value = "form";
    formError.value = t("tripCreateError");
  }
};

const resetForm = () => {
  from.value = "";
  to.value = "";
  fromAddress.value = "";
  toAddress.value = "";
  date.value = todayStr();
  departureTime.value = "";
  price.value = null;
  availableSeats.value = 3;
  description.value = "";
  maxTwoBackSeats.value = false;
  formError.value = "";
  phase.value = "form";
};

const close = () => {
  if (phase.value === "done") resetForm();
  props.closeDialog?.();
};

const goToMyTrips = () => {
  resetForm();
  props.closeDialog?.();
  router.push({ path: "/users/me", query: { tab: "bookings" } });
};

// Где стоит утка на дороге: от левого края до правого с отступом в полмашинки,
// чтобы она целиком оставалась в окне
const duckLeft = computed(
  () => `calc(48px + (100% - 96px) * ${progress.value.toFixed(3)})`,
);
</script>

<template>
  <section class="ct">
    <!-- ===== Небесная шапка с дорогой ===== -->
    <header class="ct__sky" :class="`ct__sky--${phase}`">
      <span class="cloud cloud--a" aria-hidden="true"></span>
      <span class="cloud cloud--b" aria-hidden="true"></span>
      <span class="cloud cloud--c" aria-hidden="true"></span>

      <div class="ct__heading">
        <h2 class="ct__title">
          {{ phase === "done" ? t("published_title") : t("new_trip_title") }}
        </h2>
        <p class="ct__subtitle">
          {{
            phase === "sending"
              ? t("publishing")
              : phase === "done"
                ? publishedSummary
                : t("new_trip_subtitle")
          }}
        </p>
      </div>

      <button
        type="button"
        class="ct__close"
        :aria-label="t('cancel')"
        @click="close"
      >
        <v-icon size="20">mdi-close</v-icon>
      </button>

      <!-- Отдельная полоса под текстом: утка едет только здесь и не заезжает на заголовок -->
      <div class="ct__lane" aria-hidden="true">
        <div class="road"><span class="road__dash"></span></div>
        <div
          class="duck"
          :class="`duck--${phase}`"
          :style="phase === 'form' ? { left: duckLeft } : undefined"
        >
          <img src="/images/duckCar.png" alt="" />
        </div>

        <div v-if="phase === 'done'" class="ct__check">
          <v-icon size="34">mdi-check</v-icon>
        </div>
      </div>
    </header>

    <!-- ===== Успех ===== -->
    <div v-if="phase === 'done'" class="ct__done">
      <div class="ct__done-actions">
        <button type="button" class="btn-soft" @click="close">
          {{ t("done") }}
        </button>
        <button type="button" class="btn-sky" @click="goToMyTrips">
          <v-icon size="18">mdi-ticket-confirmation-outline</v-icon>
          {{ t("to_my_trips") }}
        </button>
      </div>
    </div>

    <!-- ===== Форма ===== -->
    <div v-else class="ct__body" :class="{ 'ct__body--busy': phase === 'sending' }">
      <div class="ct__form">
        <!-- Шаг 1. Маршрут -->
        <div class="step">
          <span class="step__num" :class="{ 'step__num--done': stepRouteDone }">
            <v-icon v-if="stepRouteDone" size="14">mdi-check</v-icon>
            <template v-else>1</template>
          </span>
          <div class="step__body">
            <div class="step__title">{{ t("step_route") }}</div>
            <div class="route">
              <div class="route__rail">
                <span class="route__dot"></span>
                <span class="route__line"></span>
                <span class="route__dot route__dot--end"></span>
              </div>
              <div class="route__fields">
                <div class="route__point">
                  <v-autocomplete
                    v-model="from"
                    :items="cityList"
                    :label="t('from')"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    bg-color="white"
                    color="#1e88e5"
                    hide-details
                  />
                  <v-text-field
                    v-model="fromAddress"
                    :placeholder="t('addressFrom')"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    bg-color="white"
                    color="#1e88e5"
                    prepend-inner-icon="mdi-map-marker-outline"
                    hide-details
                  />
                </div>
                <div class="route__point">
                  <v-autocomplete
                    v-model="to"
                    :items="cityList"
                    :label="t('to')"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    bg-color="white"
                    color="#1e88e5"
                    hide-details
                  />
                  <v-text-field
                    v-model="toAddress"
                    :placeholder="t('addressTo')"
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    bg-color="white"
                    color="#1e88e5"
                    prepend-inner-icon="mdi-map-marker-outline"
                    hide-details
                  />
                </div>
              </div>
              <button
                type="button"
                class="route__swap"
                :aria-label="t('swap_cities')"
                :title="t('swap_cities')"
                @click="swapCities"
              >
                <v-icon size="20">mdi-swap-vertical</v-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Шаг 2. Когда -->
        <div class="step">
          <span class="step__num" :class="{ 'step__num--done': stepWhenDone }">
            <v-icon v-if="stepWhenDone" size="14">mdi-check</v-icon>
            <template v-else>2</template>
          </span>
          <div class="step__body">
            <div class="step__title">{{ t("step_when") }}</div>
            <div class="chips">
              <button
                type="button"
                class="chip"
                :class="{ 'chip--on': dateKind === 'today' }"
                @click="pickDay('today')"
              >
                {{ t("today") }}
              </button>
              <button
                type="button"
                class="chip"
                :class="{ 'chip--on': dateKind === 'tomorrow' }"
                @click="pickDay('tomorrow')"
              >
                {{ t("tomorrow") }}
              </button>
              <v-menu v-model="dateMenu" :close-on-content-click="false" location="bottom start">
                <template #activator="{ props: menuProps }">
                  <button
                    type="button"
                    class="chip"
                    :class="{ 'chip--on': dateKind === 'other' }"
                    v-bind="menuProps"
                  >
                    <v-icon size="16">mdi-calendar-blank-outline</v-icon>
                    {{ otherDateLabel }}
                  </button>
                </template>
                <v-date-picker
                  :model-value="new Date(`${date}T00:00:00`)"
                  :min="todayStr()"
                  color="#1e88e5"
                  @update:model-value="onDatePicked"
                />
              </v-menu>
            </div>

            <div class="chips">
              <button
                v-for="time in QUICK_TIMES"
                :key="time"
                type="button"
                class="chip chip--time"
                :class="{ 'chip--on': departureTime === time }"
                :disabled="isPastTime(time)"
                @click="departureTime = time"
              >
                {{ time }}
              </button>
              <v-menu v-model="timeMenu" :close-on-content-click="false" location="bottom start">
                <template #activator="{ props: menuProps }">
                  <button
                    type="button"
                    class="chip"
                    :class="{ 'chip--on': customTime }"
                    v-bind="menuProps"
                  >
                    <v-icon size="16">mdi-clock-outline</v-icon>
                    {{ customTime ? departureTime : t("own_time") }}
                  </button>
                </template>
                <v-time-picker
                  :model-value="departureTime"
                  format="24hr"
                  color="#1e88e5"
                  @update:model-value="onTimePicked"
                />
              </v-menu>
            </div>
          </div>
        </div>

        <!-- Шаг 3. Места и цена -->
        <div class="step">
          <span class="step__num" :class="{ 'step__num--done': stepSeatsDone }">
            <v-icon v-if="stepSeatsDone" size="14">mdi-check</v-icon>
            <template v-else>3</template>
          </span>
          <div class="step__body">
            <div class="step__title">{{ t("step_seats_price") }}</div>

            <div class="seats">
              <button
                v-for="n in seatSlots"
                :key="n"
                type="button"
                class="seat"
                :class="{ 'seat--on': n <= availableSeats }"
                :aria-label="`${n}`"
                @click="availableSeats = n"
              >
                <v-icon size="20">mdi-seat-passenger</v-icon>
              </button>
              <button
                v-if="seatSlots < MAX_SEATS"
                type="button"
                class="seat seat--add"
                :aria-label="t('more_seats')"
                :title="t('more_seats')"
                @click="availableSeats = seatSlots + 1"
              >
                <v-icon size="18">mdi-plus</v-icon>
              </button>
              <span class="seats__text">{{ seatsText }}</span>
            </div>

            <div class="price">
              <button
                type="button"
                class="price__btn"
                aria-label="−"
                @click="changePrice(-PRICE_STEP)"
              >
                <v-icon size="18">mdi-minus</v-icon>
              </button>
              <input
                v-model.number="price"
                class="price__input"
                type="number"
                inputmode="numeric"
                min="0"
                :step="PRICE_STEP"
                placeholder="0"
                :aria-label="t('price')"
              />
              <span class="price__unit">UZS · {{ t("per_seat") }}</span>
              <button
                type="button"
                class="price__btn"
                aria-label="+"
                @click="changePrice(PRICE_STEP)"
              >
                <v-icon size="18">mdi-plus</v-icon>
              </button>
            </div>

            <div class="chips">
              <button
                type="button"
                class="chip"
                :class="{ 'chip--on': maxTwoBackSeats }"
                :aria-pressed="maxTwoBackSeats"
                @click="maxTwoBackSeats = !maxTwoBackSeats"
              >
                <v-icon size="16">{{
                  maxTwoBackSeats ? "mdi-check" : "mdi-account-multiple-outline"
                }}</v-icon>
                {{ t("maxTwoBackSeats") }}
              </button>
            </div>

            <v-textarea
              v-model="description"
              :label="t('comment_for_passengers')"
              :placeholder="t('comment_placeholder')"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              bg-color="white"
              color="#1e88e5"
              rows="2"
              auto-grow
              hide-details
              class="ct__comment"
            />
          </div>
        </div>
      </div>

      <!-- ===== Живой билет и кнопка ===== -->
      <aside class="ct__side">
        <div class="ct__side-label">{{ t("preview_title") }}</div>

        <div class="ticket">
          <span class="cloud cloud--t" aria-hidden="true"></span>
          <div class="ticket__head">
            <span class="ticket__day">{{ previewDay }}</span>
            <span class="ticket__price">
              <b>{{ price ? formatPrice(price) : "—" }}</b> UZS
            </span>
          </div>
          <div class="ticket__route">
            <div class="ticket__point">
              <div class="ticket__time">{{ departureTime || "--:--" }}</div>
              <div class="ticket__city">{{ from || t("from") }}</div>
            </div>
            <div class="ticket__line">
              <span class="ticket__car" :style="{ left: `${progress * 100}%` }">
                <v-icon size="15">mdi-car-side</v-icon>
              </span>
            </div>
            <div class="ticket__point ticket__point--end">
              <div class="ticket__time">&nbsp;</div>
              <div class="ticket__city">{{ to || t("to") }}</div>
            </div>
          </div>
          <div class="ticket__meta">
            <span><v-icon size="14">mdi-seat-passenger</v-icon> {{ seatsText }}</span>
            <span v-if="maxTwoBackSeats"
              ><v-icon size="14">mdi-account-multiple-outline</v-icon>
              {{ t("maxTwoBackSeats") }}</span
            >
          </div>
        </div>

        <div v-if="total > 0" class="ct__total">
          <span>{{ seatsText }} × {{ formatPrice(price) }}</span>
          <b>{{ t("up_to") }} {{ formatPrice(total) }} UZS</b>
        </div>

        <div v-if="formError" class="ct__error" role="alert">
          <v-icon size="18">mdi-alert-circle-outline</v-icon>
          {{ formError }}
        </div>

        <button
          type="button"
          class="publish"
          :disabled="phase === 'sending'"
          @click="submitTrip"
        >
          <v-progress-circular
            v-if="phase === 'sending'"
            indeterminate
            size="18"
            width="2"
            color="white"
          />
          <v-icon v-else size="20">mdi-rocket-launch-outline</v-icon>
          {{ phase === "sending" ? t("publishing") : t("publish_trip") }}
        </button>
      </aside>
    </div>
  </section>
</template>

<style scoped lang="scss">
.ct {
  --ink: #0b3550;
  --ink-soft: #5a7085;

  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  max-height: calc(100dvh - 32px);
  overflow: hidden;
  border-radius: 26px;
  background: #fff;
  color: var(--ink);
}

/* ================= Шапка ================= */
.ct__sky {
  position: relative;
  flex: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  isolation: isolate;
  padding: 18px 22px 0;
  background:
    radial-gradient(
      260px 100px at 88% 0%,
      rgba(255, 255, 255, 0.9),
      transparent 70%
    ),
    linear-gradient(160deg, #7fcaf2 0%, #bfe6fb 55%, #eaf7ff 100%);
}

.ct__heading {
  position: relative;
  max-width: calc(100% - 50px);
}

/* Полоса с дорогой — всегда под текстом, на всю ширину шапки */
.ct__lane {
  position: relative;
  height: 78px;
  margin: 6px -22px 0;
  transition: height 0.35s ease;

  .ct__sky--done & {
    height: 118px;
  }
}

.ct__title {
  margin: 0;
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.15;
}

.ct__subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: rgba(11, 53, 80, 0.7);
}

.ct__close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.6);
  color: var(--ink);
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.95);
  }
}

.cloud {
  position: absolute;
  z-index: -1;
  width: 70px;
  height: 22px;
  border-radius: 22px;
  background: #fff;
  opacity: 0.75;
  animation: drift 11s ease-in-out infinite alternate;

  &::before,
  &::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    background: inherit;
  }

  &::before {
    width: 32px;
    height: 32px;
    top: -16px;
    left: 10px;
  }

  &::after {
    width: 25px;
    height: 25px;
    top: -11px;
    left: 34px;
  }

  &--a {
    top: 34px;
    right: 22%;
  }

  &--b {
    top: 64px;
    right: 6%;
    scale: 0.6;
    opacity: 0.6;
    animation-duration: 14s;
  }

  &--c {
    top: 26px;
    left: 52%;
    scale: 0.5;
    opacity: 0.5;
    animation-duration: 17s;
    animation-direction: alternate-reverse;
  }
}

@keyframes drift {
  from {
    translate: 0 0;
  }
  to {
    translate: 16px 0;
  }
}

/* --- Дорога и утка --- */
.road {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 30px;
  background: linear-gradient(180deg, #9ed4f4, #86c6ee);
}

.road__dash {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 3px;
  margin-top: -1.5px;
  background: repeating-linear-gradient(
    90deg,
    #fff 0 18px,
    transparent 18px 32px
  );

  .ct__sky--sending & {
    animation: road-move 0.5s linear infinite;
  }
}

@keyframes road-move {
  from {
    background-position: 0 0;
  }
  to {
    background-position: -32px 0;
  }
}

.duck {
  position: absolute;
  bottom: 14px;
  width: 70px;
  translate: -50% 0;
  transition: left 0.8s cubic-bezier(0.34, 1.3, 0.64, 1);

  img {
    display: block;
    width: 100%;
    filter: drop-shadow(0 5px 6px rgba(0, 30, 70, 0.3));
    transform-origin: 50% 100%;
    animation: bump 0.5s ease-in-out infinite alternate;
  }

  /* Публикуем — утка мчится вправо и заезжает снова слева */
  &--sending {
    left: 0;
    transition: none;
    animation: zoom 1.4s cubic-bezier(0.45, 0, 0.55, 1) infinite;

    img {
      animation-duration: 0.25s;
    }
  }

  /* Готово — стоит в конце дороги */
  &--done {
    left: calc(100% - 56px);
    transition: none;
    animation: arrive 0.6s cubic-bezier(0.34, 1.4, 0.64, 1);
  }
}

@keyframes bump {
  from {
    translate: 0 0;
    rotate: 0deg;
  }
  to {
    translate: 0 -2px;
    rotate: -1deg;
  }
}

@keyframes zoom {
  from {
    left: -12%;
  }
  to {
    left: 112%;
  }
}

@keyframes arrive {
  from {
    left: 60%;
  }
  to {
    left: calc(100% - 56px);
  }
}

.ct__check {
  position: absolute;
  left: 50%;
  top: 8px;
  width: 64px;
  height: 64px;
  margin-left: -32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #1f9d55;
  color: #fff;
  box-shadow: 0 0 0 10px rgba(255, 255, 255, 0.55);
  animation: pop 0.5s cubic-bezier(0.34, 1.6, 0.64, 1);
}

@keyframes pop {
  from {
    scale: 0.3;
    opacity: 0;
  }
  to {
    scale: 1;
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cloud,
  .road__dash,
  .duck,
  .duck img,
  .ct__check {
    animation: none !important;
    transition: none !important;
  }
}

/* ================= Успех ================= */
.ct__done {
  padding: 22px;
}

.ct__done-actions {
  display: flex;
  gap: 10px;

  > * {
    flex: 1;
  }
}

/* ================= Форма ================= */
.ct__body {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 22px;
  min-width: 0;
  padding: 20px 22px 22px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #c9dced transparent;
  transition: opacity 0.2s ease;

  &--busy .ct__form {
    opacity: 0.55;
    pointer-events: none;
  }
}

.step {
  display: flex;
  gap: 12px;

  & + & {
    margin-top: 20px;
  }
}

.step__num {
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #e8f1fd;
  color: #0b4fa8;
  font-size: 13px;
  font-weight: 700;
  transition:
    background 0.25s ease,
    color 0.25s ease;

  &--done {
    background: #1f9d55;
    color: #fff;
  }
}

.step__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step__title {
  padding-top: 3px;
  font-size: 15px;
  font-weight: 700;
}

/* --- Маршрут --- */
.route {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) 36px;
  gap: 10px;
  align-items: stretch;
}

.route__rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 0;
}

.route__dot {
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid #2b8fd6;
  background: #fff;

  &--end {
    background: #2b8fd6;
  }
}

.route__line {
  flex: 1;
  width: 2px;
  margin: 4px 0;
  background: repeating-linear-gradient(
    180deg,
    #2b8fd6 0 5px,
    transparent 5px 10px
  );
}

.route__fields {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ct__form,
.ct__side {
  min-width: 0;
}

.route__point {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.route__swap {
  align-self: center;
  width: 36px;
  height: 36px;
  border: 1px solid #d6e3f1;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #e9f1fa;
  color: #0b4fa8;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.3s ease;

  &:hover {
    background: #dde9f6;
  }

  &:active {
    transform: rotate(180deg);
  }
}

/* --- Чипы --- */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid #d6e3f1;
  border-radius: 999px;
  background: #fff;
  color: #2c4a6e;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;

  &:hover:not(:disabled) {
    background: #f1f6fc;
  }

  &--on,
  &--on:hover:not(:disabled) {
    border-color: #9cc6f0;
    background: #e3effc;
    color: #0b4fa8;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--time {
    font-family: "Exo 2", "Roboto", sans-serif;
    font-variant-numeric: tabular-nums;
  }
}

/* --- Места --- */
.seats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.seat {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #eef2f7;
  color: #9aa6b5;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.15s ease;

  &:active {
    transform: scale(0.92);
  }

  &--on {
    background: linear-gradient(135deg, #1e88e5, #42a5f5);
    color: #fff;
    box-shadow: 0 3px 8px rgba(30, 136, 229, 0.3);
  }

  &--add {
    border: 1px dashed #b9cde2;
    background: transparent;
    color: #6b7d94;
  }
}

.seats__text {
  margin-left: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-soft);
}

/* --- Цена --- */
.price {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 52px;
  padding: 0 8px;
  border: 1px solid #d6e3f1;
  border-radius: 16px;
  background: #fff;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus-within {
    border-color: #64b5f6;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.15);
  }
}

.price__btn {
  flex: none;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #e9f1fa;
  color: #0b4fa8;
  cursor: pointer;

  &:hover {
    background: #dde9f6;
  }
}

.price__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #d65500;
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 22px;
  font-weight: 700;
  text-align: right;
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &::placeholder {
    color: #c9b8aa;
  }
}

.price__unit {
  flex: none;
  font-size: 13px;
  color: var(--ink-soft);
}

.ct__comment {
  margin-top: 2px;
}

/* ================= Правая колонка ================= */
.ct__side {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ct__side-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #8a97a8;
}

.ticket {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  padding: 14px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  background:
    radial-gradient(
      200px 80px at 88% 0%,
      rgba(255, 255, 255, 0.9),
      transparent 70%
    ),
    radial-gradient(
      240px 90px at 0% 100%,
      rgba(255, 255, 255, 0.7),
      transparent 70%
    ),
    linear-gradient(160deg, #7fcaf2 0%, #bfe6fb 50%, #eaf7ff 100%);
  box-shadow: 0 10px 24px rgba(30, 90, 140, 0.15);
}

.cloud--t {
  top: 30px;
  right: 30%;
  scale: 0.7;
}

.ticket__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ticket__day {
  padding: 4px 11px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: #0b4fa8;
  font-size: 12px;
  font-weight: 600;
}

.ticket__price {
  padding: 4px 11px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  color: rgba(11, 53, 80, 0.65);

  b {
    font-family: "Exo 2", "Roboto", sans-serif;
    font-size: 17px;
    color: #d65500;
  }
}

.ticket__route {
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(50px, 1fr) minmax(0, auto);
  align-items: end;
  gap: 12px;
  margin: 16px 0 12px;
}

.ticket__point--end {
  text-align: right;
}

.ticket__time {
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.1;
}

.ticket__city {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
}

.ticket__line {
  position: relative;
  height: 2px;
  margin-bottom: 10px;
  background: repeating-linear-gradient(
    90deg,
    #2b8fd6 0 6px,
    transparent 6px 11px
  );
}

.ticket__car {
  position: absolute;
  top: 50%;
  width: 28px;
  height: 28px;
  translate: -50% -50%;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #fff;
  color: #1a7cc9;
  box-shadow: 0 3px 8px rgba(30, 100, 160, 0.25);
  transition: left 0.8s cubic-bezier(0.34, 1.3, 0.64, 1);
}

.ticket__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  font-size: 12px;
  color: rgba(11, 53, 80, 0.7);

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}

.ct__total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 14px;
  background: #f6f9fc;
  font-size: 13px;
  color: var(--ink-soft);

  b {
    color: var(--ink);
    font-weight: 700;
  }
}

.ct__error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 14px;
  background: #fdecea;
  color: #b42318;
  font-size: 14px;
  font-weight: 500;
}

.publish {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 52px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #ff6d00, #ff9100);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(255, 109, 0, 0.3);
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(255, 109, 0, 0.38);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    cursor: progress;
    opacity: 0.85;
  }
}

/* --- Кнопки успеха --- */
.btn-soft,
.btn-sky {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 48px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.btn-soft {
  border: 1px solid #d6e3f1;
  background: #f6f9fc;
  color: #2c4a6e;
}

.btn-sky {
  border: none;
  background: linear-gradient(135deg, #1e88e5, #42a5f5);
  color: #fff;
  box-shadow: 0 6px 16px rgba(30, 136, 229, 0.3);
}

/* ================= Телефон ================= */
@media (max-width: 760px) {
  .ct {
    border-radius: 22px;
  }

  .ct__sky {
    padding: 16px 16px 0;
  }

  .ct__lane {
    height: 70px;
    margin: 4px -16px 0;
  }

  .ct__title {
    font-size: 21px;
  }

  .ct__subtitle {
    font-size: 13px;
  }

  .duck {
    width: 64px;
  }

  .ct__body {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
    padding: 16px;
  }

  .route {
    grid-template-columns: 14px minmax(0, 1fr) 34px;
    gap: 8px;
  }

  .seat {
    width: 34px;
    height: 34px;
  }

  .ct__side-label,
  .ticket {
    display: none;
  }

  .ct__done {
    padding: 16px;
  }
}
</style>

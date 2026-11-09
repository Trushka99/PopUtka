<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import TripComponent from "@/components/TripComponent.vue";
import SearchingForm from "@/components/SearchingForm.vue";
import Filters from "@/components/Filters.vue";
import { getTrips } from "@/api";
import { useLangStore } from "@/stores/langStore";
import {
  PASSENGER_FORMS,
  TRIP_FORMS,
  capitalize,
  cityName,
  localeOf,
  pluralize,
} from "@/utils/tripFormat";
import {
  dayPartOf,
  emptyFilters,
  type TripFilters,
} from "@/utils/tripFilters";

const route = useRoute();
const router = useRouter();
const langStore = useLangStore();
const t = (key: string) => langStore.t(key);

const trips = ref<any[]>([]);
const loading = ref(true);
const failed = ref(false);

const filters = ref<TripFilters>(emptyFilters());
const sortBy = ref<"earliest" | "cheapest">("earliest");

// ---------- Параметры поиска из адреса ----------
const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fromKey = computed(() => (route.query.from as string) || "");
const toKey = computed(() => (route.query.to as string) || "");
const dateStr = computed(
  () => (route.query.departureAt as string) || localDate(new Date()),
);
const seats = computed(() =>
  route.query.seats ? Number(route.query.seats) : undefined,
);

// ---------- Загрузка ----------
// Цена, пол водителя и «проверенные» фильтруются на сервере;
// время выезда сервер не учитывает, поэтому его фильтруем здесь.
let requestId = 0;
async function load() {
  const id = ++requestId;
  loading.value = true;
  failed.value = false;
  try {
    const res = await getTrips({
      from: fromKey.value || undefined,
      to: toKey.value || undefined,
      departureAt: dateStr.value,
      seats: seats.value,
      minPrice: filters.value.minPrice ?? undefined,
      maxPrice: filters.value.maxPrice ?? undefined,
      driverGender: filters.value.driverGender || undefined,
      ...(filters.value.verifiedOnly ? { verifiedOnly: true } : {}),
    } as any);
    if (id !== requestId) return;
    trips.value = res.data?.data || [];
  } catch (err) {
    if (id !== requestId) return;
    console.error("Ошибка при получении поездок:", err);
    failed.value = true;
    trips.value = [];
  } finally {
    if (id === requestId) loading.value = false;
  }
}

watch(
  () => [route.query.from, route.query.to, route.query.departureAt, route.query.seats],
  load,
  { immediate: true },
);

// Серверные фильтры — перезапрашиваем; время выезда — без запроса.
// Сравниваем строкой, иначе новый массив каждый раз считался бы изменением.
watch(
  () =>
    JSON.stringify([
      filters.value.minPrice,
      filters.value.maxPrice,
      filters.value.driverGender,
      filters.value.verifiedOnly,
    ]),
  load,
);

const visibleTrips = computed(() => {
  const parts = filters.value.dayParts;
  const list = parts.length
    ? trips.value.filter((tr) => parts.includes(dayPartOf(tr.departureAt)))
    : [...trips.value];
  return list.sort((a, b) =>
    sortBy.value === "cheapest"
      ? Number(a.price) - Number(b.price)
      : new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime(),
  );
});

const activeCount = computed(() => {
  const f = filters.value;
  return (
    f.dayParts.length +
    (f.minPrice || f.maxPrice ? 1 : 0) +
    (f.driverGender ? 1 : 0) +
    (f.verifiedOnly ? 1 : 0)
  );
});

const resetFilters = () => {
  filters.value = emptyFilters();
};

// ---------- Шапка результатов ----------
const routeTitle = computed(() => {
  if (!fromKey.value && !toKey.value) return t("rides");
  const city = (key: string) =>
    key ? cityName({ cityKey: key }, (k) => langStore.с(k)) : "…";
  return `${city(fromKey.value)} → ${city(toKey.value)}`;
});

const countText = computed(() => {
  const n = visibleTrips.value.length;
  const parts = [`${n} ${pluralize(langStore.currentLang, n, TRIP_FORMS)}`];
  if (seats.value) {
    parts.push(
      `${seats.value} ${pluralize(langStore.currentLang, seats.value, PASSENGER_FORMS)}`,
    );
  }
  return parts.join(" · ");
});

const dayChipLabel = (date: Date, long = false) =>
  capitalize(
    date.toLocaleDateString(localeOf(langStore.currentLang), {
      weekday: "short",
      day: "numeric",
      ...(long ? { month: "long" } : {}),
    }),
  );

// Соседние дни: вчера (если не в прошлом), выбранный и три следующих
const dayChips = computed(() => {
  const base = new Date(`${dateStr.value}T00:00:00`);
  const today = localDate(new Date());
  const chips: { value: string; label: string; active: boolean }[] = [];
  for (let offset = -1; offset <= 3; offset++) {
    const d = new Date(base);
    d.setDate(base.getDate() + offset);
    const value = localDate(d);
    if (value < today) continue;
    chips.push({
      value,
      label: dayChipLabel(d, offset === 0),
      active: offset === 0,
    });
  }
  return chips;
});

const nextDay = computed(() => {
  const d = new Date(`${dateStr.value}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return { value: localDate(d), label: dayChipLabel(d) };
});

const currentDayLabel = computed(() =>
  dayChipLabel(new Date(`${dateStr.value}T00:00:00`)).toLowerCase(),
);

const goToDay = (value: string) => {
  router.replace({ query: { ...route.query, departureAt: value } });
};

// Форма поиска сама меняет адрес — загрузка сработает от watch
const handleSearch = () => {};
</script>

<template>
  <div class="search-page">
    <div class="search-page__form">
      <SearchingForm @search="handleSearch" />
    </div>

    <div class="search-page__layout">
      <Filters
        v-model="filters"
        :active-count="activeCount"
        class="search-page__filters"
        @reset="resetFilters"
      />

      <main class="search-page__results">
        <!-- Шапка результатов -->
        <section class="results-head">
          <span class="cloud cloud--a" aria-hidden="true"></span>
          <span class="cloud cloud--b" aria-hidden="true"></span>

          <div class="results-head__row">
            <div class="results-head__text">
              <h1 class="results-head__title">{{ routeTitle }}</h1>
              <div v-if="!loading" class="results-head__count">
                {{ countText }}
              </div>
            </div>

            <div class="seg" role="radiogroup" :aria-label="t('sort')">
              <button
                type="button"
                role="radio"
                class="seg__item"
                :class="{ 'seg__item--on': sortBy === 'earliest' }"
                :aria-checked="sortBy === 'earliest'"
                @click="sortBy = 'earliest'"
              >
                <v-icon size="16">mdi-clock-fast</v-icon>
                {{ t("sort_earliest") }}
              </button>
              <button
                type="button"
                role="radio"
                class="seg__item"
                :class="{ 'seg__item--on': sortBy === 'cheapest' }"
                :aria-checked="sortBy === 'cheapest'"
                @click="sortBy = 'cheapest'"
              >
                <v-icon size="16">mdi-tag-outline</v-icon>
                {{ t("sort_cheapest") }}
              </button>
            </div>
          </div>

          <div class="days">
            <button
              v-for="day in dayChips"
              :key="day.value"
              type="button"
              class="day"
              :class="{ 'day--on': day.active }"
              @click="goToDay(day.value)"
            >
              {{ day.label }}
            </button>
          </div>
        </section>

        <!-- Загрузка: утка ищет попутчиков -->
        <div v-if="loading" class="state state--loading">
          <div class="lane" aria-hidden="true">
            <span class="lane__dash"></span>
            <img class="lane__duck" src="/images/duckCar.png" alt="" />
          </div>
          <span>{{ t("searching_trips") }}</span>
        </div>

        <!-- Ошибка -->
        <div v-else-if="failed" class="state">
          <span class="state__icon"><v-icon size="30">mdi-cloud-off-outline</v-icon></span>
          <h3>{{ t("trips_search_error") }}</h3>
          <button type="button" class="btn-sky" @click="load">
            {{ t("retry") }}
          </button>
        </div>

        <!-- Пусто -->
        <div v-else-if="!visibleTrips.length" class="state">
          <span class="state__icon"><v-icon size="30">mdi-weather-cloudy</v-icon></span>
          <h3>
            {{ trips.length ? t("no_trips_filtered") : t("no_trips_day") }}
          </h3>
          <p>{{ t("no_trips_hint") }}</p>
          <div class="state__actions">
            <button
              v-if="activeCount"
              type="button"
              class="btn-soft"
              @click="resetFilters"
            >
              {{ t("reset_filters") }}
            </button>
            <button type="button" class="btn-sky" @click="goToDay(nextDay.value)">
              {{ nextDay.label }}
              <v-icon size="18">mdi-arrow-right</v-icon>
            </button>
          </div>
        </div>

        <!-- Список -->
        <template v-else>
          <div class="list">
            <TripComponent
              v-for="trip in visibleTrips"
              :key="trip.id"
              :trip="trip"
            />
          </div>

          <div class="list-end">
            <span>{{ t("all_trips_for") }} {{ currentDayLabel }}</span>
            <button type="button" class="list-end__next" @click="goToDay(nextDay.value)">
              {{ nextDay.label }}
              <v-icon size="16">mdi-arrow-right</v-icon>
            </button>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.search-page {
  --ink: #0b3550;
  --ink-soft: #5a7085;
  color: var(--ink);
}

.search-page__form {
  margin: 30px 0;
}

.search-page__layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 760px);
  justify-content: center;
  gap: 20px;
  align-items: start;
  padding: 8px 20px 48px;
}

.search-page__filters {
  position: sticky;
  top: 16px;
}

.search-page__results {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* --- Шапка результатов --- */
.results-head {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  padding: 16px 20px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  background:
    radial-gradient(
      260px 100px at 90% 0%,
      rgba(255, 255, 255, 0.9),
      transparent 70%
    ),
    linear-gradient(160deg, #9fd8f5 0%, #d3eefc 55%, #f1f9ff 100%);
  box-shadow: 0 10px 24px rgba(30, 90, 140, 0.12);
}

.cloud {
  position: absolute;
  z-index: -1;
  width: 64px;
  height: 20px;
  border-radius: 20px;
  background: #fff;
  opacity: 0.75;

  &::before,
  &::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    background: inherit;
  }

  &::before {
    width: 30px;
    height: 30px;
    top: -15px;
    left: 9px;
  }

  &::after {
    width: 22px;
    height: 22px;
    top: -10px;
    left: 32px;
  }

  &--a {
    top: 28px;
    right: 38%;
  }

  &--b {
    bottom: 18px;
    right: 6%;
    scale: 0.6;
    opacity: 0.6;
  }
}

.results-head__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.results-head__text {
  min-width: 0;
}

.results-head__title {
  margin: 0;
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.results-head__count {
  font-size: 14px;
  color: rgba(11, 53, 80, 0.7);
}

.seg {
  display: inline-flex;
  gap: 3px;
  padding: 3px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
}

.seg__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 34px;
  padding: 0 14px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #43526a;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;

  &--on {
    background: #fff;
    color: #0b4fa8;
    box-shadow: 0 2px 8px rgba(20, 60, 110, 0.14);
  }
}

.days {
  display: flex;
  gap: 6px;
  margin-top: 14px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.day {
  flex: none;
  height: 34px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  color: #2c4a6e;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.85);
  }

  &--on,
  &--on:hover {
    border-color: #9cc6f0;
    background: #fff;
    color: #0b4fa8;
  }
}

/* --- Список --- */
.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-end {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding: 14px;
  border-radius: 18px;
  background: #fff;
  color: var(--ink-soft);
  font-size: 14px;
}

.list-end__next {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 34px;
  padding: 0 14px;
  border: 1px solid #d6e3f1;
  border-radius: 999px;
  background: #e9f1fa;
  color: #0b4fa8;
  font-weight: 600;
  cursor: pointer;
}

/* --- Состояния --- */
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 36px 20px;
  border-radius: 22px;
  background: #fff;
  text-align: center;
  color: var(--ink-soft);

  h3 {
    margin: 4px 0 0;
    color: var(--ink);
    font-size: 18px;
  }

  p {
    max-width: 380px;
    margin: 0;
  }
}

.state__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, #bfe6fb, #eaf7ff);
  color: #1a7cc9;
}

.state__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.state--loading {
  gap: 12px;
  padding: 26px 20px 28px;
  font-weight: 600;
  color: #2c4a6e;
}

/* Дорога с уткой для загрузки */
.lane {
  position: relative;
  width: min(420px, 100%);
  height: 70px;
  overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(180deg, #d9effc 0%, #d9effc 62%, #9ed4f4 62%);
}

.lane__dash {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 12px;
  height: 3px;
  background: repeating-linear-gradient(
    90deg,
    #fff 0 16px,
    transparent 16px 28px
  );
  animation: road-move 0.5s linear infinite;
}

.lane__duck {
  position: absolute;
  left: 50%;
  bottom: 10px;
  width: 58px;
  translate: -50% 0;
  filter: drop-shadow(0 4px 5px rgba(0, 30, 70, 0.25));
  animation: bump 0.3s ease-in-out infinite alternate;
}

@keyframes road-move {
  from {
    background-position: 0 0;
  }
  to {
    background-position: -28px 0;
  }
}

@keyframes bump {
  from {
    transform: translateY(0) rotate(0deg);
  }
  to {
    transform: translateY(-2px) rotate(-1deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lane__dash,
  .lane__duck {
    animation: none;
  }
}

/* --- Кнопки --- */
.btn-sky,
.btn-soft {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 42px;
  padding: 0 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.btn-sky {
  border: none;
  background: linear-gradient(135deg, #1e88e5, #42a5f5);
  color: #fff;
  box-shadow: 0 4px 12px rgba(30, 136, 229, 0.3);
}

.btn-soft {
  border: 1px solid #d6e3f1;
  background: #f6f9fc;
  color: #2c4a6e;
}

/* --- Адаптив --- */
@media (max-width: 920px) {
  .search-page__layout {
    grid-template-columns: minmax(0, 1fr);
    padding: 0 12px 90px;
  }

  .search-page__filters {
    position: static;
  }

  .results-head {
    padding: 14px 16px;
  }

  .results-head__title {
    font-size: 20px;
  }
}
</style>

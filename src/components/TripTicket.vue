<script setup lang="ts">
import { computed } from "vue";
import { useLangStore } from "@/stores/langStore";
import { addMinutes, cityName, timeOf } from "@/utils/tripFormat";

interface TicketMeta {
  label: string;
  /** Текст значения; если не задан — показываем галочку */
  value?: string | number;
}

// Небесный «билет» с маршрутом: общий для страницы поездки и страницы брони
const props = defineProps<{
  trip: any;
  meta?: TicketMeta[];
}>();

const langStore = useLangStore();
const t = (key: string) => langStore.t(key);

const fromCity = computed(() =>
  cityName(props.trip?.from, (k) => langStore.с(k)),
);
const toCity = computed(() => cityName(props.trip?.to, (k) => langStore.с(k)));
const duration = computed(() => Number(props.trip?.tripInfo?.duration ?? 0));
const departure = computed(() =>
  props.trip?.departureAt ? timeOf(props.trip.departureAt) : "",
);
const arrival = computed(() =>
  props.trip?.departureAt
    ? timeOf(addMinutes(props.trip.departureAt, duration.value))
    : "",
);
const durationText = computed(() => {
  if (!duration.value) return "";
  const hrs = Math.floor(duration.value / 60);
  const mins = Math.round(duration.value % 60);
  return hrs === 0
    ? `${mins} ${t("min")}`
    : `${hrs} ${t("hours")} ${mins} ${t("min")}`;
});
const distanceText = computed(() => {
  const d = Number(props.trip?.tripInfo?.distance);
  return d ? `${Math.round(d)} ${t("km")}` : "";
});
</script>

<template>
  <section class="ticket">
    <span class="cloud cloud--a" aria-hidden="true"></span>
    <span class="cloud cloud--b" aria-hidden="true"></span>

    <div class="route">
      <div class="route__time">{{ departure }}</div>
      <div class="route__rail"><span class="route__dot"></span></div>
      <div class="route__place">
        <div class="route__city">{{ fromCity }}</div>
        <div v-if="trip?.from?.address" class="route__addr">
          {{ trip.from.address }}
        </div>
      </div>

      <div class="route__meta">{{ durationText }}</div>
      <div class="route__rail route__rail--line"></div>
      <div class="route__meta">{{ distanceText }}</div>

      <div class="route__time">{{ arrival }}</div>
      <div class="route__rail">
        <span class="route__dot route__dot--end"></span>
      </div>
      <div class="route__place">
        <div class="route__city">{{ toCity }}</div>
        <div v-if="trip?.to?.address" class="route__addr">
          {{ trip.to.address }}
        </div>
      </div>
    </div>

    <div v-if="meta?.length" class="glass meta">
      <div v-for="item in meta" :key="item.label" class="meta__item">
        <span class="meta__label">{{ item.label }}</span>
        <strong>
          <template v-if="item.value !== undefined">{{ item.value }}</template>
          <v-icon v-else size="16">mdi-check</v-icon>
        </strong>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.ticket {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  padding: 20px 22px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  color: #0b3550;
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
  box-shadow: 0 12px 28px rgba(30, 90, 140, 0.16);
}

.cloud {
  position: absolute;
  z-index: -1;
  width: 72px;
  height: 22px;
  border-radius: 22px;
  background: #fff;
  opacity: 0.75;
  animation: drift 10s ease-in-out infinite alternate;

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

  &--a {
    top: 34px;
    right: 14%;
  }

  &--b {
    bottom: 70px;
    right: 34%;
    scale: 0.6;
    opacity: 0.55;
    animation-duration: 13s;
  }
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
  .cloud {
    animation: none;
  }
}

.route {
  display: grid;
  grid-template-columns: auto 16px minmax(0, 1fr);
  column-gap: 14px;
}

.route__time {
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
}

.route__rail {
  display: flex;
  justify-content: center;
  padding-top: 5px;

  &--line {
    padding: 0;

    &::before {
      content: "";
      width: 2px;
      min-height: 34px;
      background: repeating-linear-gradient(
        180deg,
        #2b8fd6 0 5px,
        transparent 5px 10px
      );
    }
  }
}

.route__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid #2b8fd6;
  background: #fff;

  &--end {
    background: #2b8fd6;
  }
}

.route__city {
  font-size: 17px;
  font-weight: 700;
}

.route__addr {
  font-size: 13px;
  color: rgba(11, 53, 80, 0.65);
  word-break: break-word;
}

.route__meta {
  align-self: center;
  padding: 10px 0;
  font-size: 12px;
  color: rgba(11, 53, 80, 0.65);
}

.glass {
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 14px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px 20px;
  margin-top: 18px;
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
  color: rgba(11, 53, 80, 0.6);
}
</style>

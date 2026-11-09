<script setup lang="ts">
import { computed } from "vue";
import { useLangStore } from "@/stores/langStore";
import { REVIEW_FORMS, pluralize } from "@/utils/tripFormat";

interface Review {
  rating: number;
  driving?: number;
  cleanliness?: number;
  politeness?: number;
}

const props = defineProps<{
  reviews: Review[];
  /** Рейтинг пользователя с сервера; если нет — считаем среднее сами */
  rating?: number | null;
}>();

const langStore = useLangStore();
const t = (key: string) => langStore.t(key);

const count = computed(() => props.reviews.length);

const average = computed(() => {
  const fromServer = Number(props.rating);
  if (fromServer > 0) return fromServer;
  if (!count.value) return 0;
  return (
    props.reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
    count.value
  );
});

const countText = computed(
  () =>
    `${count.value} ${pluralize(langStore.currentLang, count.value, REVIEW_FORMS)}`,
);

// Сколько отзывов на каждую оценку, от 5 до 1
const distribution = computed(() =>
  [5, 4, 3, 2, 1].map((stars) => {
    const n = props.reviews.filter(
      (r) => Math.round(Number(r.rating)) === stars,
    ).length;
    return {
      stars,
      n,
      percent: count.value ? (n / count.value) * 100 : 0,
    };
  }),
);

const avgOf = (key: "driving" | "cleanliness" | "politeness") => {
  const values = props.reviews
    .map((r) => Number(r[key]))
    .filter((v) => v > 0);
  return values.length
    ? values.reduce((sum, v) => sum + v, 0) / values.length
    : 0;
};

const criteria = computed(() =>
  [
    { key: "crit_driving", icon: "mdi-steering", value: avgOf("driving") },
    {
      key: "crit_cleanliness",
      icon: "mdi-creation-outline",
      value: avgOf("cleanliness"),
    },
    {
      key: "crit_politeness",
      icon: "mdi-emoticon-happy-outline",
      value: avgOf("politeness"),
    },
  ].filter((c) => c.value > 0),
);

// Сколько звёзд закрасить (с половинками)
const starFill = computed(() =>
  [1, 2, 3, 4, 5].map((i) => {
    const diff = average.value - (i - 1);
    if (diff >= 0.75) return "mdi-star";
    if (diff >= 0.25) return "mdi-star-half-full";
    return "mdi-star-outline";
  }),
);
</script>

<template>
  <section
    class="summary"
    :class="{ 'summary--no-criteria': !criteria.length }"
  >
    <span class="summary__cloud summary__cloud--a" aria-hidden="true"></span>
    <span class="summary__cloud summary__cloud--b" aria-hidden="true"></span>

    <div class="summary__score">
      <div class="summary__big">{{ average.toFixed(1) }}</div>
      <div class="summary__stars" :aria-label="`${average.toFixed(1)} / 5`">
        <v-icon v-for="(icon, i) in starFill" :key="i" size="18">{{
          icon
        }}</v-icon>
      </div>
      <div class="summary__count">{{ countText }}</div>
    </div>

    <div class="summary__bars">
      <div v-for="row in distribution" :key="row.stars" class="bar">
        <span class="bar__label">
          {{ row.stars }}
          <v-icon size="12">mdi-star</v-icon>
        </span>
        <span class="bar__track">
          <span class="bar__fill" :style="{ width: `${row.percent}%` }"></span>
        </span>
        <span class="bar__n">{{ row.n }}</span>
      </div>
    </div>

    <div v-if="criteria.length" class="summary__criteria">
      <div v-for="c in criteria" :key="c.key" class="crit">
        <v-icon size="16">{{ c.icon }}</v-icon>
        <span class="crit__label">{{ t(c.key) }}</span>
        <strong>{{ c.value.toFixed(1) }}</strong>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.summary {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) 210px;
  align-items: center;
  gap: 22px;
  padding: 18px 22px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  color: #0b3550;
  background:
    radial-gradient(
      260px 100px at 92% 0%,
      rgba(255, 255, 255, 0.9),
      transparent 70%
    ),
    radial-gradient(
      300px 110px at 0% 100%,
      rgba(255, 255, 255, 0.6),
      transparent 70%
    ),
    linear-gradient(160deg, #9fd8f5 0%, #d3eefc 55%, #f1f9ff 100%);
  box-shadow: 0 10px 26px rgba(30, 90, 140, 0.14);

  &--no-criteria {
    grid-template-columns: 150px minmax(0, 1fr);
  }
}

.summary__cloud {
  position: absolute;
  z-index: -1;
  width: 66px;
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
    width: 23px;
    height: 23px;
    top: -10px;
    left: 33px;
  }

  &--a {
    top: 26px;
    left: 44%;
  }

  &--b {
    bottom: 16px;
    right: 3%;
    scale: 0.6;
    opacity: 0.6;
  }
}

.summary__score {
  text-align: center;
}

.summary__big {
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 46px;
  font-weight: 700;
  line-height: 1;
}

.summary__stars {
  margin-top: 4px;
  color: #f5a300;
}

.summary__count {
  margin-top: 2px;
  font-size: 13px;
  color: rgba(11, 53, 80, 0.65);
}

.summary__bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bar {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #3d5a72;
}

.bar__label {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-weight: 600;

  .v-icon {
    color: #f5a300;
  }
}

.bar__track {
  height: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.75);
  overflow: hidden;
}

.bar__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ffb300, #ff8a00);
}

.bar__n {
  text-align: right;
}

.summary__criteria {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.crit {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  font-size: 13px;

  .v-icon {
    color: #1a7cc9;
  }

  strong {
    margin-left: auto;
    font-family: "Exo 2", "Roboto", sans-serif;
    font-size: 15px;
    font-weight: 700;
  }
}

.crit__label {
  color: #3d5a72;
}

@media (max-width: 760px) {
  .summary,
  .summary--no-criteria {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }

  .summary__cloud--a {
    left: auto;
    right: 8%;
    top: 30px;
  }
}
</style>

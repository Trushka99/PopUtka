<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { useLangStore } from "@/stores/langStore";
import { shortDate } from "@/utils/tripFormat";

interface Review {
  author: string;
  authorId: string;
  createdAt: string;
  rating: number;
  text: string;
  tripId: string;
  driving?: number;
  cleanliness?: number;
  politeness?: number;
}

const props = defineProps<{
  review: Review;
  /** Кто оставил отзыв: водитель или пассажир */
  authorRole?: "driver" | "passenger";
  /** «Ташкент → Самарканд», если поездку удалось найти */
  tripRoute?: string;
}>();

const langStore = useLangStore();
const t = (key: string) => langStore.t(key);

const rating = computed(() => Number(props.review.rating ?? 0));

const tone = computed(() => {
  if (rating.value >= 4) return "good";
  if (rating.value >= 3) return "mid";
  return "low";
});

const initials = computed(
  () =>
    (props.review.author ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?",
);

const meta = computed(() =>
  [
    props.authorRole ? t(props.authorRole) : "",
    props.review.createdAt
      ? shortDate(props.review.createdAt, langStore.currentLang)
      : "",
  ]
    .filter(Boolean)
    .join(" · "),
);

const criteria = computed(() =>
  [
    { key: "crit_driving", icon: "mdi-steering", value: props.review.driving },
    {
      key: "crit_cleanliness",
      icon: "mdi-creation-outline",
      value: props.review.cleanliness,
    },
    {
      key: "crit_politeness",
      icon: "mdi-emoticon-happy-outline",
      value: props.review.politeness,
    },
  ].filter((c) => Number(c.value) > 0),
);

// «Читать полностью» — только если текст правда не влез в 4 строки.
// ResizeObserver нужен, потому что вкладка может быть скрыта при монтировании.
const textEl = ref<HTMLElement | null>(null);
const expanded = ref(false);
const overflowing = ref(false);
let observer: ResizeObserver | null = null;

const measure = () => {
  const el = textEl.value;
  if (!el || expanded.value) return;
  overflowing.value = el.scrollHeight - el.clientHeight > 2;
};

onMounted(() => {
  measure();
  if (textEl.value) {
    observer = new ResizeObserver(measure);
    observer.observe(textEl.value);
  }
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <article class="review" :class="`review--${tone}`">
    <div class="review__top">
      <span class="review__cloud" aria-hidden="true"></span>
      <span class="review__quote" aria-hidden="true">“</span>

      <div class="review__head">
        <component
          :is="review.authorId ? RouterLink : 'div'"
          class="review__author"
          :to="
            review.authorId
              ? { name: 'user', params: { id: review.authorId } }
              : undefined
          "
        >
          <span class="review__avatar">{{ initials }}</span>
          <span class="review__who">
            <span class="review__name">{{ review.author }}</span>
            <span v-if="meta" class="review__meta">{{ meta }}</span>
          </span>
        </component>

        <span class="review__score">
          <v-icon size="15">mdi-star</v-icon>
          {{ rating.toFixed(1) }}
        </span>
      </div>

      <!-- prettier-ignore -->
      <p ref="textEl" class="review__text" :class="{ 'review__text--clamped': !expanded }">{{ review.text }}</p>

      <div
        v-if="overflowing || expanded || tripRoute"
        class="review__footer-line"
      >
        <button
          v-if="overflowing || expanded"
          type="button"
          class="review__more"
          @click="expanded = !expanded"
        >
          {{ expanded ? t("show_less") : t("read_more") }}
        </button>
        <span v-if="tripRoute" class="review__trip">
          <v-icon size="14">mdi-map-marker-path</v-icon>
          {{ tripRoute }}
        </span>
      </div>
    </div>

    <template v-if="criteria.length">
      <div class="review__perf" aria-hidden="true"></div>
      <div class="review__criteria">
        <div v-for="c in criteria" :key="c.key" class="crit">
          <div class="crit__label">
            <v-icon size="14">{{ c.icon }}</v-icon>
            {{ t(c.key) }}
            <strong>{{ Number(c.value).toFixed(0) }}</strong>
          </div>
          <div class="crit__bar">
            <span :style="{ width: `${(Number(c.value) / 5) * 100}%` }"></span>
          </div>
        </div>
      </div>
    </template>
  </article>
</template>

<style scoped lang="scss">
.review {
  --notch: var(--ticket-notch, #eeeeee);
  --ink: #0b3550;
  --ink-soft: #5a7085;
  --score-bg: #fff4e0;
  --score-ink: #9a5200;

  position: relative;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid #dcebf7;
  background: #fff;
  color: var(--ink);
  box-shadow: 0 6px 18px rgba(30, 90, 140, 0.08);
}

.review--mid {
  --score-bg: #eef2f7;
  --score-ink: #43526a;
}

.review--low {
  --score-bg: #fdecea;
  --score-ink: #a32020;

  .review__top {
    background: linear-gradient(150deg, #f6f8fa, #ffffff);
  }

  .review__cloud,
  .review__quote {
    display: none;
  }

  .review__avatar {
    background: #eef1f5;
    color: #5a6676;
  }
}

.review__top {
  position: relative;
  isolation: isolate;
  padding: 16px 20px 14px;
  background:
    radial-gradient(200px 80px at 100% 0%, #e0f2ff, transparent 70%),
    linear-gradient(150deg, #f3faff, #ffffff);
}

.review__cloud {
  position: absolute;
  z-index: -1;
  top: 24px;
  right: 34%;
  width: 50px;
  height: 16px;
  border-radius: 16px;
  background: #d3ecfc;

  &::before,
  &::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    background: inherit;
  }

  &::before {
    width: 24px;
    height: 24px;
    top: -12px;
    left: 7px;
  }

  &::after {
    width: 18px;
    height: 18px;
    top: -8px;
    left: 25px;
  }
}

.review__quote {
  position: absolute;
  z-index: -1;
  top: 2px;
  right: 18px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 64px;
  line-height: 1;
  color: #cfe7fa;
}

.review__head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review__author {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  color: inherit;
  text-decoration: none;

  &[href]:hover .review__name {
    color: #0b4fa8;
  }
}

.review__avatar {
  flex: none;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  border: 2px solid #fff;
  background: #dbeafe;
  color: #0b4fa8;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 3px 8px rgba(30, 100, 160, 0.15);
}

.review__who {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.review__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 600;
  transition: color 0.2s ease;
}

.review__meta {
  font-size: 12px;
  color: var(--ink-soft);
}

.review__score {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--score-bg);
  color: var(--score-ink);
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 14px;
  font-weight: 700;

  .review--good & .v-icon {
    color: #f5a300;
  }
}

.review__text {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: #24425a;
  white-space: pre-line;
  word-break: break-word;

  &--clamped {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    overflow: hidden;
  }
}

.review__footer-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 8px;
}

.review__more {
  padding: 0;
  border: none;
  background: none;
  color: #0b4fa8;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.review__trip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  padding: 3px 10px;
  border-radius: 999px;
  background: #eef6fd;
  color: #3d6a8c;
  font-size: 12px;
  font-weight: 500;
}

/* --- Оценки по критериям --- */
.review__perf {
  position: relative;
  height: 0;
  margin: 0 16px;
  border-top: 2px dashed #d6e6f3;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: -11px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--notch);
  }

  &::before {
    left: -27px;
  }

  &::after {
    right: -27px;
  }
}

.review__criteria {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 18px;
  padding: 12px 20px 16px;
}

.crit__label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--ink-soft);

  strong {
    margin-left: auto;
    color: var(--ink);
    font-weight: 700;
  }
}

.crit__bar {
  height: 6px;
  margin-top: 5px;
  border-radius: 6px;
  background: #e6eef6;
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #42a5f5, #1e88e5);
  }
}

@media (max-width: 560px) {
  .review__top {
    padding: 14px 16px 12px;
  }

  .review__cloud {
    display: none;
  }

  .review__criteria {
    gap: 8px 12px;
    padding: 12px 16px 14px;
  }

  .crit__label {
    font-size: 11px;

    .v-icon {
      display: none;
    }
  }

  .review__trip {
    margin-left: 0;
  }
}
</style>

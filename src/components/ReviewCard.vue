<script setup lang="ts">
import { computed } from "vue";

interface Review {
  author: string;
  authorId: string;
  createdAt: string;
  rating: number;
  text: string;
  tripId: string;
}

const props = defineProps<{
  review: Review;
}>();

const avatarUrl = computed(() => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    props.review.author,
  )}&background=4F8CFF&color=fff`;
});

const formattedDate = computed(() => {
  return new Date(props.review.createdAt).toLocaleDateString();
});
</script>
<template>
  <v-card class="review-card pa-4 rounded-xl mb-4" elevation="0">
    <!-- HEADER -->
    <div class="d-flex align-center mb-3">
      <v-avatar size="42" class="mr-3 avatar">
        <v-img :src="avatarUrl" />
      </v-avatar>

      <div class="flex-grow-1">
        <div class="author">{{ review.author }}</div>
        <div class="date">
          {{ formattedDate }}
        </div>
      </div>

      <v-rating
        :model-value="review.rating"
        color="amber"
        density="compact"
        readonly
        size="18"
      />
    </div>

    <!-- TEXT -->
    <div class="review-text">
      {{ review.text }}
    </div>
  </v-card>
</template>

<style scoped>
.review-card {
  position: relative;
  background: linear-gradient(135deg, #dbe9ff, #eef5ff); /* ⬅️ темнее */
  border: 1px solid rgba(80, 130, 255, 0.3); /* чуть выразительнее */
  backdrop-filter: blur(10px);
  transition: all 0.25s ease;

  box-shadow: 0 4px 14px rgba(80, 130, 255, 0.12);
}

.review-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(80, 130, 255, 0.22);
}

/* акцентная линия */
.review-card::after {
  content: "";
  position: absolute;
  top: 0;
  left: 12px;
  right: 12px;
  height: 3px;
  border-radius: 8px;
  background: linear-gradient(90deg, #3b82f6, #6ea8ff);
  opacity: 1;
}

/* аватар */
.avatar {
  box-shadow: 0 4px 12px rgba(80, 130, 255, 0.4);
}

/* автор */
.author {
  font-weight: 600;
  color: #162a5c; /* ⬅️ темнее */
  font-size: 14px;
}

/* дата */
.date {
  font-size: 12px;
  color: #4f6fc2; /* ⬅️ насыщеннее */
}

/* текст */
.review-text {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.65;
  color: #1f2f5a; /* ⬅️ главный фикс (контраст) */
  word-break: break-word;
}

/* мягкий свет (чуть приглушили) */
.review-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    circle at top left,
    rgba(255, 255, 255, 0.35),
    transparent 60%
  );
  pointer-events: none;
}
</style>

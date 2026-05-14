<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ amount?: number }>();
const emit = defineEmits<{ (e: "close"): void }>();

const time = computed(() =>
  new Date().toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }),
);
</script>

<template>
  <div class="card">
    <div class="icon">
      <div class="ring" />
      <svg viewBox="0 0 52 52">
        <path d="M14 27L22 35L38 18" />
      </svg>
    </div>

    <div class="badge">Payment successful</div>

    <h1>Готово 🎉</h1>
    <p>Оплата прошла успешно. Ваша поездка подтверждена.</p>

    <div class="block">
      <div class="row">
        <span>Статус</span>
        <b class="ok">PAID</b>
      </div>

      <div class="row">
        <span>Время</span>
        <b>{{ time }}</b>
      </div>

      <div class="row" v-if="amount">
        <span>Сумма</span>
        <b>{{ amount }} ₽</b>
      </div>
    </div>

    <button class="btn" @click="emit('close')">Вернуться</button>
  </div>
</template>
<style scoped lang="scss">
.card {
  position: relative;
  background-color: transparent;
  border-radius: 26px;
  padding: 26px;
  text-align: center;
}

.icon {
  position: relative;
  width: 90px;
  height: 90px;
  margin: 10px auto 18px;
  display: grid;
  place-items: center;

  svg {
    width: 42px;
    height: 42px;
    stroke: white;
    stroke-width: 4;
    fill: none;
    stroke-linecap: round;
    stroke-dasharray: 120;
    stroke-dashoffset: 120;
    animation: draw 0.7s ease forwards;
    z-index: 2;
  }

  .ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: linear-gradient(135deg, #00d68f, #00a3ff);
    box-shadow: 0 10px 30px rgba(0, 200, 150, 0.35);
    animation: pulse 2s infinite;
  }
}

.badge {
  display: inline-block;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(0, 200, 140, 0.12);
  color: #00a67d;
  margin-bottom: 10px;
}

h1 {
  font-size: 24px;
  margin: 6px 0;
  font-weight: 800;
  color: #0f172a;
}

p {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 18px;
  line-height: 1.5;
}

.block {
  background: #f6f9fc;
  border-radius: 16px;
  padding: 12px 14px;
  margin-bottom: 18px;
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  color: #475569;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
}

.ok {
  color: #00b37e;
}

.btn {
  width: 100%;
  border: none;
  border-radius: 14px;
  padding: 14px;
  font-weight: 700;
  color: white;
  cursor: pointer;

  background: linear-gradient(135deg, #00c896, #009dff);
  box-shadow: 0 12px 30px rgba(0, 140, 255, 0.25);

  transition: 0.2s;

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
  }
}

@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.85;
  }
}
</style>

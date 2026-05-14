<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  amount?: number;
  reason?: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "retry"): void;
}>();

const time = computed(() =>
  new Date().toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }),
);
</script>

<template>
  <div class="card">
    <div class="icon failed">
      <div class="ring" />

      <svg viewBox="0 0 52 52">
        <path d="M16 16L36 36" />
        <path d="M36 16L16 36" />
      </svg>
    </div>

    <div class="badge failed-badge">Payment failed</div>

    <h1>Не удалось оплатить 😕</h1>

    <p>
      Платёж не был завершён. Попробуйте снова или используйте другой способ
      оплаты.
    </p>

    <div class="block">
      <div class="row">
        <span>Статус</span>
        <b class="fail">FAILED</b>
      </div>

      <div class="row">
        <span>Время</span>
        <b>{{ time }}</b>
      </div>

      <div class="row" v-if="amount">
        <span>Сумма</span>
        <b>{{ amount }} ₽</b>
      </div>

      <div class="row" v-if="reason">
        <span>Причина</span>
        <b>{{ reason }}</b>
      </div>
    </div>

    <div class="actions">
      <button class="btn retry" @click="emit('retry')">
        Попробовать снова
      </button>

      <button class="btn close" @click="emit('close')">Закрыть</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.card {
  position: relative;
  border-radius: 26px;
  padding: 26px;
  text-align: center;
  overflow: hidden;
}

.card::before {
  content: "";

  position: absolute;
  inset: -30%;

  pointer-events: none;
}

.icon {
  position: relative;
  width: 90px;
  height: 90px;

  margin: 10px auto 18px;

  display: grid;
  place-items: center;

  z-index: 2;

  svg {
    width: 40px;
    height: 40px;

    stroke: white;
    stroke-width: 4;
    fill: none;
    stroke-linecap: round;

    stroke-dasharray: 120;
    stroke-dashoffset: 120;

    animation: draw 0.6s ease forwards;
  }

  .ring {
    position: absolute;
    inset: 0;

    border-radius: 50%;

    background: linear-gradient(135deg, #ff6b6b, #ff8e53);

    box-shadow:
      0 12px 30px rgba(255, 90, 90, 0.28),
      0 0 0 10px rgba(255, 90, 90, 0.08);

    animation: pulse 2s infinite;
  }
}

.failed-badge {
  background: rgba(255, 90, 90, 0.1);
  color: #e03131;
}

.badge {
  display: inline-block;

  font-size: 12px;
  font-weight: 700;

  padding: 6px 12px;

  border-radius: 999px;

  margin-bottom: 12px;
}

h1 {
  font-size: 24px;
  font-weight: 800;

  margin: 6px 0 10px;

  color: #0f172a;
}

p {
  font-size: 14px;
  line-height: 1.5;

  color: #64748b;

  margin-bottom: 18px;
}

.block {
  background: rgba(248, 250, 252, 0.9);

  border-radius: 18px;

  padding: 12px 14px;

  margin-bottom: 18px;

  backdrop-filter: blur(8px);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 9px 0;

  font-size: 14px;

  color: #475569;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  b {
    font-weight: 700;
    color: #0f172a;
  }
}

.fail {
  color: #e03131 !important;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn {
  flex: 1;

  border: none;
  border-radius: 14px;

  padding: 14px;

  font-weight: 700;

  cursor: pointer;

  transition:
    transform 0.18s ease,
    opacity 0.18s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:active {
  transform: scale(0.98);
}

.retry {
  color: white;

  background: linear-gradient(135deg, #ff6b6b, #ff8e53);

  box-shadow: 0 12px 28px rgba(255, 100, 100, 0.24);
}

.close {
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
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
  }

  50% {
    transform: scale(1.06);
  }
}
</style>

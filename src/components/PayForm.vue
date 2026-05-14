<script setup lang="ts">
import { ref } from "vue";
import PayButton from "./PayButton.vue";
import PayClickButton from "./PayClickButton.vue";
import { useLangStore } from "@/stores/langStore";
import type { TTripCard } from "@/utils/types";
import Loading from "./Loading.vue";
import SuccessPayment from "./SuccessPayment.vue";
import FailPayment from "./FailPayment.vue";
const isOpen = ref(false);
const payStatus = ref<string>("");
const langStore = useLangStore();
const loading = ref<boolean>(false);
const open = () => (isOpen.value = true);
const close = () => (isOpen.value = false);
const { trip } = defineProps<{ trip: TTripCard }>();
import { getPayment } from "@/api";
const paymentId = ref<string | null>(null);
let interval: ReturnType<typeof setInterval> | null = null;
const startPolling = (id: string) => {
  if (interval) clearInterval(interval);

  interval = setInterval(async () => {
    const res = await getPayment(id);

    const status = res.data.data.status;

    if (status === "paid" || status === "success") {
      clearInterval(interval!);
      interval = null;

      trip.data.status = "paid";
      payStatus.value = "success";
      loading.value = false;
    }

    if (status === "failed" || status === "expired" || status === "cancelled") {
      clearInterval(interval!);
      interval = null;
      payStatus.value = "error";
      loading.value = false;
    }
  }, 1000);
};
const onPaymentCreated = (id: string) => {
  paymentId.value = id;
  loading.value = true;
  startPolling(id);
};
defineExpose({ open, close });
</script>

<template>
  <v-dialog v-model="isOpen" max-width="420" transition="scale-transition">
    <div class="payment-modal">
      <Loading v-if="loading" />
      <SuccessPayment v-else-if="payStatus === 'success'" @close="close" />
      <FailPayment v-else-if="payStatus === 'error'" @close="close" />
      <div v-else>
        <div class="modal-header">
          <h3>Оплата поездки</h3>
          <v-btn icon="mdi-close" variant="text" @click="close" />
        </div>

        <div class="modal-content">
          <p class="subtitle">Выберите способ оплаты</p>

          <PayButton
            @created="onPaymentCreated"
            :user="langStore.user"
            :id="trip.data.id"
          />
          <PayClickButton @created="onPaymentCreated" :id="trip.data.id" />
        </div>
      </div>
    </div>
  </v-dialog>
</template>
<style scoped lang="scss">
.payment-modal {
  background: linear-gradient(180deg, #ffffff, #f7fbff);
  border-radius: 20px;
  padding: 20px;

  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.25),
    0 4px 12px rgba(0, 0, 0, 0.08);

  animation: popIn 0.25s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: #003d52;
  }
}

.modal-content {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subtitle {
  font-size: 13px;
  color: #6b8a99;
  margin-bottom: 6px;
}

@keyframes popIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>

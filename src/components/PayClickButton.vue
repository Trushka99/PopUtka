<script setup lang="ts">
import { ref } from "vue";
import { createPayment } from "@/api";
import { useLangStore } from "@/stores/langStore";

const props = defineProps<{
  id: string;
  amount?: number;
}>();

const langStore = useLangStore();

const loading = ref(false);
const error = ref("");

const handlePay = async () => {
  error.value = "";
  loading.value = true;

  // ✅ открываем окно СРАЗУ
  const payWindow = window.open("", "_blank");

  if (!payWindow) {
    error.value = "Разрешите всплывающие окна для оплаты";
    loading.value = false;
    return;
  }

  // можно показать "загрузку" в новом окне
  payWindow.document.write(
    "<h3 style='font-family:sans-serif'>Загрузка оплаты...</h3>",
  );

  try {
    const res = await createPayment({
      tripId: props.id,
      amount: props.amount || 1000,
    });

    const paymentId = res.data.data.paymentId;

    const params = new URLSearchParams({
      amount: (props.amount || 1000).toFixed(2),
      merchant_id: "57280",
      merchant_user_id: String(langStore.user.id),
      service_id: "96928",
      transaction_param: paymentId,
      return_url: window.location.origin,
      card_type: "uzcard",
    });

    // ✅ редирект уже в открытом окне
    payWindow.location.href = `https://my.click.uz/services/pay?${params.toString()}`;
  } catch (err) {
    console.error(err);

    error.value = "Ошибка при создании платежа";

    payWindow.close();
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div>
    <button class="click_logo" @click="handlePay" :disabled="loading">
      <img src="https://m.click.uz/static/img/logo.png" />
    </button>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
.click_logo {
  padding: 6px 12px;
  cursor: pointer;
  color: #fff;
  font-size: 14px;
  font-family: Arial;
  font-weight: bold;
  border: 1px solid #037bc8;
  border-radius: 6px;
  background: linear-gradient(#27a8e0 0%, #1c8ed7 100%);
  display: flex;
  align-items: center;
  gap: 6px;
}

.click_logo:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.click_logo i {
  background: url(https://m.click.uz/static/img/logo.png) no-repeat top left;
  width: 24px;
  height: 24px;
  display: inline-block;
}

.error {
  color: red;
  margin-top: 8px;
  font-size: 13px;
}
</style>

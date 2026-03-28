<script setup lang="ts">
import { createPayment } from "@/api";
import { useLangStore } from "@/stores/langStore";
const langStore = useLangStore();
const { user, id } = defineProps<{
  user: any;
  id: string;
}>();
const pay = async () => {
  try {
    const res = await createPayment(
      {
        tripId: id,
        amount: 1000,
      },
      langStore.token,
    );

    const transId = res.data.data.paymentId;

    // @ts-ignore
    window.createPaymentRequest(
      {
        service_id: 96928,
        merchant_id: 57280,
        amount: "1000.00",
        transaction_param: transId,
        merchant_user_id: user.id,
        card_type: "uzcard",
      },
      (data: any) => {
        console.log("Payment status:", data.status);
      },
    );
  } catch (e) {
    console.log("ERROR", e);
  }
};
</script>
<template>
  <button @click="pay" class="pay-btn">Оплатить</button>
</template>

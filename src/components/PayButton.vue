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
  <button @click="pay" class="pay-btn">
    <span class="icon"></span>
    <span class="text">Оплатить картой</span>
    <span class="shine"></span>
  </button>
</template>
<style scoped lang="scss">
.pay-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;

  padding: 12px 20px;
  border: none;
  border-radius: 12px;

  font-size: 15px;
  font-weight: 600;
  color: #fff;

  cursor: pointer;
  overflow: hidden;

  background: linear-gradient(135deg, #4facfe, #00c6ff);
  box-shadow: 0 6px 18px rgba(0, 150, 255, 0.35);

  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 150, 255, 0.5);
  }

  &:active {
    transform: scale(0.97);
  }
}

/* 💳 иконка карты */
.icon {
  width: 22px;
  height: 16px;
  border-radius: 3px;
  background: linear-gradient(135deg, #ffffff, #dfe9f3);
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 3px;
    left: 3px;
    width: 60%;
    height: 3px;
    background: #4facfe;
    border-radius: 2px;
  }
}

/* текст */
.text {
  position: relative;
  z-index: 2;
}

/* ✨ эффект "блик" */
.shine {
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    120deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.5),
    rgba(255, 255, 255, 0.1)
  );
  transform: skewX(-25deg);
}

/* анимация блика */
.pay-btn:hover .shine {
  animation: shine 0.9s forwards;
}

@keyframes shine {
  100% {
    left: 125%;
  }
}
</style>

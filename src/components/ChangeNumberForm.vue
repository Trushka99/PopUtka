<script lang="ts" setup>
import { ref } from "vue";
import { createCode, confirmCode, updateProfile } from "@/api";
import { useLangStore } from "@/stores/langStore";
const props = defineProps<{
  modelValue: boolean;
}>();
const langStore = useLangStore();
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();
const step = ref<"phone" | "code">("phone");

const loading = ref(false);
const error = ref("");

const form = ref({
  phone: "",
  code: "",
});

const sendCode = async () => {
  try {
    loading.value = true;
    error.value = "";
    const res = await createCode({
      phone: form.value.phone,
      type: "change_phone",
    });
    langStore.user.phone = form.value.phone;
    console.log(res);
  } catch (err: any) {
    loading.value = false;
    error.value = "Ошибка отправки кода";
  } finally {
    step.value = "code";
    loading.value = false;
  }
};

const sendConfirm = async () => {
  try {
    loading.value = true;
    error.value = "";

    const code = await confirmCode({
      phone: form.value.phone,
      type: "change_phone",
      inputCode: form.value.code,
    });
    console.log(code);
    const res = updateProfile({ phone: form.value.phone });
    console.log(res);
  } catch (err: any) {
    loading.value = false;
    error.value = "Неверный код";
  } finally {
    loading.value = false;
    closeDialog();
  }
};
const closeDialog = () => {
  emit("update:modelValue", false);

  setTimeout(() => {
    step.value = "phone";

    form.value = {
      phone: "",
      code: "",
    };

    error.value = "";
  }, 250);
};
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    max-width="420"
  >
    <v-card class="change-phone-card">
      <div class="dialog-header">
        <div>
          <h2>
            {{ step === "phone" ? "Новый номер телефона" : "Подтверждение" }}
          </h2>

          <span>
            {{
              step === "phone"
                ? "Введите новый номер телефона"
                : "Введите код из SMS"
            }}
          </span>
        </div>

        <v-btn icon variant="text" density="comfortable" @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text>
        <transition name="fade" mode="out-in">
          <div v-if="step === 'phone'" key="phone">
            <v-text-field
              v-model="form.phone"
              label="Новый номер"
              variant="outlined"
              density="comfortable"
              placeholder="+998 90 123 45 67"
              class="custom-field"
              hide-details
            />

            <v-btn
              block
              class="submit-btn mt-5"
              :loading="loading"
              @click="sendCode"
            >
              Отправить код
            </v-btn>
          </div>

          <div v-else key="code">
            <v-text-field
              v-model="form.code"
              label="Код подтверждения"
              variant="outlined"
              density="comfortable"
              placeholder="123456"
              class="custom-field"
              hide-details
            />

            <div class="phone-preview">
              Код отправлен на
              <strong>{{ form.phone }}</strong>
            </div>

            <v-btn
              block
              class="submit-btn mt-5"
              :loading="loading"
              @click="sendConfirm"
            >
              Подтвердить
            </v-btn>

            <v-btn
              variant="text"
              block
              class="back-btn mt-2"
              @click="step = 'phone'"
            >
              Изменить номер
            </v-btn>
          </div>
        </transition>

        <div v-if="error" class="error-text">
          {{ error }}
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
.change-phone-btn {
  background: linear-gradient(135deg, #ff7a00, #ffb347) !important;
  color: white !important;

  border-radius: 16px;
  text-transform: none;
  font-weight: 600;

  padding: 0 18px;
  height: 46px;

  box-shadow: 0 8px 24px rgba(255, 122, 0, 0.2);
}

.change-phone-card {
  border-radius: 28px !important;

  padding: 10px;

  background: rgba(255, 255, 255, 0.82) !important;

  backdrop-filter: blur(18px);

  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12) !important;
}

.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  padding: 20px 20px 10px;

  h2 {
    font-size: 24px;
    font-weight: 800;
    color: #1f1f1f;
    margin-bottom: 4px;
  }

  span {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.5);
  }
}

.custom-field {
  margin-top: 8px;

  :deep(.v-field) {
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.9);
  }
}

.submit-btn {
  height: 50px;

  border-radius: 18px;

  text-transform: none;
  font-size: 15px;
  font-weight: 700;

  color: white !important;

  background: linear-gradient(135deg, #ff7a00, #ffb347) !important;

  box-shadow: 0 10px 24px rgba(255, 122, 0, 0.2);
}

.back-btn {
  text-transform: none;
  color: #666;
}

.phone-preview {
  margin-top: 16px;

  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);

  strong {
    color: #ff7a00;
  }
}

.error-text {
  margin-top: 14px;

  color: #ff4d4f;
  font-size: 13px;
  text-align: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>

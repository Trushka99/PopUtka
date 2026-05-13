<script setup lang="ts">
import { ref } from "vue";
import { register, login } from "@/api";
import { useLangStore } from "@/stores/langStore";
import { useRouter, useRoute } from "vue-router";
import { createCode, confirmCode } from "@/api";
const router = useRouter();
const route = useRoute();
const redirectPath = route.query.redirect?.toString() || "/";

const langStore = useLangStore();
const activeTab = ref("login");
const error = ref<string | null>(null);
const registerForm = ref({
  username: "",
  email: "",
  phone: "",
  password: "",
  role: "",
  firstName: "",
  lastName: "",
  gender: "",
  birthDate: "",
  id: "",
});
const code = ref<string>("");
const loginHandle = async () => {
  try {
    const { email, password } = registerForm.value;
    const res = await login(email, password);

    const user = res.data.data.user;
    registerForm.value.phone = user.phone;
    registerForm.value.id = user.id;
    registerForm.value.role = user.role;
    step.value = "code";
  } catch (err: any) {
    const errText = err.response.data.code;
    error.value = langStore.t(errText.toLowerCase());
    throw err; // ← ВАЖНО
  }
};
const sendCode = async () => {
  try {
    await loginHandle();

    const res = await createCode({
      phone: registerForm.value.phone,
      type: "login",
    });
  } catch (err) {
    console.error(err);
  }
};
const confirmcode = () => {
  confirmCode({
    phone: registerForm.value.phone,
    type: "login",
    inputCode: code.value,
    userId: registerForm.value.id,
    userRole: registerForm.value.role,
  })
    .then((res) => router.push(redirectPath))
    .catch((err) => {
      const errText = err.response.data.code;
      error.value = langStore.t(errText.toLowerCase());
    });
};
const handleRegister = async () => {
  const {
    username,
    email,
    phone,
    password,
    role,
    firstName,
    lastName,
    gender,
    birthDate,
  } = registerForm.value;
  try {
    const response = await register({
      username,
      email,
      birthDate,
      phone,
      password,
      role: role === "Пользователь" ? "passenger" : "driver",
      firstName,
      lastName,
      gender: gender === "Мужской" ? "male" : "female",
    });
    console.log("Регистрация успешна", response.data);
    loginHandle();
  } catch (err: any) {
    console.error("Ошибка регистрации", err);
    const errText = err.response.data.code;
    error.value = langStore.t(errText.toLowerCase());
  }
};
const roles = ["Пользователь", "Водитель"];
const step = ref("form");
const sex = ["Мужской", "Женский"];
</script>

<template>
  <div class="background">
    <v-card class="login-card" elevation="0" v-if="step === 'code'">
      <v-text-field
        label="Введите код из смс"
        outlined
        v-model="code"
        dense
        class="custom-field"
      ></v-text-field>
      <v-btn
        @click="confirmcode"
        color="gradient-orange"
        class="mt-4 mb-2 login-btn"
        block
        >Отправить</v-btn
      >
    </v-card>
    <v-card v-else class="login-card" elevation="0">
      <v-tabs
        class="tabs"
        v-model="activeTab"
        background-color="transparent"
        centered
      >
        <v-tab value="login">{{ langStore.t("login") }}</v-tab>
        <v-tab value="register">{{ langStore.t("signup") }}</v-tab>
      </v-tabs>

      <v-card-text v-if="activeTab === 'login'">
        <v-text-field
          :label="`${langStore.t('email')} ${langStore.t('or')} ${langStore.t('phone')} `"
          outlined
          v-model="registerForm.email"
          dense
          class="custom-field"
        ></v-text-field>
        <v-text-field
          :label="langStore.t('password')"
          type="password"
          v-model="registerForm.password"
          outlined
          dense
          class="custom-field"
        ></v-text-field>

        <v-btn
          @click="sendCode"
          color="gradient-orange"
          class="mt-4 mb-2 login-btn"
          block
          >Войти</v-btn
        >
        <span class="error">{{ error }}</span>
      </v-card-text>
      <v-card-text v-else>
        <v-text-field
          :label="langStore.t('name')"
          outlined
          dense
          v-model="registerForm.firstName"
          class="custom-field"
        ></v-text-field>
        <v-text-field
          :label="langStore.t('surname')"
          outlined
          dense
          v-model="registerForm.lastName"
          class="custom-field"
        ></v-text-field>
        <v-text-field
          :label="langStore.t('birthdate')"
          type="date"
          outlined
          dense
          v-model="registerForm.birthDate"
          class="custom-field"
        />
        <v-text-field
          :label="langStore.t('username')"
          outlined
          dense
          v-model="registerForm.username"
          class="custom-field"
        ></v-text-field>
        <v-text-field
          :label="langStore.t('phone')"
          outlined
          dense
          v-model="registerForm.phone"
          class="custom-field"
        ></v-text-field>
        <v-text-field
          :label="langStore.t('email')"
          outlined
          dense
          v-model="registerForm.email"
          class="custom-field"
        ></v-text-field>

        <v-text-field
          :label="langStore.t('password')"
          type="password"
          outlined
          dense
          v-model="registerForm.password"
          class="custom-field"
        ></v-text-field>
        <v-select
          :label="langStore.t('role')"
          :items="roles"
          v-model="registerForm.role"
          outlined
          dense
          class="custom-field"
        ></v-select>
        <v-select
          :label="langStore.t('sex')"
          :items="sex"
          v-model="registerForm.gender"
          outlined
          dense
          class="custom-field"
        ></v-select>

        <v-btn
          @click="handleRegister"
          color="gradient-orange"
          class="mt-4 mb-2 login-btn"
          block
        >
          {{ langStore.t("registr") }}
        </v-btn>
        <span class="error">{{ error }}</span>
      </v-card-text>
      <!-- <div class="forgot-password">{{ langStore.t("forgot") }}</div>

      <div class="divider-text">{{ langStore.t("or") }}</div> -->
      <!-- 
      <v-row justify="space-between" class="social-buttons">
        <v-btn outlined class="flex-grow-1 mx-1 social-btn">
          <img class="icon" src="/images/Google_logo.png" /> Google
        </v-btn>
        <v-btn outlined class="flex-grow-1 mx-1 social-btn">
          <img class="icon" src="/images/Telegram_logo.png" /> Telegram
        </v-btn>
      </v-row> -->
    </v-card>
  </div>
</template>

<style scoped lang="scss">
.error {
  color: red;
  margin-top: 100px;
}
.icon {
  width: 25px;
  height: 25px;
  margin-right: 10px;
}
.tabs {
  width: 100%;

  .v-tabs-slider {
    height: 3px;
  }

  .v-tab {
    flex: 1 1 0;
    text-align: center;
  }
}
.background {
  background-image: url("/images/background.png");
  width: 100%;
  min-height: 100dvh;
  padding: env(safe-area-inset-top) 1rem env(safe-area-inset-bottom) 1rem;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  justify-content: center;
  align-items: center;
  @media (max-width: 768px) {
    min-height: 113dvh;
  }
}

.login-card {
  width: 460px;
  padding: 32px;
  border-radius: 25px;
  max-height: 600px;
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.5);
  }

  overflow-y: auto;
  text-align: center;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);

  .v-tabs {
    margin-bottom: 24px;
    .v-tab {
      font-weight: 500;
      text-transform: none;
      font-size: 16px;
      color: black;
      opacity: 0.8;
      transition: opacity 0.2s;
      &:hover {
        opacity: 1;
      }
    }
    .v-tab--active {
      color: #ffb347 !important;
      opacity: 1;
    }
  }

  .custom-field {
    background: transparent !important;
    border-radius: 15px;
    margin-bottom: 16px;

    .v-field__outline {
      border-radius: 15px !important;
      border-color: rgba(0, 0, 0, 0.1) !important;
      background: rgba(255, 255, 255, 0.95) !important;
    }

    .v-input__slot {
      background: transparent !important;
    }

    .v-label {
      color: #555 !important;
    }

    input {
      background: transparent !important;
      color: #333;
      border-radius: 15px;
    }

    .v-field__ripple {
      background: transparent !important;
    }
  }

  .login-btn {
    background: linear-gradient(135deg, #ff7a00, #ffb347);
    color: white;
    font-weight: 600;
    border-radius: 20px;
    height: 45px;
    transition: transform 0.2s;
    &:hover {
      transform: scale(1.03);
    }
  }

  .forgot-password {
    margin-top: 12px;
    font-size: 14px;
    color: black;
    cursor: pointer;
    transition: color 0.3s;
    &:hover {
      color: #ffb347;
    }
  }

  .divider-text {
    margin: 20px 0;
    font-size: 14px;
    color: black;
    position: relative;
    &::before,
    &::after {
      content: "";
      position: absolute;
      top: 50%;
      width: 40%;
      height: 1px;
      background: black;
      opacity: 0.4;
    }
    &::before {
      left: 0;
    }
    &::after {
      right: 0;
    }
  }

  .social-buttons .social-btn {
    text-transform: none;
    border-radius: 15px;
    background: rgba(255, 255, 255, 0.2);
    color: black;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
    &:hover {
      background: rgba(255, 255, 255, 0.35);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
}

.v-application .gradient-orange {
  background: linear-gradient(135deg, #ff7a00, #ffb347) !important;
}
</style>

<script setup lang="ts">
import { ref } from "vue";
import { register, login, createCode, confirmCode, resetPass } from "@/api";
import { useLangStore } from "@/stores/langStore";
import { useRouter, useRoute } from "vue-router";
const router = useRouter();
const route = useRoute();
const redirectPath = route.query.redirect?.toString() || "/";

const langStore = useLangStore();
const activeTab = ref("login");
const recover = ref<boolean>(false);
const codePage = ref<boolean>(false);
const error = ref<string | null>(null);
const confirmcode = async () => {
  try {
    error.value = null;

    await confirmCode({
      phone: "998901148203",
      type: "recover",
      inputCode: registerForm.value.code,
    });

    await resetPass({
      phone: registerForm.value.phone,
      newPassword: registerForm.value.password,
    });

    recover.value = false;
    codePage.value = false;
  } catch (err: any) {
    console.log(err);

    const errText = err?.response?.data?.code;

    error.value = langStore.t(errText?.toLowerCase?.() || "unknown_error");
  }
};

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
  code: "",
});
const loginHandle = async () => {
  const { email, password } = registerForm.value;
  try {
    const res = await login(email, password);
    router.push(redirectPath);
  } catch (err) {
    const errText = err.response.data.code;
    error.value = langStore.t(errText.toLowerCase());
  }
};
const forgot = async () => {
  const res = await createCode({ phone: "998901148203", type: "recover" });
  console.log(res);
  recover.value = false;
  codePage.value = true;
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
const sex = ["Мужской", "Женский"];
</script>

<template>
  <div class="background">
    <v-card v-if="recover" class="login-card recover-card" elevation="0">
      <div class="recover-header">
        <h2>{{ langStore.t("recover_password") }}</h2>

        <span class="recover-subtitle">
          {{ langStore.t("enter_phone") }}
        </span>
      </div>

      <v-card-text>
        <v-text-field
          :label="langStore.t('phone')"
          outlined
          dense
          v-model="registerForm.phone"
          class="custom-field"
        />
        <v-text-field
          :label="langStore.t('new_password')"
          type="password"
          v-model="registerForm.password"
          outlined
          dense
          class="custom-field"
        />

        <v-text-field
          :label="langStore.t('repeat_password')"
          type="password"
          v-model="registerForm.password"
          outlined
          dense
          class="custom-field"
        />

        <v-btn
          @click="forgot"
          color="gradient-orange"
          class="mt-4 mb-2 login-btn"
          block
        >
          {{ langStore.t("save") }}
        </v-btn>

        <v-btn variant="text" class="back-btn" block @click="recover = false">
          {{ langStore.t("back") }}
        </v-btn>

        <span class="error">{{ error }}</span>
      </v-card-text>
    </v-card>
    <v-card v-else-if="codePage" class="login-card recover-card" elevation="0">
      <div class="recover-header">
        <h2>{{ langStore.t("recover_password") }}</h2>

        <span class="recover-subtitle"> {{ langStore.t("sms") }} </span>
      </div>

      <v-card-text>
        <v-text-field
          :label="langStore.t('sms')"
          outlined
          dense
          v-model="registerForm.code"
          class="custom-field"
        />

        <v-btn
          @click="confirmcode"
          color="gradient-orange"
          class="mt-4 mb-2 login-btn"
          block
        >
          {{ langStore.t("save") }}
        </v-btn>

        <v-btn variant="text" class="back-btn" block @click="recover = false">
          {{ langStore.t("back") }}
        </v-btn>

        <span class="error">{{ error }}</span>
      </v-card-text>
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
          :label="
            [
              langStore.t('email'),
              langStore.t('or'),
              langStore.t('phone'),
            ].join(' ')
          "
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
          @click="loginHandle"
          color="gradient-orange"
          class="mt-4 mb-2 login-btn"
          block
          >{{ langStore.t("login") }}</v-btn
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
          {{ langStore.t("regisrt") }}
        </v-btn>
        <span class="error">{{ error }}</span>
      </v-card-text>
      <v-btn
        @click="() => (recover = true)"
        variant="text"
        class="forgot-password"
      >
        {{ langStore.t("forgot") }}
      </v-btn>
      <!-- <div class="divider-text">{{ langStore.t("or") }}</div>

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
    border-radius: 14px !important;
    padding: 10px 16px !important;
    background: rgba(255, 255, 255, 0.12) !important;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: rgba(0, 0, 0, 0.75) !important;
    font-size: 14px;
    font-weight: 600;
    text-transform: none;
    letter-spacing: 0.2px;

    transition:
      all 0.25s ease,
      transform 0.2s ease,
      box-shadow 0.25s ease;

    &:hover {
      background: rgba(255, 179, 71, 0.14) !important;
      border-color: rgba(255, 179, 71, 0.35);

      color: #ff7a00 !important;

      transform: translateY(-1px);

      box-shadow:
        0 4px 14px rgba(255, 122, 0, 0.12),
        0 0 0 1px rgba(255, 179, 71, 0.08);
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

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  register,
  login,
  createCode,
  confirmCode,
  resetPass,
  checkRegister,
  checkRecover,
} from "@/api";
import { useLangStore } from "@/stores/langStore";
import { useRouter, useRoute } from "vue-router";
import LanguagePicker from "@/components/LanguagePicker.vue";
const router = useRouter();
const route = useRoute();
const repeatPassword = ref("");
const redirectPath = route.query.redirect?.toString() || "/";
const buttonLoading = ref<boolean>(false);
const langStore = useLangStore();
const activeTab = ref("login");
const recover = ref<boolean>(false);
const codePage = ref<boolean>(false);
const registCodePage = ref<boolean>(false);
const showPassword = ref<boolean>(false);
const error = ref<string | null>(null);
const phoneRules = [
  (v: string) => !!v || langStore.t("phone_required"),

  (v: string) => /^\d{11,15}$/.test(v) || langStore.t("phone_length"),
];
const nameRules = [
  (v: string) => !!v || langStore.t("name_required"),

  (v: string) =>
    /^[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳO‘o‘G‘g‘ʼʻ]+$/u.test(v) ||
    langStore.t("name_letters_only"),

  (v: string) => v.length <= 20 || langStore.t("name_max_length"),
];
const emailRules = [
  (v: string) => !!v || langStore.t("email_required"),

  (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || langStore.t("invalid_email"),

  (v: string) => {
    const allowedDomains = [
      "gmail.com",
      "mail.ru",
      "yandex.ru",
      "yandex.com",
      "yahoo.com",
      "outlook.com",
      "icloud.com",
      "umail.uz",
    ];

    const domain = v.split("@")[1]?.toLowerCase();

    return (
      allowedDomains.includes(domain) ||
      domain?.endsWith(".uz") ||
      langStore.t("email_domain_not_allowed")
    );
  },
];
const birthDateRules = [
  (v: string) => !!v || langStore.t("birthdate_required"),

  (v: string) => {
    const date = new Date(v);

    return date <= new Date() || langStore.t("birthdate_future");
  },

  (v: string) => {
    const birth = new Date(v);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();

    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age >= 18 || langStore.t("must_be_18");
  },
];
watch([activeTab, recover, codePage, registCodePage], () => {
  error.value = null;
});
const confirmcode = async () => {
  try {
    buttonLoading.value = true;
    error.value = null;

    await confirmCode({
      phone: registerForm.value.phone,
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
  } finally {
    buttonLoading.value = false;
  }
};
const isPasswordValid = computed(() => {
  return passwordRules.every(
    (rule) => rule(registerForm.value.password) === true,
  );
});
const passwordRules = [
  (v: string) => !!v || langStore.t("password_required"),

  (v: string) =>
    (v && v.length >= 8 && v.length <= 20) || langStore.t("password_length"),

  (v: string) =>
    /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/.test(v) ||
    langStore.t("password_latin_only"),
];
const isRecoverDisabled = computed(() => {
  return (
    !registerForm.value.phone ||
    !isPasswordValid.value ||
    registerForm.value.password !== repeatPassword.value
  );
});
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
  loginstr: "",
});
const isLoginDisabled = computed(() => {
  return (
    !registerForm.value.loginstr.trim() || !registerForm.value.password.trim()
  );
});
const isRegDisabled = computed(() => {
  return (
    !registerForm.value.firstName ||
    !registerForm.value.lastName ||
    !registerForm.value.email ||
    !registerForm.value.phone ||
    !registerForm.value.birthDate ||
    !registerForm.value.role ||
    !registerForm.value.gender ||
    !registerForm.value.loginstr ||
    nameRules.some((rule) => rule(registerForm.value.firstName) !== true) ||
    nameRules.some((rule) => rule(registerForm.value.lastName) !== true) ||
    emailRules.some((rule) => rule(registerForm.value.email) !== true) ||
    phoneRules.some((rule) => rule(registerForm.value.phone) !== true) ||
    birthDateRules.some((rule) => rule(registerForm.value.birthDate) !== true)
  );
});
const loginHandle = async () => {
  if (isLoginDisabled.value) {
    return;
  }

  const { loginstr, password } = registerForm.value;
  try {
    buttonLoading.value = true;
    const res = await login(loginstr, password);
    router.push(redirectPath);
  } catch (err: any) {
    const errText = err.response.data.code;
    error.value = langStore.t(errText.toLowerCase());
  } finally {
    buttonLoading.value = false;
  }
};
const forgot = async () => {
  try {
    await checkRecover(registerForm.value.phone);
    const res = await createCode({
      phone: registerForm.value.phone,
      type: "recover",
    });
    recover.value = false;
    codePage.value = true;
  } catch (err: any) {
    const errText = err.response.data.code;
    error.value = langStore.t(errText.toLowerCase());
  }
};
const sendCodeRegistr = async () => {
  if (isRegDisabled.value) {
    return;
  }
  const { loginstr, email, phone, password, firstName, lastName, birthDate } =
    registerForm.value;
  try {
    error.value = null;
    const res = await checkRegister({
      loginstr,
      email,
      phone,
      password,
      firstName,
      lastName,
      birthDate,
    });
    console.log(res);
    await createCode({
      phone: registerForm.value.phone,
      type: "register",
    });

    registCodePage.value = true;
  } catch (err: any) {
    console.error(err);

    const errText = err?.response?.data?.code;

    error.value = `${langStore.t(errText?.toLowerCase?.() || "unknown_error")}:${err?.response?.data?.meta?.conflicts} `;
  }
};
const handleRegister = async () => {
  const {
    loginstr,
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
    buttonLoading.value = true;
    await confirmCode({
      phone: registerForm.value.phone,
      type: "register",
      inputCode: registerForm.value.code,
    });
    const response = await register({
      username: loginstr,
      email,
      birthDate,
      phone,
      password,
      role:
        role === "Пассажир" || role === "Passenger" || role === "Yo'lovchi"
          ? "passenger"
          : "driver",
      firstName,
      lastName,
      gender:
        gender === "Erkak" || gender === "Мужской" || gender === "Male"
          ? "male"
          : "female",
    });
    console.log("Регистрация успешна", response.data);
    loginHandle();
  } catch (err: any) {
    console.error("Ошибка регистрации", err);
    const errText = err.response.data.code;
    error.value = langStore.t(errText.toLowerCase());
  } finally {
    buttonLoading.value = false;
  }
};
const roles = computed(() => [langStore.t("passenger"), langStore.t("driver")]);

const sex = computed(() => [langStore.t("man"), langStore.t("feman")]);
</script>

<template>
  <div class="background">
    <language-picker />
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
          prefix="+"
          maxlength="12"
          v-model="registerForm.phone"
          @input="registerForm.phone = registerForm.phone.replace(/\D/g, '')"
          class="custom-field"
        />
        <v-text-field
          :label="langStore.t('new_password')"
          :type="showPassword ? 'text' : 'password'"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword"
          :rules="passwordRules"
          v-model="registerForm.password"
          outlined
          dense
          class="custom-field"
        />

        <v-text-field
          :label="langStore.t('repeat_password')"
          :type="showPassword ? 'text' : 'password'"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword"
          v-model="repeatPassword"
          :rules="[
            ...passwordRules,
            (v) =>
              v === registerForm.password || langStore.t('passwords_not_match'),
          ]"
          outlined
          dense
          class="custom-field"
        />

        <v-btn
          @click="forgot"
          :disabled="isRecoverDisabled"
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
          <v-progress-circular
            :size="20"
            v-if="buttonLoading"
            color="primary"
            :width="2"
            indeterminate
          />

          <span v-else> {{ langStore.t("save") }}</span>
        </v-btn>

        <v-btn variant="text" class="back-btn" block @click="codePage = false">
          {{ langStore.t("back") }}
        </v-btn>

        <span class="error">{{ error }}</span>
      </v-card-text> </v-card
    ><v-card
      v-else-if="registCodePage"
      class="login-card recover-card"
      elevation="0"
    >
      <div class="recover-header">
        <h2>{{ langStore.t("signup") }}</h2>

        <span class="recover-subtitle">
          {{ langStore.t("sms") }}
        </span>
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
          @click="handleRegister"
          color="gradient-orange"
          class="mt-4 mb-2 login-btn"
          block
        >
          <v-progress-circular
            :size="20"
            v-if="buttonLoading"
            color="primary"
            :width="2"
            indeterminate
          />
          <span v-else> {{ langStore.t("confirm") }}</span>
        </v-btn>

        <v-btn
          variant="text"
          class="back-btn"
          block
          @click="registCodePage = false"
        >
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
        <form @submit.prevent="loginHandle">
          <v-text-field
            :label="`${langStore.t('email')} / ${langStore.t('username')}`"
            outlined
            v-model="registerForm.loginstr"
            dense
            class="custom-field"
          ></v-text-field>
          <v-text-field
            :label="langStore.t('password')"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPassword = !showPassword"
            v-model="registerForm.password"
            outlined
            dense
            class="custom-field"
          ></v-text-field>

          <v-btn
            type="submit"
            :disabled="isLoginDisabled"
            color="gradient-orange"
            class="mt-4 mb-2 login-btn"
            block
          >
            <v-progress-circular
              :size="20"
              v-if="buttonLoading"
              color="primary"
              :width="2"
              indeterminate
            />
            <span v-else>
              {{ langStore.t("login") }}
            </span>
          </v-btn>
          <span class="error">{{ error }}</span>
        </form>
      </v-card-text>
      <v-card-text @keydown.enter.prevent="sendCodeRegistr" v-else>
        <v-text-field
          :label="langStore.t('name')"
          outlined
          :rules="nameRules"
          dense
          v-model="registerForm.firstName"
          class="custom-field"
        ></v-text-field>
        <v-text-field
          :label="langStore.t('surname')"
          outlined
          :rules="nameRules"
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
          :rules="birthDateRules"
          class="custom-field"
        />
        <v-text-field
          :label="langStore.t('username')"
          outlined
          dense
          v-model="registerForm.loginstr"
          class="custom-field"
        ></v-text-field>

        <v-text-field
          :label="langStore.t('phone')"
          outlined
          dense
          :rules="phoneRules"
          prefix="+"
          maxlength="12"
          v-model="registerForm.phone"
          @input="registerForm.phone = registerForm.phone.replace(/\D/g, '')"
          class="custom-field"
        ></v-text-field>
        <v-text-field
          :label="langStore.t('email')"
          outlined
          :rules="emailRules"
          dense
          v-model="registerForm.email"
          class="custom-field"
        ></v-text-field>

        <v-text-field
          :label="langStore.t('password')"
          :type="showPassword ? 'text' : 'password'"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword"
          v-model="registerForm.password"
          :rules="passwordRules"
          outlined
          dense
          class="custom-field"
        />
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
          @click="sendCodeRegistr"
          color="gradient-orange"
          class="mt-4 mb-2 login-btn"
          block
          :disabled="isRegDisabled"
        >
          {{ langStore.t("registr") }}
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
    :deep(input:-webkit-autofill),
    :deep(input:-webkit-autofill:hover),
    :deep(input:-webkit-autofill:focus) {
      -webkit-text-fill-color: #333 !important;
      -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
      box-shadow: 0 0 0 1000px transparent inset !important;
      background-color: transparent !important;
      transition: background-color 9999s ease-in-out 0s;
    }

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
    width: 90%;
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

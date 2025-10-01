<script setup lang="ts">
import { ref } from "vue";
import { register } from "@/api";
const activeTab = ref("login");
const registerForm = ref({
  username: "",
  email: "",
  phone: "",
  password: "",
  role: "passenger",
  firstName: "",
  lastName: "",
  avatar: "",
});
const handleRegister = async () => {
  try {
    const response = await register(registerForm.value);
    console.log("Регистрация успешна", response.data);
    // тут можно сохранять токен в localStorage/cookie и редиректить
  } catch (err) {
    console.error("Ошибка регистрации", err);
  }
};
const roles = ["Пользователь", "Водитель"];
</script>

<template>
  <div class="background">
    <v-card class="login-card" elevation="0">
      <v-tabs
        class="tabs"
        v-model="activeTab"
        background-color="transparent"
        centered
      >
        <v-tab value="login">Вход</v-tab>
        <v-tab value="register">Регистрация</v-tab>
      </v-tabs>

      <v-card-text v-if="activeTab === 'login'">
        <v-text-field
          label="Email или телефон"
          outlined
          dense
          class="custom-field"
        ></v-text-field>
        <v-text-field
          label="Пароль"
          type="password"
          outlined
          dense
          class="custom-field"
        ></v-text-field>

        <v-btn color="gradient-orange" class="mt-4 login-btn" block
          >Войти</v-btn
        >
      </v-card-text>
      <v-card-text v-else>
        <v-text-field
          label="Имя"
          outlined
          dense
          v-model="registerForm.firstName"
          class="custom-field"
        ></v-text-field>
        <v-text-field
          label="Фамилия"
          outlined
          dense
          v-model="registerForm.lastName"
          class="custom-field"
        ></v-text-field>
        <v-text-field
          label="Логин (username)"
          outlined
          dense
          v-model="registerForm.username"
          class="custom-field"
        ></v-text-field>
        <v-text-field
          label="Телефон"
          outlined
          dense
          v-model="registerForm.phone"
          class="custom-field"
        ></v-text-field>
        <v-text-field
          label="Email"
          outlined
          dense
          v-model="registerForm.email"
          class="custom-field"
        ></v-text-field>

        <v-text-field
          label="Пароль"
          type="password"
          outlined
          dense
          v-model="registerForm.password"
          class="custom-field"
        ></v-text-field>
        <v-select
          label="Роль"
          :items="roles"
          v-model="registerForm.role"
          outlined
          dense
          class="custom-field"
        ></v-select>

        <v-btn
          @click="handleRegister"
          color="gradient-orange"
          class="mt-4 login-btn"
          block
        >
          Зарегистрироваться
        </v-btn>
      </v-card-text>
      <div class="forgot-password">Забыли пароль?</div>

      <div class="divider-text">или</div>

      <v-row justify="space-between" class="social-buttons">
        <v-btn outlined class="flex-grow-1 mx-1 social-btn">
          <img class="icon" src="/images/Google_logo.png" /> Google
        </v-btn>
        <v-btn outlined class="flex-grow-1 mx-1 social-btn">
          <img class="icon" src="/images/Telegram_logo.png" /> Telegram
        </v-btn>
      </v-row>
    </v-card>
  </div>
</template>

<style scoped lang="scss">
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
  background-image: url("images/background.png");
  width: 100%;
  height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-card {
  width: 460px;
  padding: 32px;
  border-radius: 25px;
  height: 600px;
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

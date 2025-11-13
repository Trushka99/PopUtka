<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { RouterLink } from "vue-router";
import "@mdi/font/css/materialdesignicons.css";
const menuOpen = ref(false);
import { useLangStore } from "@/stores/langStore";
const langStore = useLangStore();
import CreateTrip from "@/pages/CreateTrip.vue";
const langOptions = [
  {
    label: "RU",
    name: "Русский",
    flag: "https://flagcdn.com/w20/ru.png",
    value: "ru",
  },
  {
    label: "EN",
    name: "English",
    flag: "https://flagcdn.com/w20/gb.png",
    value: "en",
  },
  {
    label: "UZ",
    name: "Ozbekcha",
    flag: "https://flagcdn.com/w20/uz.png",
    value: "uz",
  },
];

const selectedLang = ref(langStore.currentLang || "ru");

// обновляем store при изменении
watch(selectedLang, (newLang) => {
  langStore.setLang(newLang);
});
</script>

<template>
  <header class="header">
    <!-- Логотип -->
    <RouterLink class="header__link" to="/">
      <img class="header__logo" src="/images/лого.png" alt="Logo" />
      <h2 class="header__title">poputka</h2>
    </RouterLink>

    <!-- Навигация для десктопа -->
    <nav class="header__nav">
      <RouterLink class="header__link" to="/"
        ><span class="header__text">{{ langStore.t("home") }}</span></RouterLink
      >
      <span class="header__text">{{ langStore.t("rides") }}</span>

      <RouterLink class="header__link" to="/drivers"
        ><span class="header__text">{{
          langStore.t("drivers")
        }}</span></RouterLink
      >
      <span class="header__text">{{ langStore.t("about us") }}</span>
      <span class="header__text">{{ langStore.t("contacts") }}</span>
    </nav>

    <!-- Кнопки и селект для десктопа -->
    <div class="header__buttons">
      <RouterLink
        v-if="Object.keys(langStore.user).length === 0"
        class="header__link"
        to="/login"
      >
        <v-btn class="header__driver">{{
          langStore.t("driver")
        }}</v-btn></RouterLink
      >
      <RouterLink
        v-if="Object.keys(langStore.user).length === 0"
        class="header__link"
        to="/login"
      >
        <v-btn class="header__driver" color="#5865f2">{{
          langStore.t("pass")
        }}</v-btn></RouterLink
      >
      <v-select
        v-model="selectedLang"
        :items="langOptions"
        item-title="name"
        item-value="value"
        variant="outlined"
        density="compact"
        hide-details
        class="lang-select"
      >
        <template #item="{ props, item }">
          <v-list-item v-bind="props">
            <template #prepend>
              <img
                :src="item.raw.flag"
                alt=""
                width="28"
                height="28"
                style="border-radius: 50%; margin-right: 8px"
              />
            </template>
          </v-list-item>
        </template>
        <template #selection="{ item }">
          <div style="display: flex; align-items: center">
            <img
              :src="item.raw.flag"
              alt="flag"
              width="28"
              height="28"
              style="border-radius: 50%; margin-right: 6px"
            />
            <span>{{ item.raw.label }}</span>
          </div>
        </template>
      </v-select>
      <RouterLink v-if="langStore.user" class="header__link" to="/users/me">
        <v-btn class="profile-btn" rounded="lg" variant="elevated">
          <v-icon start>mdi-account-circle</v-icon>
          {{ langStore.t("profile") || "Профиль" }}
        </v-btn>
      </RouterLink>
      <v-dialog v-if="langStore.user.role === 'driver'" max-width="750">
        <template v-slot:activator="{ props: activatorProps }">
          <v-btn
            v-bind="activatorProps"
            color="primary"
            variant="elevated"
            rounded="lg"
            class="create-trip-btn"
          >
            <v-icon start>mdi-plus</v-icon>
            {{ langStore.t("createTrip") }}
          </v-btn>
        </template>

        <template v-slot:default="{ isActive }">
          <CreateTrip />
        </template>
      </v-dialog>
    </div>

    <!-- Кнопка гамбургер для мобилки -->
    <v-btn class="header__hamburger" icon @click="menuOpen = !menuOpen">
      <v-icon>mdi-menu</v-icon>
    </v-btn>

    <!-- Мобильное меню -->
    <div v-if="menuOpen" class="header__mobile-menu">
      <RouterLink class="header__link" to="/">{{
        langStore.t("home")
      }}</RouterLink>
      <RouterLink class="header__link" to="/">{{
        langStore.t("drivers")
      }}</RouterLink>
      <span class="header__link">{{ langStore.t("rides") }}</span>
      <span class="header__link">{{ langStore.t("about us") }}</span>
      <span class="header__link">{{ langStore.t("contacts") }}</span>
      <v-btn class="header__driver" block>{{ langStore.t("driver") }}</v-btn>
      <v-btn class="header__driver" color="#5865f2" block>{{
        langStore.t("pass")
      }}</v-btn>
      <v-select
        v-model="selectedLang"
        :items="langOptions"
        item-title="name"
        item-value="value"
        variant="outlined"
        density="compact"
        hide-details
        class="lang-select"
      >
        <template #item="{ props, item }">
          <v-list-item v-bind="props">
            <template #prepend>
              <img
                :src="item.raw.flag"
                alt=""
                width="28"
                height="28"
                style="border-radius: 50%; margin-right: 8px"
              />
            </template>
          </v-list-item>
        </template>
        <template #selection="{ item }">
          <div style="display: flex; align-items: center">
            <img
              :src="item.raw.flag"
              alt="flag"
              width="28"
              height="28"
              style="border-radius: 50%; margin-right: 6px"
            />
            <span>{{ item.raw.label }}</span>
          </div>
        </template>
      </v-select>
    </div>
  </header>
</template>

<style scoped>
.header {
  background-color: white;
  border-radius: 0 0 24px 24px;
  padding: 8px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  width: 100%;
  color: black;
  z-index: 6;
  height: 10vh;
  margin-bottom: -20px;
}
.header__title {
  color: rgba(0, 128, 255, 1);
}
.header__logo {
  width: 40px;
  height: 40px;
}

.profile-btn {
  text-transform: none;
  background: linear-gradient(135deg, #1e88e5, #42a5f5);
  font-weight: 600;
  padding: 0 16px;
  transition: 0.2s ease;
}

.profile-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(66, 165, 245, 0.5);
}
.header__nav {
  display: flex;
  gap: 20px;
}
.header__hamburger {
  display: none;
}
.header__text {
  font-size: 18px;
  cursor: pointer;
  font-weight: 600;
}
.header__buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header__driver {
  text-transform: none;
  background-color: rgb(255, 109, 0);
}
.header__select {
  width: 120px;
  background-color: white;
  border-radius: 5px;
}
.header__menu-btn {
  display: none;
}
.header__link {
  font-size: 18px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 20px;
}
.header__link:visited {
  color: rgba(30, 26, 26, 1);
}
/* Мобильная адаптация */
@media (max-width: 920px) {
  .header__hamburger {
    display: block;
  }
  .header {
    padding: 10px 10px;
  }
  .header__nav,
  .header__buttons {
    display: none; /* скрываем десктопное меню и кнопки */
  }
  .header__menu-btn {
    display: flex;
  }
  .header__mobile-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background-color: rgb(26, 115, 232);
    width: 100%;
    flex-direction: column;
    display: flex;
    padding: 10px 20px;
    gap: 10px;
    z-index: 10;
  }
  .header__mobile-menu .header__link {
    color: white;
    font-size: 18px;
    text-decoration: none;
  }
  .header__mobile-menu .header__driver,
  .header__mobile-menu .header__select {
    width: 100%;
  }
}
.create-trip-btn {
  text-transform: none;
  font-weight: 600;
  background: linear-gradient(135deg, #ff6d00, #ff9100);
  color: white;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  v-icon {
    margin-right: 6px;
  }
}
</style>

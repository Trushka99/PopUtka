<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import "@mdi/font/css/materialdesignicons.css";
const menuOpen = ref(false);
</script>

<template>
  <header class="header">
    <!-- Логотип -->
    <RouterLink class="header__link" to="/">
      <img class="header__logo" src="/images/лого.png" alt="Logo" />
      <h2 class="header__title">Pop.utka</h2>
    </RouterLink>

    <!-- Навигация для десктопа -->
    <nav class="header__nav">
      <RouterLink class="header__link" to="/"
        ><span class="header__text">Главная</span></RouterLink
      >
      <span class="header__text">Поездки</span>
      
      <RouterLink class="header__link" to="/drivers"
        ><span class="header__text">Водители</span></RouterLink
      >
      <span class="header__text">О нас</span>
      <span class="header__text">Контакты</span>
    </nav>

    <!-- Кнопки и селект для десктопа -->
    <div class="header__buttons">
      <RouterLink class="header__link" to="/login">
        <v-btn class="header__driver">Я водитель</v-btn></RouterLink
      >
      <RouterLink class="header__link" to="/login">
        <v-btn class="header__driver" color="#5865f2"
          >Я пассажир</v-btn
        ></RouterLink
      >
      <v-select
        class="header__select"
        :items="['Руский', 'English', 'Ozbekcha']"
        density="compact"
        hide-details
        variant="outlined"
      ></v-select>
    </div>

    <!-- Кнопка гамбургер для мобилки -->
    <v-btn class="header__hamburger" icon @click="menuOpen = !menuOpen">
      <v-icon>mdi-menu</v-icon>
    </v-btn>

    <!-- Мобильное меню -->
    <div v-if="menuOpen" class="header__mobile-menu">
      <RouterLink class="header__link" to="/">Главная</RouterLink>
      <RouterLink class="header__link" to="/">Водители</RouterLink>
      <span class="header__link">Поездки</span>
      <span class="header__link">О нас</span>
      <span class="header__link">Контакты</span>
      <v-btn class="header__driver" block>Я водитель</v-btn>
      <v-btn class="header__driver" color="#5865f2" block>Я пассажир</v-btn>
      <v-select
        class="header__select"
        :items="['Руский', 'English', 'Ozbekcha']"
        density="compact"
        hide-details
        variant="outlined"
        block
      ></v-select>
    </div>
  </header>
</template>

<style scoped>
.header {
  background-color: rgb(26, 115, 232);
  padding: 8px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  width: 100%;
}

.header__logo {
  width: 60px;
  height: 80px;
}
.header__title {
  color: white;
}
.header__nav {
  display: flex;
  gap: 20px;
}
.header__hamburger {
  display: none;
}
.header__text {
  color: white;
  font-size: 18px;
  cursor: pointer;
}
.header__buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header__driver {
  text-transform: none;
  color: white;
  background-color: rgb(255, 109, 0);
}
.header__select {
  width: 120px;
  background-color: white;
  border-radius: 5px;
}
.header__menu-btn {
  display: none;
  color: white;
}
.header__link {
  color: white;
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
</style>

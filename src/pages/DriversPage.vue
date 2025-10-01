<template>
  <v-container fluid class="promo-page pa-0">
    <!-- Hero-секция с фоном -->
    <v-row class="hero-row" align="center" justify="center">
      <v-col cols="12" md="8" class="text-center hero-content">
        <h1 class="hero-title">🚗 Наши водители — сердце сервиса</h1>
        <p class="hero-subtitle">
          Опытные, пунктуальные и внимательные. Мы гордимся каждым членом нашей
          команды.
        </p>
      </v-col>
    </v-row>

    <!-- Акцентный текст-блок -->
    <v-row class="accent-row" justify="center">
      <v-col cols="12" md="10" class="text-center">
        <p class="accent-text">
          Более 100 профессиональных водителей ежедневно обеспечивают безопасные
          и комфортные поездки. Каждый из них проверен и готов подарить вам
          отличное впечатление.
        </p>
      </v-col>
    </v-row>

    <!-- Сетка карточек -->
    <v-row class="driver-grid" justify="center" dense>
      <v-col
        v-for="driver in drivers"
        :key="driver.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card class="driver-card variant5" elevation="3">
          <div :class="['status-bar', driver.status]"></div>
          <div class="content">
            <v-avatar size="56" class="mr-3">
              <v-img :src="driver.photo" />
            </v-avatar>
            <div>
              <div class="text-subtitle-1">{{ driver.name }}</div>
              <div class="text-body-2">
                ⭐ {{ driver.rating }} • {{ driver.experience }} лет
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- CTA с фоном -->
    <v-row class="cta-row" justify="center">
      <v-col cols="12" md="8" class="text-center">
        <div class="cta-block">
          🙌 Хотите стать частью нашей команды?
          <v-btn color="primary" class="ml-3" variant="flat">
            Присоединиться
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const drivers = [
  {
    id: 1,
    name: "Иван Иванов",
    rating: 4.9,
    experience: 7,
    status: "available",
    photo: "https://randomuser.me/api/portraits/men/45.jpg",
  },
  {
    id: 2,
    name: "Мария Смирнова",
    rating: 4.7,
    experience: 2,
    status: "busy",
    photo: "https://randomuser.me/api/portraits/women/32.jpg",
  },
  {
    id: 3,
    name: "Алексей Петров",
    rating: 4.8,
    experience: 5,
    status: "available",
    photo: "https://randomuser.me/api/portraits/men/64.jpg",
  },
  {
    id: 4,
    name: "Екатерина Лебедева",
    rating: 4.5,
    experience: 3,
    status: "available",
    photo: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    id: 5,
    name: "Сергей Кузнецов",
    rating: 4.6,
    experience: 6,
    status: "busy",
    photo: "https://randomuser.me/api/portraits/men/66.jpg",
  },
  {
    id: 6,
    name: "Ольга Николаева",
    rating: 4.4,
    experience: 2,
    status: "available",
    photo: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];
</script>

<style scoped>
.promo-page {
  background: linear-gradient(180deg, #f5f5f5 0%, #ffffff 100%);
  min-height: 100vh;
  padding-top: 100px;
  padding-bottom: 60px;
}

/* Hero */
.hero-row {
  background: url("https://images.unsplash.com/photo-1602093556925-2076e8d4936f?auto=format&fit=crop&w=1600&q=80")
    center/cover no-repeat;
  padding: 80px 0;
  color: white;
}
.hero-content {
  text-shadow: 0px 2px 10px rgba(0, 0, 0, 0.5);
}
.hero-title {
  font-size: 2.6rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: rgb(85, 82, 82);
}
.hero-subtitle {
  color: rgb(85, 82, 82);

  font-size: 1.2rem;
}

/* Акцентный текст */
.accent-row {
  margin: 40px 0;
}
.accent-text {
  font-size: 1.1rem;
  color: #333;
  line-height: 1.6;
}

/* Сетка карточек */
.driver-grid {
  row-gap: 24px;
  column-gap: 16px;
}

/* CTA */
.cta-row {
  margin-top: 60px;
}
.cta-block {
  background: #1976d2;
  color: white;
  padding: 24px;
  border-radius: 14px;
  font-size: 1.2rem;
  font-weight: 500;
}

/* Карточки (твои стили variant5) */
.driver-card {
  border-radius: 14px;
  transition: 0.3s;
}
.driver-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}
.driver-card.variant5 {
  display: flex;
  align-items: center;
  overflow: hidden;
}
.status-bar {
  width: 6px;
  height: 100%;
}
.status-bar.available {
  background: #4caf50;
}
.status-bar.busy {
  background: #f44336;
}
.content {
  display: flex;
  align-items: center;
  padding: 12px;
}
</style>

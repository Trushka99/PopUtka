<script setup lang="ts">
import { ref } from "vue";

const from = ref("");
const to = ref("");
const dateMenu = ref(false);
const date = ref(new Date().toISOString().substr(0, 10));
const passengers = ref("1 пассажир");
</script>

<template>
  <div class="search-bar">
    <!-- Откуда -->

    <v-text-field
      v-model="from"
      placeholder="Откуда"
      density="compact"
      variant="plain"
      prepend-inner-icon="mdi-map-marker"
      hide-details
    ></v-text-field>

    <!-- Иконка переключения -->
    <!-- <v-icon v-show="from" class="swap-icon" size="24"
      >mdi-swap-horizontal</v-icon
    > -->

    <!-- Куда -->
    <v-text-field
      v-model="to"
      placeholder="Куда"
      density="compact"
      variant="plain"
      prepend-inner-icon="mdi-map-marker-outline"
      hide-details
    ></v-text-field>

    <!-- Дата -->
    <v-menu
      v-model="dateMenu"
      transition="scale-transition"
      :close-on-content-click="false"
      offset-y
    >
      <template #activator="{ props }">
        <v-text-field
          v-bind="props"
          v-model="date"
          density="compact"
          variant="plain"
          prepend-inner-icon="mdi-calendar"
          readonly
          hide-details
        ></v-text-field>
      </template>
      <v-date-picker
        v-model="date"
        @update:model-value="dateMenu = false"
      ></v-date-picker>
    </v-menu>

    <!-- Кол-во пассажиров -->
    <v-text-field
      v-model="passengers"
      density="compact"
      variant="plain"
      prepend-inner-icon="mdi-account"
      hide-details
    ></v-text-field>

    <!-- Кнопка поиска -->
    <v-btn class="search-btn" color="#00AEEF" rounded="lg" height="48">
      Поиск
    </v-btn>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  background-color: white;
  padding: 8px 12px;
  border-radius: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  gap: 12px;
  z-index: 2;
  position: relative;
}

.search-bar .v-text-field {
  min-width: 0;
}

.swap-icon {
  color: #007bff;
}

.search-btn {
  color: white;
  text-transform: none;
  font-weight: bold;
}
@media (max-width: 920px) {
  .search-bar {
    flex-direction: column;
    width: 100%;
  }

  .search-bar .v-text-field {
    width: 100%;
    min-width: 0;
  }

  .search-btn {
    width: 100%;
  }
}
</style>

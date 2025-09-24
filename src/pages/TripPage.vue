<script setup lang="ts">
import { RouterLink } from "vue-router";
const trip = {
  departure: "Москва",
  arrival: "Киев",
  price: 19000,
  duration: "8 часов",
  departureTime: "19:30",
  arrivalTime: "25:30",
  seatsAvailable: 9,
  driver: {
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXkpZ1GYbxd0IlKteKbUSR4WxZp1hVJlkvYw&s",
    name: "Futa DOM",
    rating: 5,
    varified: true,
  },
  instantBooking: true,
  maxTwoBackSeats: true,
};
</script>
<template>
  <div class="trip-cont">
    <h2 style="font-size: 35px; margin: 20px 0 20px 0">Четверг, 4 сентября</h2>
    <div class="trip-flex">
      <div class="lefside">
        <div class="trip-info">
          <div class="flex-cont">
            <h4>{{ trip.departureTime }}</h4>
            <p>{{ trip.duration }}</p>
            <h4>{{ trip.arrivalTime }}</h4>
          </div>
          <div class="line"></div>
          <div class="flex-cont">
            <div>
              <h3>Москва</h3>
              <p>Ст. м. Водный стадион</p>
            </div>
            <div>
              <h3>Москва</h3>
              <p>Ст. м. Водный стадион</p>
            </div>
          </div>
        </div>
        <v-card class="trip-card" elevation="2" rounded="lg">
          <RouterLink class="link" to="/usermock">
            <div class="trip-flex hover">
              <v-avatar size="40" class="mr-3">
                <img :src="trip.driver.avatar" alt="Driver" />
              </v-avatar>
              <div class="driver-info flex-grow-1">
                <span class="font-weight-medium">{{ trip.driver.name }}</span>
                <span class="ml-1">★ {{ trip.driver.rating }}</span>
              </div>
              <v-icon icon="mdi-chevron-right" size="24" /></div
          ></RouterLink>
          <v-divider></v-divider>
          <div style="display: flex">
            <v-icon
              color="blue"
              icon="mdi-check-decagram"
              size="24"
              class="mr-2"
            />
            <p>Профиль подтвержден</p>
          </div>
          <div style="display: flex">
            <v-icon
              color="green"
              icon="mdi-calendar-clock"
              size="24"
              class="mr-2"
            />
            <p>Редко отменяет поездки</p>
          </div>

          <p>Едем по бесплатной дороге , с собой везем кошку.</p>

          <v-divider class="my-3"></v-divider>
          <div style="display: flex">
            <v-icon color="yellow" icon="mdi-flash" size="24" class="mr-2" />
            <p>Ваше бронирование будет подтверждено мгновенно</p>
          </div>
          <div style="display: flex">
            <v-icon icon="mdi-account-multiple" size="24" class="mr-2" />
            <p>Максимум двое сзади</p>
          </div>
          <div style="display: flex">
            <v-icon color="grey" icon="mdi-car" size="24" class="mr-2" />
            <p>TOYOTA URBAN CRUISER - Белый</p>
          </div>
        </v-card>
      </div>
      <div class="lefside">
        <v-card class="trip-card" elevation="2" rounded="lg">
          <div class="trip-flex hover">
            <div style="display: flex; gap: 25px">
              <h4>2 пассажира</h4>
              <h4>4800 ₽</h4>
            </div>
            <v-icon icon="mdi-chevron-right" size="24" />
          </div>
          <v-btn class="search-btn" color="#00AEEF" rounded="lg" height="48">
            Забронировать
          </v-btn>
        </v-card>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.trip-cont {
  width: 80%;
  margin: 0 auto;
}
.trip-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.link {
  text-decoration: none;
  color: black;
}
.trip-info {
  display: flex;
  height: 170px;
  background-color: white;
  padding: 20px;
  border-radius: 20px;
  border: 2px solid rgba(0, 174, 255, 0.452);
  margin-bottom: 25px;
}
.lefside {
  width: 48%;
}
.flex-cont {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.trip-flex {
  display: flex;
  justify-content: space-between;
  &.hover {
    align-items: center;
    border-radius: 25px;
    padding: 20px 10px;
    background-color: transparent;
    cursor: pointer;
    transition: background-color 0.3s ease-in-out;
    &:hover {
      background-color: rgb(238, 238, 238);
    }
  }
}
.line {
  flex: 1;
  height: 2px;
  background-color: #00414d;
  position: relative;
  margin: 0 8px;
  max-width: 3px;
  height: 100%;
}
@media (max-width: 920px) {
  .trip-cont {
    width: 95%;
  }
  .trip-flex {
    flex-direction: column;
    gap: 25px;
    &.hover {
      flex-direction: row;
    }
  }
  .lefside {
    width: 100%;
  }
}
</style>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { getBooking } from "@/api";
import Loading from "@/components/Loading.vue";
import { useLangStore } from "@/stores/langStore";
import { bookTrip } from "@/api";

const langStore = useLangStore();
const route = useRoute();
const trip = ref<any | null>(null);
const loading = ref<boolean>(false);
const createBooking = () => {
  bookTrip({ tripId: trip.value.id, seats: 1 })
    .then(() => console.log("Бронь создана"))
    .catch((err) => console.log(err));
};
onMounted(() => {
  loading.value = true;
  getBooking(String(route.params.id))
    .then((res) => {
      trip.value = res.data.data;
      console.log(res.data.data);
    })
    .catch((err) => {
      console.error("API ERROR:", err);
    })
    .finally(() => (loading.value = false));
});
function formatDuration(minutes: number) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hrs === 0) return `${mins} мин`;
  return `${hrs} ч ${mins} мин`;
}
function addDurationToTime(timeStr: string, durationMinutes: number) {
  const [hours, minutes] = timeStr.split(":").map(Number);

  const totalMinutes = hours * 60 + minutes + durationMinutes;

  const newHours = Math.floor((totalMinutes / 60) % 24);
  const newMinutes = totalMinutes % 60;

  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(
    2,
    "0"
  )}`;
}

const options: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
};
</script>
<template>
  <Loading v-if="loading" />
  <div v-else-if="trip" class="trip-cont">
    <h2 style="font-size: 35px; margin: 20px 0 20px 0">
      {{
        new Intl.DateTimeFormat(
          langStore.currentLang === "ru"
            ? "ru-RU"
            : langStore.currentLang === "en"
            ? "en-EN"
            : "uz-Cyrl-UZ",
          options
        ).format(new Date(trip.trip.departureDate))
      }}
    </h2>
    <div class="trip-flex">
      <div class="lefside">
        <div class="trip-info">
          <div class="flex-cont">
            <h4>{{ trip.trip.departureTime }}</h4>
            <p>{{ formatDuration(trip.trip.tripInfo.duration) }}</p>
            <h4>
              {{
                addDurationToTime(
                  trip.trip.departureTime,
                  trip.trip.tripInfo.duration
                )
              }}
            </h4>
          </div>
          <div class="line"></div>
          <div class="flex-cont">
            <div>
              <h3>{{ langStore.с(trip.trip.from.cityKey.toLowerCase()) }}</h3>
              <p>{{ trip.trip.from.address }}</p>
            </div>
            <div>
              <h3>{{ langStore.с(trip.trip.to.cityKey.toLowerCase()) }}</h3>
              <p>{{ trip.trip.to.address }}</p>
            </div>
          </div>
        </div>
        <v-card class="trip-card" elevation="2" rounded="lg">
          <RouterLink
            class="link"
            :to="{ name: 'user', params: { id: trip.trip.driverId } }"
          >
            <div class="trip-flex hover">
              <v-avatar size="40" class="mr-3">
                <img
                  :src="`https://web-production-68c29.up.railway.app${trip.trip.driver.avatar}`"
                  alt="Driver"
                  class="avatar"
                />
              </v-avatar>
              <div class="driver-info flex-grow-1">
                <span class="font-weight-medium"
                  >{{ trip.trip.driver.firstName }}
                  {{ trip.trip.driver.lastName }}</span
                >
                <span class="ml-1">★ {{ trip.trip.driver.rating }}</span>
              </div>
              <v-icon icon="mdi-chevron-right" size="24" /></div
          ></RouterLink>
          <v-divider></v-divider>
          <div v-if="trip.trip.driver.isVerified" style="display: flex">
            <v-icon
              color="blue"
              icon="mdi-check-decagram"
              size="24"
              class="mr-2"
            />
            <p>{{ langStore.t("verified") }}</p>
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

          <p>{{ trip.trip.description }}</p>

          <v-divider class="my-3"></v-divider>
          <div v-if="trip.trip.instantBooking" style="display: flex">
            <v-icon color="yellow" icon="mdi-flash" size="24" class="mr-2" />
            <p>{{ langStore.t("instant") }}</p>
          </div>
          <div v-if="trip.trip.maxTwoBackSeats" style="display: flex">
            <v-icon icon="mdi-account-multiple" size="24" class="mr-2" />
            <p>{{ langStore.t("maxTwoBackSeats") }}</p>
          </div>
          <div v-if="trip.trip.driver.car" style="display: flex">
            <v-icon color="grey" icon="mdi-car" size="24" class="mr-2" />
            <p>{{ trip.driver.car }}</p>
          </div>
        </v-card>
      </div>
      <div class="lefside">
        <v-card class="trip-card" elevation="2" rounded="lg">
          <div class="trip-flex hover">
            <div style="display: flex; gap: 25px">
              <h4>1 {{ langStore.t("passenger") }}</h4>
              <h4>{{ trip.trip.price }} UZS</h4>
            </div>
            <v-icon icon="mdi-chevron-right" size="24" />
          </div>
          <v-btn
            @click="createBooking"
            class="search-btn"
            color="#00AEEF"
            rounded="lg"
            height="48"
          >
            Одобрить
          </v-btn>
          <v-btn
            @click="createBooking"
            class="search-btn"
            color="#00AEEF"
            rounded="lg"
            height="48"
          >
            Отклонить
          </v-btn>
        </v-card>
      </div>
    </div>
  </div>
  <div v-else>Ошибка: поездка не найдена</div>
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
.avatar {
  width: 50px;
  height: 50px;
  object-fit: cover;
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

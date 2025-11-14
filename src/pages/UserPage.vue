<script setup lang="tsx">
import { useLangStore } from "@/stores/langStore";
import { onMounted, ref, computed } from "vue";
import { getUser } from "@/api";
import { useRoute } from "vue-router";
import Loading from "@/components/Loading.vue";
const langStore = useLangStore();
const user = ref<any>();
const loading = ref<boolean>(false);
const route = useRoute();
const age = computed(() => {
  if (!user.value?.birthDate) return "";
  const b = new Date(user.value.birthDate);
  if (isNaN(b.getTime())) return "";
  const diff = Date.now() - b.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});
onMounted(() => {
  loading.value = true;
  getUser(Number(route.params.id))
    .then((res) => {
      user.value = res.data.data;
      console.log(res.data.data);
    })
    .catch((err) => {
      console.error("API ERROR:", err);
    })
    .finally(() => (loading.value = false));
});
</script>
<template>
  <Loading v-if="loading" />
  <div div v-else-if="user" class="user-profile">
    <v-avatar
      class="user-profile__avatar"
      :image="`https://web-production-68c29.up.railway.app${user.avatar}`"
      size="80"
    ></v-avatar>
    <div class="user-profile__avatar-container">
      <div class="user-profile__flex">
        <div>
          <h3>{{ user.firstName }} {{ user.lastName }}</h3>
          <p>{{ age }} лет</p>
        </div>
      </div>
    </div>
    <div class="user-profile__text">
      <v-divider color="info" :thickness="10" />
      <div class="user-profile__flex">
        <v-icon color="blue-darken-2" icon="mdi-star-circle" end></v-icon>
        <h4>{{ user.rating }} / 5 - {{ user.reviews.length }} отзыва</h4>
      </div>
      <v-divider color="info" :thickness="10" />
      <h3>Верификация</h3>
      <div class="user-profile__flex">
        <v-icon
          color="blue-darken-2"
          icon="mdi-check-circle-outline"
          end
        ></v-icon>
        <p>Паспорт проверен</p>
      </div>
      <div class="user-profile__flex">
        <v-icon
          color="blue-darken-2"
          icon="mdi-check-circle-outline"
          end
        ></v-icon>
        <p>Эл. адрес подтвержден</p>
      </div>
      <div class="user-profile__flex">
        <v-icon
          color="blue-darken-2"
          icon="mdi-check-circle-outline"
          end
        ></v-icon>
        <p>Номер телефона подтвержден</p>
      </div>
      <v-divider color="info" :thickness="10" />
      <h3>{{ user.firstName }} о себе</h3>
      <div class="user-profile__comments">
        <div class="user-profile__flex">
          <v-icon color="blue-darken-2" icon="mdi-forum" end></v-icon>
          <p>
            {{ user.about === "" ? "Описание отсутствует" : user.about }}
          </p>
        </div>
      </div>

      <p>{{ user.about }}</p>
      <v-divider color="info" :thickness="10" />
      <p>11 опубликованных и завершенных поездок</p>
      <p>
        {{ langStore.t("regDate") }}:
        {{
          new Date(user.createdAt).toLocaleString("ru-RU", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        }}
      </p>
      <v-btn color="info" variant="tonal">Пожаловаться на пользователя</v-btn>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.user-profile__avatar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 83%;
  margin: 0 auto;
}
.user-profile__comments {
  display: flex;
  justify-content: space-between;
}
.user-profile__avatar {
  border: 4px solid rgb(26, 115, 232);
}
.user-profile__flex {
  display: flex;
  gap: 15px;
  align-items: center;
}
.user-profile__text {
  width: 83%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 55vh;
  margin: 0 auto;
}
.user-profile {
  margin: 0 auto;
  margin-top: 35px;
  width: 60%;
  display: flex;
  flex-direction: column;
}
@media (max-width: 1024px) {
  .user-profile {
    width: 90%;
  }
}
@media (max-width: 768px) {
  .user-profile {
    width: 95%;
  }
}
</style>

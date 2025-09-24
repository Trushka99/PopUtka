<script setup lang="tsx">
const driver = {
  avatar:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXkpZ1GYbxd0IlKteKbUSR4WxZp1hVJlkvYw&s",
  name: "Futa DOM",
  rating: 5,
  varified: true,
  age: 29,
  about: "",
  reviews: ["125", "12521", "125125"],
};
</script>
<template>
  <div class="user-profile">
    <v-avatar
      class="user-profile__avatar"
      :image="driver.avatar"
      size="80"
    ></v-avatar>
    <div class="user-profile__avatar-container">
      <div class="user-profile__flex">
        <div>
          <h4>{{ driver.name }}</h4>
          <p>{{ driver.age }} лет</p>
        </div>
      </div>
      <v-icon color="blue-darken-2" icon="mdi-pencil" end></v-icon>
    </div>
    <div class="user-profile__text">
      <v-divider color="info" :thickness="10" />
      <div class="user-profile__flex">
        <v-icon color="blue-darken-2" icon="mdi-star-circle" end></v-icon>
        <h4>{{ driver.rating }} / 5 - {{ driver.reviews.length }} отзыва</h4>
      </div>
      <v-divider color="info" :thickness="10" />
      <h3>{{ driver.name }}</h3>
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
      <h3>{{ driver.name }} о себе</h3>
      <div class="user-profile__comments">
        <div class="user-profile__flex">
          <v-icon color="blue-darken-2" icon="mdi-forum" end></v-icon>
          <p>
            {{ driver.about === "" ? "Описание отсутствует" : driver.about }}
          </p>
        </div>
        <v-icon color="blue-darken-2" icon="mdi-pencil" end></v-icon>
      </div>

      <p>{{ driver.about }}</p>
      <v-divider color="info" :thickness="10" />
      <p>11 опубликованных и завершенных поездок</p>
      <p>Дата регистрации: августа 2022</p>
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

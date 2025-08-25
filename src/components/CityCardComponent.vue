<script setup lang="ts">
defineProps({
  destination: String,
  price: Number,
  currency: String,
  img: String,
});
</script>
<template>
  <article class="city__card">
    <img class="city__img" :src="img" />
    <div class="city__text">
      <h3 class="city__destination">{{ destination }}</h3>
      <div>
        <p>От</p>
        <div class="city__price-container">
          <p class="city__price">{{ price }} {{ currency }}</p>
          <v-btn color="blue" :icon="'mdi-car-back '"></v-btn>
        </div>
      </div>
    </div>
  </article>
</template>
<style lang="scss" scoped>
.city__price {
  font-size: 26px;
}
.city__destination {
  font-weight: 500;
}
.city__card {
  flex-shrink: 0;
  width: 340px;
  height: 373px;
  margin-bottom: 50px;
  border: 1px solid rgba(128, 128, 128, 0.301);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 25px;
}
.city__price-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 50px;
}
.city__img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 15px 15px 0 0;
}
.city__text {
  width: 80%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>

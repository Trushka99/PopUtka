<script setup lang="ts">
import SearchingForm from "@/components/SearchingForm.vue";
import CardComponent from "@/components/CardComponent.vue";
import CityCardComponent from "@/components/CityCardComponent.vue";
import { ref, onMounted, onUnmounted } from "vue";
import { useLangStore } from "@/stores/langStore";
const langStore = useLangStore();
const slider = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(true);
const updateScrollButtons = () => {
  if (!slider.value) return;

  const el = slider.value;
  canScrollLeft.value = el.scrollLeft > 0;
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
};

const scrollLeft = () => {
  slider.value?.scrollBy({ left: -350, behavior: "smooth" });
};

const scrollRight = () => {
  slider.value?.scrollBy({ left: 350, behavior: "smooth" });
};

onMounted(() => {
  if (!slider.value) return;
  updateScrollButtons();
  slider.value.addEventListener("scroll", updateScrollButtons, {
    passive: true,
  });
});

onUnmounted(() => {
  slider.value?.removeEventListener("scroll", updateScrollButtons);
});

const data = [
  {
    destination: "Наманган → Андиджан",
    price: 730,
    currency: "RUB",
    img: "images/Andijan.jpg",
  },
  {
    destination: "Наманган → Андиджан",
    price: 730,
    currency: "RUB",
    img: "images/Andijan.jpg",
  },
  {
    destination: "Наманган → Андиджан",
    price: 730,
    currency: "RUB",
    img: "images/Andijan.jpg",
  },
  {
    destination: "Наманган → Андиджан",
    price: 730,
    currency: "RUB",
    img: "images/Andijan.jpg",
  },
  {
    destination: "Наманган → Андиджан",
    price: 730,
    currency: "RUB",
    img: "images/Andijan.jpg",
  },
  {
    destination: "Samarkand → Бухара",
    price: 941,
    currency: "RUB",
    img: "images/Bukhara.jpeg",
  },
  {
    destination: "Ташкент → Самарканд",
    price: 1500,
    currency: "RUB",
    img: "images/Samarkand.jpeg",
  },
  {
    destination: "Андиджан → Фергана",
    price: 590,
    currency: "RUB",
    img: "images/Fergana.jpg",
  },
  {
    destination: "Бухара → Ташкент",
    price: 800,
    currency: "RUB",
    img: "images/Bukhara.jpeg",
  },
];
</script>

<template>
  <img class="home__image" src="/images/main-image.png" />
  <SearchingForm />
  <div class="home__grid">
    <CardComponent /><CardComponent /><CardComponent /><CardComponent /><CardComponent /><CardComponent /><CardComponent /><CardComponent />
  </div>
  <section class="home__slider">
    <div class="home__button">
      <v-btn
        v-if="canScrollLeft"
        @click="scrollLeft"
        :icon="'mdi-chevron-left'"
      ></v-btn>
    </div>
    <div ref="slider" class="slider__container">
      <CityCardComponent
        v-for="(item, index) in data"
        :key="index"
        :destination="item.destination"
        :price="item.price"
        :currency="item.currency"
        :img="item.img"
      />
    </div>
    <div class="home__button">
      <v-btn
        v-if="canScrollRight"
        @click="scrollRight"
        :icon="'mdi-chevron-right'"
      ></v-btn>
    </div>
  </section>
</template>
<style lang="scss" scoped>
.home__slider {
  position: relative;
  width: 80%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 15px;
}
.home__button {
  min-width: 48px;
}
.slider__container {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  flex: 1;
}
.slider__container::-webkit-scrollbar {
  display: none; /* для Chrome/Safari */
}

.slider__arrow {
  position: absolute;
  top: 40%;
  transform: translateY(-50%);
  background: white;
  border: none;
  font-size: 2rem;
  padding: 5px 10px;
  border-radius: 50%;
  height: 50px;
  width: 50px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  z-index: 10;
}
.slider__arrow.left {
  left: -40px;
}
.slider__arrow.right {
  right: -40px;
}

.home {
  &__grid {
    width: 80%;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: auto;
    margin-top: 50px;
    gap: 20px;
    margin-bottom: 50px;
  }
  &__image {
    width: 100%;
    max-height: 402px;
    object-fit: cover;
    object-position: center 65%;
    margin-bottom: -90px;
    z-index: -1;
  }
  &__cities {
    display: flex;
    width: 70%;
    margin: 0 auto;
    overflow: auto;
    gap: 15px;
  }
}

@media (max-width: 920px) {
  .home {
    &__slider {
      width: 90%;
    }
    &__grid {
      width: 90%;
      grid-template-columns: repeat(2, 1fr);
    }
    &__image {
      margin-bottom: -250px;
    }
  }
}
@media (max-width: 768px) {
  .home {
    &__slider {
      width: 100%;
    }
    &__grid {
      width: 98%;
      grid-template-columns: 1fr;
    }
  }
}
@media (max-width: 420px) {
  .home {
    &__image {
      margin-bottom: -200px;
    }
  }
  .home__button {
    display: none;
  }
}
</style>

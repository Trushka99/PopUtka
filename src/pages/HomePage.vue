<script setup lang="ts">
import SearchingForm from "@/components/SearchingForm.vue";
import CardComponent from "@/components/CardComponent.vue";
import CityCardComponent from "@/components/CityCardComponent.vue";
import { ref, onMounted, onUnmounted, computed } from "vue";
import { getTrips } from "@/api";
import { useLangStore } from "@/stores/langStore";
import { useTripStore } from "@/stores/tripStore";
const tripStore = useTripStore();
const langStore = useLangStore();
const slider = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(true);

onMounted(() => {
  tripStore.fetchTrips();
});

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
const data = computed(() => [
  {
    destination: `${langStore.с("namangan")} → ${langStore.с("andijon")}`,
    price: 730,
    currency: "UZS",
    img: "images/Andijan.jpg",
    filters: { from: "namangan", to: "andijon" },
  },
  {
    destination: `${langStore.с("namangan")} → ${langStore.с("toshkent")}`,
    price: 730,
    currency: "UZS",
    img: "images/toshkent.jpg",
    filters: { from: "namangan", to: "toshkent" },
  },
  {
    destination: `${langStore.с("andijon")} → ${langStore.с("toshkent")}`,
    price: 730,
    currency: "UZS",
    img: "images/toshkent_2.jpg",
    filters: { from: "andijon", to: "toshkent" },
  },
  {
    destination: `${langStore.с("samarqand")} → ${langStore.с("toshkent")}`,
    price: 730,
    currency: "UZS",
    img: "images/toshkent_3.jpeg",
    filters: { from: "samarqand", to: "toshkent" },
  },
  {
    destination: `${langStore.с("namangan")} → ${langStore.с("andijon")}`,
    price: 730,
    currency: "UZS",
    img: "images/andijon.jpg",
    filters: { from: "namangan", to: "andijon" },
  },
  {
    destination: `${langStore.с("samarqand")} → ${langStore.с("farg'ona")}`,
    price: 941,
    currency: "UZS",
    img: "images/Bukhara.jpeg",
    filters: { from: "samarqand", to: "farg'ona" },
  },
]);
</script>

<template>
  <div class="homePage">
    <section class="hero">
      <div class="description">
        <h1 class="mainContent">
          Для тех,
          <span>
            <img
              class="duckImage"
              src="/images/duckDrive.png"
              alt="Duck drive a taxi"
            />
          </span>
          кому по пути
        </h1>
      </div>
      <SearchingForm />
    </section>
    <section class="container">
      <div
        :class="tripStore.trips.length > 0 ? 'hitchhikers' : 'hitchhikers non'"
      >
        <CardComponent v-for="value in tripStore.trips" :trip="value" />
      </div>
    </section>

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
          :filters="item.filters"
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
  </div>
</template>
<style lang="scss" scoped>
@use "../styles/mixins" as *;
@use "../styles/variables" as var;
.home__slider {
  position: relative;
  width: 100%;
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
  padding-top: 3rem;
  gap: 20px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  flex: 1;
}
.slider__container::-webkit-scrollbar {
  display: none;
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

.container {
  background-color: white;
  border-top-right-radius: 45px;
  border-top-left-radius: 45px;
  margin-top: -3rem;
  .hitchhikers {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: auto;
    width: 90%;
    margin: 0 auto;
    padding-top: 1rem;
    padding-bottom: 1rem;
    gap: 20px;
    margin-bottom: 50px;
    position: relative;
    z-index: 2;
    @media (max-width: 920px) {
      width: 90%;
      padding-top: 25px;
      grid-template-columns: repeat(2, 1fr);
      top: 0;
    }
    @media (max-width: 768px) {
      width: 98%;
      grid-template-columns: 1fr;
    }
  }
  .non {
    padding-top: 0;
    padding-bottom: 0;
  }
}
.homePage {
  .hero {
    @include flex(column, center, center, clamp(2rem, 5vw, 5rem));
    padding: clamp(
        5rem,
        calc(20px + (36 - 20) * ((100vw - 360px) / (1440 - 360))),
        4rem
      )
      1rem;
    background: var.$main-bg;

    .description {
      max-width: 1200px;
      width: 100%;
      background-image: url("/images/traceLine.svg?inline");
      background-position: bottom;
      background-size: clamp(340px, 100%, 1200px);
      background-repeat: no-repeat;

      .mainContent {
        @include flex(row, center, center);
        @include heading700(48px);
        @include clampProp(font-size, 16px, 48px);
        color: white;

        .duckImage {
          @include clampProp(width, 120px, 260px);
          @include clampProp(height, 80px, 200px);
        }
      }
    }
  }
}

@keyframes moveLine {
  from {
    background-position: 0 100%;
  }
  to {
    background-position: -1200px 100%;
  }
}
</style>

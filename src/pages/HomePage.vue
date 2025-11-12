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
  <div class="home__image">
    <svg
      viewBox="0 0 1080 223"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      class="svg"
    >
      <path
        class="svg_text"
        d="M86.96 145.04V127.16C88.56 127.16 89.74 126.8 90.5 126.08C91.3 125.32 91.88 124.38 92.24 123.26C92.6 122.14 92.88 120.92 93.08 119.6C93.28 118.24 93.44 116.86 93.56 115.46C93.72 114.06 93.84 112.68 93.92 111.32C94.12 107.92 94.26 104.6 94.34 101.36C94.42 98.08 94.48 94.82 94.52 91.58H123.56V127.16H128.66V145.04H121.16V134H94.46V145.04H86.96ZM98.84 127.16H116.06V98.42H101.54L101.12 112.82C101.08 113.7 101.02 114.74 100.94 115.94C100.9 117.1 100.8 118.32 100.64 119.6C100.48 120.88 100.26 122.18 99.98 123.5C99.7 124.78 99.32 126 98.84 127.16ZM131.606 134.06V127.46C132.486 127.46 133.246 127.26 133.886 126.86C134.526 126.42 135.066 125.84 135.506 125.12C136.026 124.24 136.406 123.12 136.646 121.76C136.886 120.4 137.046 119.02 137.126 117.62C137.246 115.82 137.326 114.02 137.366 112.22C137.446 110.38 137.506 108.62 137.546 106.94C137.626 105.22 137.666 103.7 137.666 102.38H161.426V134H154.106V108.86H144.446C144.406 110.18 144.346 111.58 144.266 113.06C144.226 114.54 144.166 116.04 144.086 117.56C144.006 119.04 143.866 120.48 143.666 121.88C143.506 123.44 143.226 125.02 142.826 126.62C142.466 128.22 141.826 129.66 140.906 130.94C139.946 132.14 138.746 132.96 137.306 133.4C135.906 133.84 134.006 134.06 131.606 134.06ZM166.544 134L175.004 121.94C172.884 121.34 171.184 120.26 169.904 118.7C168.624 117.14 167.984 115.18 167.984 112.82C167.984 110.78 168.304 109.1 168.944 107.78C169.584 106.42 170.484 105.36 171.644 104.6C172.804 103.8 174.164 103.24 175.724 102.92C177.284 102.56 178.984 102.38 180.824 102.38H194.984V134H187.664V123.32H182.144L175.124 134H166.544ZM183.404 117.2H187.664V108.68H181.364C180.444 108.68 179.604 108.74 178.844 108.86C178.084 108.98 177.444 109.2 176.924 109.52C176.404 109.84 176.004 110.26 175.724 110.78C175.444 111.3 175.304 112 175.304 112.88C175.304 113.84 175.544 114.62 176.024 115.22C176.504 115.78 177.144 116.22 177.944 116.54C178.744 116.82 179.624 117 180.584 117.08C181.544 117.16 182.484 117.2 183.404 117.2ZM226.179 134V108.86H215.739V102.38H243.999V108.86H233.499V134H226.179ZM262.255 134.42C258.975 134.42 256.175 133.74 253.855 132.38C251.575 131.02 249.835 129.14 248.635 126.74C247.475 124.3 246.895 121.48 246.895 118.28C246.895 115.08 247.495 112.26 248.695 109.82C249.935 107.34 251.695 105.4 253.975 104C256.295 102.6 259.075 101.9 262.315 101.9C264.635 101.9 266.695 102.32 268.495 103.16C270.295 103.96 271.815 105.1 273.055 106.58C274.295 108.02 275.215 109.7 275.815 111.62C276.415 113.5 276.695 115.52 276.655 117.68C276.655 118.16 276.635 118.64 276.595 119.12C276.555 119.56 276.495 120.04 276.415 120.56H254.215C254.335 121.96 254.695 123.24 255.295 124.4C255.935 125.56 256.815 126.48 257.935 127.16C259.095 127.84 260.535 128.18 262.255 128.18C263.255 128.18 264.215 128.06 265.135 127.82C266.055 127.54 266.855 127.14 267.535 126.62C268.255 126.1 268.735 125.44 268.975 124.64H276.295C275.775 126.92 274.815 128.78 273.415 130.22C272.015 131.66 270.335 132.72 268.375 133.4C266.455 134.08 264.415 134.42 262.255 134.42ZM254.335 115.1H269.575C269.575 113.78 269.275 112.58 268.675 111.5C268.075 110.42 267.215 109.58 266.095 108.98C265.015 108.34 263.695 108.02 262.135 108.02C260.455 108.02 259.055 108.36 257.935 109.04C256.815 109.72 255.955 110.6 255.355 111.68C254.755 112.76 254.415 113.9 254.335 115.1ZM278.902 134L290.062 117.86L279.502 102.38H288.022L294.862 113L301.522 102.38H309.862L299.302 118.04L310.642 134H302.062L294.562 123.08L287.062 134H278.902ZM316.757 142.58L314.657 139.4C315.257 139.08 315.877 138.62 316.517 138.02C317.157 137.46 317.737 136.82 318.257 136.1C318.817 135.42 319.197 134.8 319.397 134.24C318.237 134.12 317.237 133.7 316.397 132.98C315.597 132.22 315.197 131.16 315.197 129.8C315.197 128.4 315.677 127.3 316.637 126.5C317.597 125.7 318.677 125.3 319.877 125.3C321.397 125.3 322.597 125.88 323.477 127.04C324.357 128.16 324.797 129.64 324.797 131.48C324.797 133.12 324.397 134.7 323.597 136.22C322.837 137.74 321.837 139.06 320.597 140.18C319.397 141.3 318.117 142.1 316.757 142.58Z"
        fill="white"
      />
      <path
        class="svg_text"
        d="M672.54 134V102.38H679.86V115.04H684.9L693.12 102.38H701.4L691.26 117.32L701.76 134H693.3L685.44 121.52H679.86V134H672.54ZM719.578 134.42C716.338 134.42 713.538 133.76 711.178 132.44C708.858 131.12 707.058 129.24 705.778 126.8C704.538 124.36 703.918 121.5 703.918 118.22C703.918 114.9 704.538 112.04 705.778 109.64C707.058 107.2 708.858 105.3 711.178 103.94C713.538 102.58 716.338 101.9 719.578 101.9C722.778 101.9 725.538 102.58 727.858 103.94C730.178 105.3 731.958 107.22 733.198 109.7C734.438 112.14 735.058 115.02 735.058 118.34C735.058 121.58 734.438 124.42 733.198 126.86C731.998 129.26 730.238 131.12 727.918 132.44C725.598 133.76 722.818 134.42 719.578 134.42ZM719.518 127.76C721.518 127.76 723.118 127.32 724.318 126.44C725.558 125.56 726.458 124.4 727.018 122.96C727.578 121.52 727.858 119.96 727.858 118.28C727.858 116.6 727.578 115.02 727.018 113.54C726.458 112.06 725.558 110.88 724.318 110C723.118 109.08 721.518 108.62 719.518 108.62C717.518 108.62 715.898 109.08 714.658 110C713.418 110.88 712.518 112.06 711.958 113.54C711.398 115.02 711.118 116.6 711.118 118.28C711.118 120 711.398 121.58 711.958 123.02C712.518 124.46 713.418 125.62 714.658 126.5C715.898 127.34 717.518 127.76 719.518 127.76ZM740.919 134V102.38H749.859L759.099 116.78L768.159 102.38H776.979V134H769.659V111.68L760.059 127.04H757.899L748.179 111.62V134H740.919ZM785.364 148.16V140.84C787.164 140.84 788.604 140.64 789.684 140.24C790.804 139.88 791.744 139.28 792.504 138.44C793.264 137.64 793.964 136.58 794.604 135.26L781.164 102.38H789.684L798.804 126.92L806.004 102.38H814.044L805.524 128.84C805.044 130.32 804.504 131.86 803.904 133.46C803.344 135.06 802.684 136.62 801.924 138.14C801.204 139.66 800.384 141.06 799.464 142.34C798.544 143.62 797.504 144.68 796.344 145.52C795.384 146.2 794.424 146.72 793.464 147.08C792.544 147.48 791.444 147.76 790.164 147.92C788.924 148.08 787.324 148.16 785.364 148.16ZM834.552 134V102.38H862.452V134H855.132V108.86H841.872V134H834.552ZM883.992 134.42C880.752 134.42 877.952 133.76 875.592 132.44C873.272 131.12 871.472 129.24 870.192 126.8C868.952 124.36 868.332 121.5 868.332 118.22C868.332 114.9 868.952 112.04 870.192 109.64C871.472 107.2 873.272 105.3 875.592 103.94C877.952 102.58 880.752 101.9 883.992 101.9C887.192 101.9 889.952 102.58 892.272 103.94C894.592 105.3 896.372 107.22 897.612 109.7C898.852 112.14 899.472 115.02 899.472 118.34C899.472 121.58 898.852 124.42 897.612 126.86C896.412 129.26 894.652 131.12 892.332 132.44C890.012 133.76 887.232 134.42 883.992 134.42ZM883.932 127.76C885.932 127.76 887.532 127.32 888.732 126.44C889.972 125.56 890.872 124.4 891.432 122.96C891.992 121.52 892.272 119.96 892.272 118.28C892.272 116.6 891.992 115.02 891.432 113.54C890.872 112.06 889.972 110.88 888.732 110C887.532 109.08 885.932 108.62 883.932 108.62C881.932 108.62 880.312 109.08 879.072 110C877.832 110.88 876.932 112.06 876.372 113.54C875.812 115.02 875.532 116.6 875.532 118.28C875.532 120 875.812 121.58 876.372 123.02C876.932 124.46 877.832 125.62 879.072 126.5C880.312 127.34 881.932 127.76 883.932 127.76ZM922.032 134V102.38H949.932V134H942.612V108.86H929.352V134H922.032ZM958.333 148.16V140.84C960.133 140.84 961.573 140.64 962.653 140.24C963.773 139.88 964.713 139.28 965.473 138.44C966.233 137.64 966.933 136.58 967.573 135.26L954.133 102.38H962.653L971.773 126.92L978.973 102.38H987.013L978.493 128.84C978.013 130.32 977.473 131.86 976.873 133.46C976.313 135.06 975.653 136.62 974.893 138.14C974.173 139.66 973.353 141.06 972.433 142.34C971.513 143.62 970.473 144.68 969.313 145.52C968.353 146.2 967.393 146.72 966.433 147.08C965.513 147.48 964.413 147.76 963.133 147.92C961.893 148.08 960.293 148.16 958.333 148.16ZM998.847 134V108.86H988.407V102.38H1016.67V108.86H1006.17V134H998.847ZM1020.76 134V102.38H1028.08V122.96C1028.32 122.52 1028.62 122.04 1028.98 121.52C1029.38 121 1029.72 120.58 1030 120.26L1043.56 102.38H1050.04V134H1042.78V113.66C1042.46 114.18 1042.12 114.68 1041.76 115.16C1041.44 115.6 1041.12 116.02 1040.8 116.42L1027.42 134H1020.76Z"
        fill="white"
      />
      <rect
        opacity="0.5"
        y="169"
        width="1080"
        height="50.9787"
        fill="url(#paint0_linear_14_366)"
      />
      <path
        opacity="0.4"
        d="M90.5 192.626H1016"
        stroke="url(#paint1_linear_14_366)"
        stroke-width="4"
        stroke-dasharray="20 20"
      />
      <path
        d="M610.704 61.1607H623.296L627 169H607L610.704 61.1607Z"
        fill="#015ED1"
      />
      <path
        d="M617 44C613.134 44 610 47.134 610 51H624C624 47.134 620.866 44 617 44Z"
        fill="#015ED1"
      />
      <path
        d="M608 52H626C626 55.1049 625.046 57.9237 623.494 60H610.506C608.954 57.9237 608 55.1049 608 52Z"
        fill="#015ED1"
      />
      <path d="M378 76H438V169H378V76Z" fill="#015ED1" />
      <path
        d="M419 169H397V105C397.207 97.2218 408 91 408 91C408 91 418.793 97.2224 419 105V169Z"
        fill="#0056BF"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M438 76H378C378.565 56.5545 408 41 408 41C408 41 437.435 56.5545 438 76Z"
        fill="#015ED1"
      />
      <path d="M507 46H586V169H507V46Z" fill="#015ED1" />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M586 46H507C507.743 20.4431 546.5 0 546.5 0C546.5 0 585.257 20.4431 586 46Z"
        fill="#015ED1"
      />
      <path
        d="M564 169H530V68.0769C530.32 55.8113 547 46 547 46C547 46 563.68 55.8122 564 68.0769V169Z"
        fill="#0056BF"
      />
      <g filter="url(#filter0_f_14_366)">
        <ellipse cx="506" cy="202.5" rx="92" ry="7.5" fill="#002583" />
      </g>
      <g filter="url(#filter1_f_14_366)">
        <ellipse cx="439" cy="207.5" rx="11" ry="3.5" fill="#002583" />
      </g>
      <g filter="url(#filter2_f_14_366)">
        <ellipse cx="464" cy="204.5" rx="11" ry="3.5" fill="#002583" />
      </g>
      <g filter="url(#filter3_f_14_366)">
        <ellipse cx="547" cy="207.5" rx="11" ry="3.5" fill="#002583" />
      </g>
      <g filter="url(#filter4_f_14_366)">
        <ellipse cx="571" cy="203.5" rx="11" ry="3.5" fill="#002583" />
      </g>
      <rect
        width="255"
        height="186"
        transform="matrix(-1 -8.74228e-08 -8.74228e-08 1 650 33)"
        fill="url(#pattern0_14_366)"
      />
      <defs>
        <filter
          id="filter0_f_14_366"
          x="401"
          y="182"
          width="210"
          height="41"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="6.5"
            result="effect1_foregroundBlur_14_366"
          />
        </filter>
        <filter
          id="filter1_f_14_366"
          x="425"
          y="201"
          width="28"
          height="13"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="1.5"
            result="effect1_foregroundBlur_14_366"
          />
        </filter>
        <filter
          id="filter2_f_14_366"
          x="450"
          y="198"
          width="28"
          height="13"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="1.5"
            result="effect1_foregroundBlur_14_366"
          />
        </filter>
        <filter
          id="filter3_f_14_366"
          x="533"
          y="201"
          width="28"
          height="13"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="1.5"
            result="effect1_foregroundBlur_14_366"
          />
        </filter>
        <filter
          id="filter4_f_14_366"
          x="557"
          y="197"
          width="28"
          height="13"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="1.5"
            result="effect1_foregroundBlur_14_366"
          />
        </filter>
        <pattern
          id="pattern0_14_366"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use
            xlink:href="#image0_14_366"
            transform="matrix(0.000823919 1.96831e-05 -1.43571e-05 0.00112957 -0.235778 -0.17786)"
          />
        </pattern>
        <linearGradient
          id="paint0_linear_14_366"
          x1="0"
          y1="194.489"
          x2="1080"
          y2="194.489"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#002583" stop-opacity="0" />
          <stop offset="0.504808" stop-color="#002583" />
          <stop offset="1" stop-color="#002583" stop-opacity="0" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_14_366"
          x1="90.5"
          y1="193.126"
          x2="1016"
          y2="193.126"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="white" stop-opacity="0" />
          <stop offset="0.5" stop-color="white" />
          <stop offset="1" stop-color="white" stop-opacity="0" />
        </linearGradient>
        <image
          id="image0_14_366"
          width="1600"
          height="1066"
          preserveAspectRatio="none"
          href="/images/duck.png"
        />
      </defs>
    </svg>

    <SearchingForm />
  </div>
  <section class="second_section">
    <div class="home__grid">
      <CardComponent /><CardComponent /><CardComponent /><CardComponent /><CardComponent /><CardComponent /><CardComponent /><CardComponent />
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
.second_section {
  width: 100%;
  border-radius: 24px 24px 0 0;
  background-color: rgba(255, 255, 255, 1);
}
.svg {
  margin-bottom: 83px;
  width: 70%;
  height: 223px;
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
.duck {
  width: 450px;
  object-fit: contain;
  transform: scaleX(-1);
  margin-bottom: 82px;
}
.home {
  &__grid {
    width: 80%;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: auto;
    gap: 20px;
    margin-bottom: 50px;
    position: relative;
    top: -10vh;
    z-index: 2;
  }

  &__image {
    width: 100%;
    height: 75vh;
    background: linear-gradient(180deg, #0080ff 8.7%, #002583 100%);
    z-index: -1;
    flex-direction: column;
    display: flex;
    align-items: center;
    padding-top: 100px;
    overflow: hidden;
    margin-bottom: -19px;
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
    &__image {
      height: 100vh;
      padding-bottom: 30px;
    }
    &__slider {
      width: 90%;
    }
    &__grid {
      width: 90%;
      padding-top: 25px;
      grid-template-columns: repeat(2, 1fr);
      top: 0;
    }
  }
  .svg {
    width: 80%;
    transform: scale(2);
  }
  .svg_text {
    display: none;
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
  .svg {
    width: 100%;
    transform: scale(2.5);
  }
}
@media (max-width: 420px) {
  .home__button {
    display: none;
  }
}
</style>

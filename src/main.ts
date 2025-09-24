import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
import { ru } from "vuetify/locale";

// Vuetify
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "@mdi/font/css/materialdesignicons.css";

const vuetify = createVuetify({
  components,
  directives,
  locale: {
    locale: "ru",
    messages: {
      ru: {
        ...ru,
        timePicker: {
          title: "Выберите время",
        },
      },
    },
  },
});

createApp(App).use(createPinia()).use(router).use(vuetify).mount("#app");

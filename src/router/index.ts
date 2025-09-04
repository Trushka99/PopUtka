import { createRouter, createWebHistory } from "vue-router";
import HomePage from "@/pages/HomePage.vue";
import TripListPage from "@/pages/TripListPage.vue";
import TripPage from "@/pages/TripPage.vue";
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: HomePage,
    },
    {
      path: "/search",
      component: TripListPage,
    },
    {
      path: "/tripMock",
      component: TripPage,
    },
  ],
});

export default router;

import { createRouter, createWebHistory } from "vue-router";
import HomePage from "@/pages/HomePage.vue";
import TripListPage from "@/pages/TripListPage.vue";
import TripPage from "@/pages/TripPage.vue";
import UserPage from "@/pages/UserPage.vue";
import DriversPage from "@/pages/DriversPage.vue";
import AuthPage from "@/pages/AuthPage.vue";
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", component: HomePage, meta: { layout: "default" } },
    { path: "/login", component: AuthPage, meta: { layout: "empty" } },
    { path: "/search", component: TripListPage, meta: { layout: "default" } },
    { path: "/tripMock", component: TripPage, meta: { layout: "default" } },
    { path: "/usermock", component: UserPage, meta: { layout: "default" } },
    { path: "/drivers", component: DriversPage, meta: { layout: "default" } },
  ],
});

export default router;

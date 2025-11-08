import { createRouter, createWebHistory } from "vue-router";
import { useLangStore } from "@/stores/langStore";
import HomePage from "@/pages/HomePage.vue";
import TripListPage from "@/pages/TripListPage.vue";
import TripPage from "@/pages/TripPage.vue";
import UserPage from "@/pages/UserPage.vue";
import DriversPage from "@/pages/DriversPage.vue";
import AuthPage from "@/pages/AuthPage.vue";
import MyProfilePage from "@/pages/MyProfilePage.vue";
const routes = [
  { path: "/", component: HomePage, meta: { layout: "default" } },
  { path: "/login", component: AuthPage, meta: { layout: "empty" } },
  { path: "/search", component: TripListPage, meta: { layout: "default" } },
  {
    path: "/search/:id",
    name: "search",
    component: TripPage,
    meta: { layout: "default", requiresAuth: true },
  },
  {
    path: "/users/:id",
    name: "users",
    component: UserPage,
    meta: { layout: "default", requiresAuth: true },
  },
  {
    path: "/users/me",
    name: "users",
    component: MyProfilePage,
    meta: { layout: "default", requiresAuth: true },
  },
  {
    path: "/drivers",
    component: DriversPage,
    meta: { layout: "default", requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const langStore = useLangStore();

  if (!langStore.user?.id) {
    await langStore.initUser();
  }

  if (to.meta.requiresAuth && !langStore.user?.id) {
    next({ path: "/login", query: { redirect: to.fullPath } });
  } else {
    next();
  }
});

export default router;

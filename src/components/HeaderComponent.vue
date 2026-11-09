<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { RouterLink, useRouter } from "vue-router";
import "@mdi/font/css/materialdesignicons.css";
import { useLangStore } from "@/stores/langStore";
import { useSnackbarStore } from "@/stores/snackbarStore";
import CreateTrip from "@/pages/CreateTrip.vue";
import LangSwitcher from "@/components/LangSwitcher.vue";
import NotificationsPanel from "@/components/NotificationsPanel.vue";
import { socket } from "@/socket";
import {
  useNotifications,
  type AppNotification,
} from "@/composables/useNotifications";
import { initialsOf, mediaUrl } from "@/utils/tripFormat";

const langStore = useLangStore();
const snackbar = useSnackbarStore();
const router = useRouter();

const menuOpen = ref(false);
const tripDialog = ref<boolean>(false);

// ---------- Меню пользователя ----------
const isLoggedIn = computed(() => !!langStore.user?.id);

// Новые заявки пассажиров на поездки водителя
const pendingRequests = computed(
  () =>
    (langStore.user?.activeTrips ?? []).reduce(
      (sum: number, trip: any) =>
        sum +
        (trip.bookings ?? []).filter((b: any) => b.status === "pending").length,
      0,
    ) as number,
);

const profileLink = (tab?: string) => ({
  path: "/users/me",
  query: tab ? { tab } : {},
});

const signOut = async () => {
  menuOpen.value = false;
  try {
    await langStore.signOut();
    router.push("/");
  } catch (err) {
    console.error(err);
  }
};

// ---------- Уведомления ----------
const notifOpen = ref(false);
const { unreadCount, view, push } = useNotifications();

// Живые уведомления приходят через общий сокет (тот же, что у чатов).
// Подключаемся только после входа: без cookie сервер отклонит подключение.
const onNewNotification = (n: AppNotification) => {
  push(n);
  const v = view(n);
  snackbar.info(v.text ? `${v.title}: ${v.text}` : v.title);
};

socket.on("new-notification", onNewNotification);

watch(
  isLoggedIn,
  (loggedIn) => {
    if (loggedIn && !socket.connected) socket.connect();
    if (!loggedIn && socket.connected) socket.disconnect();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  socket.off("new-notification", onNewNotification);
});

const badge = computed(() => (unreadCount.value > 9 ? "9+" : unreadCount.value));
</script>

<template>
  <header class="header">
    <!-- Логотип -->
    <RouterLink class="header__link" to="/">
      <img class="header__logo" src="/images/лого.png" alt="Logo" />
      <h2 class="header__title">poputka</h2>
    </RouterLink>

    <!-- Навигация для десктопа -->
    <nav class="header__nav">
      <RouterLink class="header__link" to="/"
        ><span class="header__text">{{ langStore.t("home") }}</span></RouterLink
      >
      <RouterLink
        class="header__link"
        :to="`/search?departureAt=${new Date().toISOString().split('T')[0]}`"
      >
        <span class="header__text">{{ langStore.t("rides") }}</span>
      </RouterLink>

      <span class="header__text">{{ langStore.t("about us") }}</span>
      <span class="header__text">{{ langStore.t("contacts") }}</span>
    </nav>

    <!-- Кнопки и селект для десктопа -->
    <div class="header__buttons">
      <RouterLink
        v-if="Object.keys(langStore.user).length === 0"
        class="header__link"
        to="/login"
      >
        <v-btn class="header__driver" color="#5865f2">{{
          langStore.t("pass")
        }}</v-btn></RouterLink
      >
      <LangSwitcher />

      <v-menu
        v-if="isLoggedIn"
        v-model="notifOpen"
        location="bottom end"
        offset="10"
        :close-on-content-click="false"
      >
        <template #activator="{ props }">
          <button
            type="button"
            class="bell"
            :class="{ 'bell--active': unreadCount }"
            v-bind="props"
            :aria-label="langStore.t('notifications')"
          >
            <v-icon size="22">{{
              unreadCount ? "mdi-bell-ring-outline" : "mdi-bell-outline"
            }}</v-icon>
            <span v-if="unreadCount" class="bell__badge">{{ badge }}</span>
          </button>
        </template>

        <NotificationsPanel @navigate="notifOpen = false" />
      </v-menu>

      <v-menu v-if="isLoggedIn" location="bottom end" offset="10">
        <template #activator="{ props }">
          <button
            type="button"
            class="user-chip"
            v-bind="props"
            :aria-label="langStore.t('profile')"
          >
            <v-avatar size="34" class="user-chip__avatar">
              <v-img
                v-if="langStore.user.avatar"
                :src="mediaUrl(langStore.user.avatar)"
                cover
              />
              <span v-else>{{
                initialsOf(langStore.user.firstName, langStore.user.lastName)
              }}</span>
            </v-avatar>
            <span class="user-chip__name">{{ langStore.user.firstName }}</span>
            <span v-if="pendingRequests" class="user-chip__dot"></span>
            <v-icon size="18" class="user-chip__chevron">mdi-chevron-down</v-icon>
          </button>
        </template>

        <v-card class="user-menu" min-width="260" rounded="xl" elevation="10">
          <div class="user-menu__head">
            <v-avatar size="42" class="user-chip__avatar">
              <v-img
                v-if="langStore.user.avatar"
                :src="mediaUrl(langStore.user.avatar)"
                cover
              />
              <span v-else>{{
                initialsOf(langStore.user.firstName, langStore.user.lastName)
              }}</span>
            </v-avatar>
            <div class="user-menu__who">
              <div class="user-menu__name">
                {{ langStore.user.firstName }} {{ langStore.user.lastName }}
              </div>
              <div class="user-menu__role">
                {{
                  langStore.user.role === "driver"
                    ? langStore.t("driver")
                    : langStore.t("passenger")
                }}
              </div>
            </div>
          </div>

          <v-list density="comfortable" nav class="user-menu__list">
            <v-list-item
              prepend-icon="mdi-account-outline"
              :title="langStore.t('profile')"
              :to="profileLink()"
              :active="false"
            />
            <v-list-item
              prepend-icon="mdi-ticket-confirmation-outline"
              :title="langStore.t('bookings')"
              :to="profileLink('bookings')"
              :active="false"
            >
              <template v-if="pendingRequests" #append>
                <span class="user-menu__badge">{{ pendingRequests }}</span>
              </template>
            </v-list-item>
            <v-list-item
              prepend-icon="mdi-map-marker-path"
              :title="langStore.t('myTrips')"
              :to="profileLink('trips')"
              :active="false"
            />
          </v-list>

          <v-divider />

          <v-list density="comfortable" nav class="user-menu__list">
            <v-list-item
              prepend-icon="mdi-logout"
              :title="langStore.t('logout')"
              class="user-menu__logout"
              @click="signOut"
            />
          </v-list>
        </v-card>
      </v-menu>
      <v-dialog
        v-model="tripDialog"
        v-if="langStore.user.role === 'driver'"
        max-width="940"
      >
        <template v-slot:activator="{ props: activatorProps }">
          <v-btn
            v-bind="activatorProps"
            color="primary"
            variant="elevated"
            rounded="lg"
            class="create-trip-btn"
          >
            <v-icon start>mdi-plus</v-icon>
            {{ langStore.t("createTrip") }}
          </v-btn>
        </template>

        <template v-slot:default="{ isActive }">
          <CreateTrip :closeDialog="() => (tripDialog = false)" />
        </template>
      </v-dialog>
    </div>

    <!-- Кнопка гамбургер для мобилки -->
    <v-btn class="header__hamburger" icon @click="menuOpen = !menuOpen">
      <v-icon>mdi-menu</v-icon>
    </v-btn>
  </header>
  <!-- Мобильное меню -->
  <div v-if="menuOpen" class="header__mobile-menu">
    <RouterLink class="header__link" to="/">{{
      langStore.t("home")
    }}</RouterLink>
    <RouterLink
      class="header__link"
      :to="`/search?departureAt=${new Date().toISOString().split('T')[0]}`"
    >
      <span class="header__link">{{ langStore.t("rides") }}</span></RouterLink
    >
    <span class="header__link">{{ langStore.t("about us") }}</span>
    <span class="header__link">{{ langStore.t("contacts") }}</span>
    <RouterLink
      v-if="Object.keys(langStore.user).length === 0"
      class="header__link"
      to="/login"
    >
      <v-btn class="header__driver" block>{{
        langStore.t("driver")
      }}</v-btn></RouterLink
    >
    <v-btn
      v-if="Object.keys(langStore.user).length === 0"
      to="/login"
      class="header__driver"
      color="#5865f2"
      block
      >{{ langStore.t("pass") }}</v-btn
    >
    <LangSwitcher variant="segmented" />

    <template v-if="isLoggedIn">
      <div class="header__mobile-divider"></div>
      <button type="button" class="header__mobile-logout" @click="signOut">
        <v-icon size="20">mdi-logout</v-icon>
        {{ langStore.t("logout") }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.header {
  background-color: white;
  border-radius: 0 0 24px 24px;
  padding: 8px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  width: 100%;
  color: black;
  z-index: 6;
  height: 10vh;
  margin-bottom: -20px;
}
.header__title {
  color: rgba(0, 128, 255, 1);
}
.header__logo {
  width: 40px;
  height: 40px;
}

/* Колокольчик уведомлений */
.bell {
  position: relative;
  width: 42px;
  height: 42px;
  border: 1px solid #d6e3f1;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #e9f1fa;
  color: #2c4a6e;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.bell:hover,
.bell[aria-expanded="true"] {
  background: #dde9f6;
  border-color: #bdd3ec;
  box-shadow: 0 4px 12px rgba(30, 100, 180, 0.14);
  color: #0b4fa8;
}

.bell--active {
  color: #0b4fa8;
}

.bell--active .v-icon {
  animation: bell-ring 3.2s ease-in-out infinite;
  transform-origin: 50% 10%;
}

@keyframes bell-ring {
  0%,
  82%,
  100% {
    rotate: 0deg;
  }
  86% {
    rotate: 14deg;
  }
  90% {
    rotate: -12deg;
  }
  94% {
    rotate: 8deg;
  }
  97% {
    rotate: -4deg;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bell--active .v-icon {
    animation: none;
  }
}

.bell__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border: 2px solid #fff;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #ff6d00;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

/* Кнопка-аватарка с меню пользователя */
.user-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border: 1px solid #d6e3f1;
  border-radius: 999px;
  background: #e9f1fa;
  color: #1d3a5c;
  font: inherit;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.user-chip:hover,
.user-chip[aria-expanded="true"] {
  background: #dde9f6;
  border-color: #bdd3ec;
  box-shadow: 0 4px 12px rgba(30, 100, 180, 0.14);
}

.user-chip__avatar {
  border: 2px solid #fff;
  background: #dbeafe;
  color: #0b4fa8;
  font-size: 13px;
  font-weight: 700;
}

.user-chip__name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.user-chip__dot {
  position: absolute;
  top: 2px;
  left: 28px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: #ff6d00;
}

.user-chip__chevron {
  color: #6b7d94;
  transition: transform 0.2s ease;
}

.user-chip[aria-expanded="true"] .user-chip__chevron {
  transform: rotate(180deg);
}

.user-menu {
  padding: 4px;
}

.user-menu__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px 6px;
}

.user-menu__who {
  min-width: 0;
}

.user-menu__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
}

.user-menu__role {
  font-size: 12px;
  color: #66758a;
}

.user-menu__list {
  padding: 4px;
}

.user-menu__badge {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background: #ff6d00;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.user-menu__logout {
  color: #c0362c !important;
}

.header__mobile-divider {
  height: 1px;
  margin: 6px 0;
  background: rgba(255, 255, 255, 0.3);
}

.header__mobile-logout {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
}
.header__nav {
  display: flex;
  gap: 20px;
}
.header__hamburger {
  display: none;
}
.header__text {
  font-size: 18px;
  cursor: pointer;
  font-weight: 600;
}
.header__buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header__driver {
  text-transform: none;
  background-color: rgb(255, 109, 0);
}
.header__select {
  width: 120px;
  background-color: white;
  border-radius: 5px;
}
.header__menu-btn {
  display: none;
}
.header__link {
  font-size: 18px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 20px;
}
.header__link:visited {
  color: rgba(30, 26, 26, 1);
}
/* Мобильная адаптация */
@media (max-width: 920px) {
  .header__hamburger {
    display: block;
  }
  .header {
    padding: 10px 10px;
  }
  .header__nav,
  .header__buttons {
    display: none;
  }
  .header__menu-btn {
    display: flex;
  }
  .header__mobile-menu {
    position: absolute;
    top: 110px;
    right: 0;
    background-color: rgb(26, 115, 232);
    width: 100%;
    flex-direction: column;
    margin-top: -50px;
    display: flex;
    padding: 35px 20px;
    gap: 10px;
    z-index: 1;
  }
  .header__mobile-menu .header__link {
    color: white;
    font-size: 18px;
    text-decoration: none;
  }
  .header__mobile-menu .header__driver,
  .header__mobile-menu .header__select {
    width: 100%;
  }
}
.create-trip-btn {
  text-transform: none;
  font-weight: 600;
  background: linear-gradient(135deg, #ff6d00, #ff9100);
  color: white;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  v-icon {
    margin-right: 6px;
  }
}
</style>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { useLangStore } from "@/stores/langStore";
import LangSwitcher from "@/components/LangSwitcher.vue";
import InstallAppButton from "@/components/InstallAppButton.vue";
import { mediaUrl } from "@/utils/tripFormat";

// Мобильный сайдбар: выезжает справа по кнопке-бургеру в шапке.
const open = defineModel<boolean>({ default: false });

defineProps<{
  /** Новые заявки пассажиров — оранжевая точка на аватарке */
  pendingRequests?: number;
}>();

const emit = defineEmits<{ logout: [] }>();

const langStore = useLangStore();
const route = useRoute();

const isLoggedIn = computed(() => !!langStore.user?.id);
const fullName = computed(() =>
  [langStore.user?.firstName, langStore.user?.lastName].filter(Boolean).join(" "),
);

const currentLangCode = computed(() =>
  (langStore.currentLang || "ru").toUpperCase(),
);

type NavItem = {
  key: string;
  icon: string;
  label: string;
  to?: string;
  active: boolean;
};

const items = computed<NavItem[]>(() => [
  {
    key: "home",
    icon: "mdi-home-outline",
    label: langStore.t("home"),
    to: "/",
    active: route.path === "/",
  },
  {
    key: "rides",
    icon: "mdi-car-outline",
    label: langStore.t("rides"),
    to: `/search?departureAt=${new Date().toISOString().split("T")[0]}`,
    active: route.path.startsWith("/search"),
  },
  {
    key: "chats",
    icon: "mdi-chat-outline",
    label: langStore.t("chats_title"),
    to: "/chats",
    active: route.path.startsWith("/chats"),
  },
  {
    key: "contacts",
    icon: "mdi-phone-outline",
    label: langStore.t("contacts"),
    active: false,
  },
]);

const close = () => {
  open.value = false;
};

const logout = () => {
  close();
  emit("logout");
};

// ---------- Поведение открытого сайдбара ----------
const panel = ref<HTMLElement | null>(null);
const closeBtn = ref<HTMLButtonElement | null>(null);
let returnFocusTo: HTMLElement | null = null;

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Esc закрывает, Tab не выпускает фокус за пределы панели
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    close();
    return;
  }
  if (e.key !== "Tab" || !panel.value) return;
  const nodes = Array.from(
    panel.value.querySelectorAll<HTMLElement>(FOCUSABLE),
  ).filter((el) => el.offsetParent !== null);
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
};

watch(open, async (isOpen) => {
  // Страница под сайдбаром не прокручивается
  document.documentElement.style.overflow = isOpen ? "hidden" : "";

  if (isOpen) {
    returnFocusTo = document.activeElement as HTMLElement | null;
    document.addEventListener("keydown", onKeydown);
    await nextTick();
    closeBtn.value?.focus({ preventScroll: true });
  } else {
    document.removeEventListener("keydown", onKeydown);
    returnFocusTo?.focus?.({ preventScroll: true });
    returnFocusTo = null;
  }
});

// Переход по ссылке — закрываем
watch(
  () => route.fullPath,
  () => close(),
);

// Экран стал широким (поворот планшета, ресайз окна) — сайдбар больше не нужен
let desktopQuery: MediaQueryList | null = null;
const onDesktopChange = (e: MediaQueryListEvent) => {
  if (e.matches) close();
};

onMounted(() => {
  desktopQuery = window.matchMedia("(min-width: 921px)");
  desktopQuery.addEventListener("change", onDesktopChange);
});

onBeforeUnmount(() => {
  desktopQuery?.removeEventListener("change", onDesktopChange);
  document.removeEventListener("keydown", onKeydown);
  document.documentElement.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <Transition name="sidebar" :duration="{ enter: 340, leave: 260 }">
      <div v-if="open" class="sidebar">
        <div class="sidebar__scrim" aria-hidden="true" @click="close"></div>

        <aside
          id="mobile-sidebar"
          ref="panel"
          class="sidebar__panel"
          role="dialog"
          aria-modal="true"
          :aria-label="langStore.t('menu')"
        >
          <div class="sidebar__content">
            <!-- Логотип и крестик -->
            <div class="sidebar__top">
              <RouterLink class="sidebar__brand" to="/">
                <img class="sidebar__logo" src="/images/лого.png" alt="" />
                <span class="sidebar__title">poputka</span>
              </RouterLink>
              <button
                ref="closeBtn"
                type="button"
                class="sidebar__close"
                :aria-label="langStore.t('close')"
                @click="close"
              >
                <v-icon size="24">mdi-close</v-icon>
              </button>
            </div>

            <!-- Профиль -->
            <RouterLink
              class="profile"
              :to="isLoggedIn ? '/users/me' : '/login'"
            >
              <span class="profile__avatar">
                <img
                  v-if="isLoggedIn && langStore.user.avatar"
                  class="profile__photo"
                  :src="mediaUrl(langStore.user.avatar)"
                  alt=""
                />
                <v-icon v-else size="38">mdi-account</v-icon>
                <span v-if="pendingRequests" class="profile__dot"></span>
              </span>
              <span class="profile__info">
                <span class="profile__name">{{
                  isLoggedIn ? fullName : langStore.t("guest")
                }}</span>
                <span class="profile__link">
                  {{ isLoggedIn ? langStore.t("myProfile") : langStore.t("login") }}
                  <v-icon size="18">mdi-chevron-right</v-icon>
                </span>
              </span>
            </RouterLink>

            <!-- Навигация -->
            <nav class="nav">
              <template v-for="item in items" :key="item.key">
                <RouterLink
                  v-if="item.to"
                  class="nav__item"
                  :class="{ 'nav__item--active': item.active }"
                  :to="item.to"
                  :aria-current="item.active ? 'page' : undefined"
                >
                  <v-icon size="24" class="nav__icon">{{ item.icon }}</v-icon>
                  {{ item.label }}
                </RouterLink>
                <button v-else type="button" class="nav__item">
                  <v-icon size="24" class="nav__icon">{{ item.icon }}</v-icon>
                  {{ item.label }}
                </button>
              </template>
            </nav>

            <div class="sidebar__divider"></div>

            <!-- Язык -->
            <div class="lang-row">
              <span class="lang-row__label">
                <v-icon size="24" class="nav__icon">mdi-web</v-icon>
                {{ currentLangCode }}
              </span>
              <LangSwitcher variant="flags" />
            </div>

            <div class="sidebar__actions">
              <InstallAppButton />
              <button
                v-if="isLoggedIn"
                type="button"
                class="sidebar__logout"
                @click="logout"
              >
                <v-icon size="22">mdi-logout</v-icon>
                {{ langStore.t("logout") }}
              </button>
            </div>

            <!-- Иллюстрация. Заглушка — заменить на финальную картинку -->
            <div class="sidebar__art" aria-hidden="true">
              <svg viewBox="0 0 320 170" class="sidebar__art-svg">
                <defs>
                  <linearGradient id="sidebar-sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#ffffff" stop-opacity="0" />
                    <stop offset="0.55" stop-color="#e3f0fc" />
                    <stop offset="1" stop-color="#d4e8fa" />
                  </linearGradient>
                </defs>

                <rect width="320" height="170" fill="url(#sidebar-sky)" />

                <!-- Облака -->
                <g fill="#ffffff">
                  <ellipse cx="58" cy="62" rx="20" ry="8" />
                  <ellipse cx="70" cy="56" rx="12" ry="9" />
                  <ellipse cx="236" cy="40" rx="18" ry="7" />
                  <ellipse cx="246" cy="35" rx="10" ry="8" />
                  <ellipse cx="150" cy="74" rx="14" ry="5" opacity="0.8" />
                </g>

                <!-- Дальние горы -->
                <path
                  d="M0 112 C40 84 78 90 118 102 C158 80 210 72 258 94 C284 84 304 86 320 92 L320 140 L0 150 Z"
                  fill="#c9def3"
                />

                <!-- Холмы -->
                <path
                  d="M0 122 C45 100 95 104 140 116 C190 98 255 92 320 100 L320 112 C210 124 110 122 0 138 Z"
                  fill="#a5d48f"
                />

                <!-- Деревья -->
                <g>
                  <rect x="33" y="108" width="4" height="16" rx="2" fill="#8a6a4a" />
                  <ellipse cx="35" cy="100" rx="11" ry="15" fill="#5aad5c" />
                  <rect x="57" y="112" width="3" height="11" rx="1.5" fill="#8a6a4a" />
                  <ellipse cx="58.5" cy="106" rx="8" ry="11" fill="#6dbd63" />
                  <rect x="297" y="94" width="4" height="15" rx="2" fill="#8a6a4a" />
                  <ellipse cx="299" cy="86" rx="10" ry="14" fill="#5aad5c" />
                </g>

                <!-- Дорога -->
                <path
                  d="M0 138 C110 122 210 124 320 112 L320 146 C210 154 110 160 0 176 Z"
                  fill="#5d6b7c"
                />
                <path
                  d="M0 157 C110 141 210 139 320 129"
                  fill="none"
                  stroke="#ffffff"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-dasharray="10 9"
                  opacity="0.9"
                />
                <path
                  d="M0 176 C110 160 210 154 320 146 L320 170 L0 170 Z"
                  fill="#8cc777"
                />

                <!-- Машинка -->
                <image
                  href="/images/duckCar.png"
                  x="196"
                  y="52"
                  width="104"
                  height="88"
                />
              </svg>
            </div>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.sidebar {
  position: fixed;
  inset: 0;
  /* Выше нижнего мобильного меню (2000) */
  z-index: 2300;
  font-family: "Chakra Petch", "Exo 2", sans-serif;
}

.sidebar__scrim {
  position: absolute;
  inset: 0;
  background: rgba(14, 32, 64, 0.38);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}

.sidebar__panel {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: min(84vw, 340px);
  overflow-y: auto;
  overscroll-behavior: contain;
  background: #fff;
  border-radius: 0 28px 28px 0;
  box-shadow: 16px 0 48px rgba(14, 40, 84, 0.22);
}

.sidebar__content {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding-top: calc(env(safe-area-inset-top) + 16px);
}

.sidebar__content > :not(.sidebar__art) {
  margin-left: 18px;
  margin-right: 18px;
}

/* ---------- Верх ---------- */
.sidebar__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 22px;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  text-decoration: none;
}

.sidebar__logo {
  width: 38px;
  height: 38px;
}

.sidebar__title {
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
  color: rgb(0, 128, 255);
}

.sidebar__close {
  flex: none;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 1px solid #dbe7f4;
  border-radius: 50%;
  background: #eef4fb;
  color: #3d5a80;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;

  &:hover,
  &:focus-visible {
    background: #e1ecf8;
    color: #0b4fa8;
  }
}

/* ---------- Профиль ---------- */
.profile {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 4px;
  margin-bottom: 22px;
  border-radius: 20px;
  color: inherit;
  text-decoration: none;
}

.profile__avatar {
  position: relative;
  flex: none;
  width: 68px;
  height: 68px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(160deg, #e6f1fe, #d3e6fb);
  color: #2f86e6;
  box-shadow: 0 6px 16px rgba(30, 110, 200, 0.14);
}

.profile__photo {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.profile__dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: #ff6d00;
}

.profile__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.profile__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 18px;
  font-weight: 700;
  color: #0f1d33;
}

.profile__link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 15px;
  font-weight: 600;
  color: #1a73e8;
}

/* ---------- Навигация ---------- */
.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
  width: 100%;
  min-height: 54px;
  padding: 0 16px;
  border: none;
  border-radius: 16px;
  background: transparent;
  color: #1d2b3f;
  font: inherit;
  font-size: 17px;
  font-weight: 500;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;

  &:hover {
    background: #f3f7fb;
  }

  &:focus-visible {
    outline: 2px solid #1e88e5;
    outline-offset: -2px;
  }

  &--active,
  &--active:hover {
    background: #e8f1fd;
    color: #1a73e8;
    font-weight: 600;

    .nav__icon {
      color: #1a73e8;
    }

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 12px;
      bottom: 12px;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: #1a73e8;
    }
  }
}

.nav__icon {
  color: #3a4a5e;
}

.sidebar__divider {
  height: 1px;
  margin-top: 16px;
  margin-bottom: 16px;
  background: #e6edf5;
}

/* ---------- Язык ---------- */
.lang-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-left: 16px;
}

.lang-row__label {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #1d2b3f;
  white-space: nowrap;
}

/* ---------- Кнопки ---------- */
.sidebar__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

.sidebar__logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  height: 52px;
  border: 1px solid #d6e3f1;
  border-radius: 999px;
  background: #f7fafd;
  color: #1d2b3f;
  font: inherit;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    background: #eef4fb;
    border-color: #bdd3ec;
  }

  &:focus-visible {
    outline: 2px solid #1e88e5;
    outline-offset: 2px;
  }
}

/* ---------- Иллюстрация ---------- */
.sidebar__art {
  margin-top: auto;
  padding-top: 18px;
  /* Под полоской жестов iPhone продолжаем траву */
  padding-bottom: env(safe-area-inset-bottom);
  background: linear-gradient(
    to top,
    #8cc777 calc(env(safe-area-inset-bottom) + 1px),
    transparent 0
  );
}

.sidebar__art-svg {
  display: block;
  width: 100%;
  height: auto;
}

/* ---------- Анимация ---------- */
.sidebar-enter-active .sidebar__scrim,
.sidebar-leave-active .sidebar__scrim {
  transition: opacity 0.26s ease;
}

.sidebar-enter-from .sidebar__scrim,
.sidebar-leave-to .sidebar__scrim {
  opacity: 0;
}

.sidebar-enter-active .sidebar__panel {
  transition: transform 0.34s cubic-bezier(0.22, 1, 0.36, 1);
}

.sidebar-leave-active .sidebar__panel {
  transition: transform 0.26s cubic-bezier(0.4, 0, 1, 1);
}

.sidebar-enter-from .sidebar__panel,
.sidebar-leave-to .sidebar__panel {
  transform: translateX(-105%);
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-enter-active .sidebar__panel,
  .sidebar-leave-active .sidebar__panel {
    transition: opacity 0.2s ease;
  }

  .sidebar-enter-from .sidebar__panel,
  .sidebar-leave-to .sidebar__panel {
    transform: none;
    opacity: 0;
  }
}
</style>

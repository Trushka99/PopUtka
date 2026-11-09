<script setup lang="ts">
import { useRouter } from "vue-router";
import { useLangStore } from "@/stores/langStore";
import {
  useNotifications,
  type NotificationView,
} from "@/composables/useNotifications";

const props = withDefaults(
  defineProps<{
    /** menu — выпадающее окно в шапке, page — отдельная страница */
    variant?: "menu" | "page";
  }>(),
  { variant: "menu" },
);

const emit = defineEmits<{ (e: "navigate"): void }>();

const router = useRouter();
const langStore = useLangStore();
const t = (key: string) => langStore.t(key);
const { unreadItems, readItems, unreadCount, markRead, markAllRead } =
  useNotifications();

const open = (n: NotificationView) => {
  markRead(n.raw);
  if (n.link) {
    router.push(n.link);
    emit("navigate");
  }
};

// В выпадающем окне прочитанных показываем немного — остальное на странице
const MENU_READ_LIMIT = 6;
</script>

<template>
  <section class="notif" :class="`notif--${props.variant}`">
    <header class="notif__head">
      <span class="notif__cloud" aria-hidden="true"></span>
      <div class="notif__title">
        {{ t("notifications") }}
        <span v-if="unreadCount" class="notif__count">{{ unreadCount }}</span>
      </div>
      <button
        v-if="unreadCount"
        type="button"
        class="notif__read-all"
        @click="markAllRead"
      >
        <v-icon size="16">mdi-check-all</v-icon>
        {{ t("mark_all_read") }}
      </button>
    </header>

    <div class="notif__list">
      <div v-if="!unreadItems.length && !readItems.length" class="notif__empty">
        <span class="notif__empty-icon"><v-icon size="28">mdi-bell-sleep-outline</v-icon></span>
        <strong>{{ t("no_notif") }}</strong>
        <span>{{ t("no_notif_text") }}</span>
      </div>

      <template v-if="unreadItems.length">
        <div class="notif__group">{{ t("new_group") }}</div>
        <button
          v-for="n in unreadItems"
          :key="n.id"
          type="button"
          class="item item--unread"
          @click="open(n)"
        >
          <span class="item__icon" :class="`item__icon--${n.tone}`">
            <v-icon size="20">{{ n.icon }}</v-icon>
          </span>
          <span class="item__body">
            <span class="item__row">
              <span class="item__title">{{ n.title }}</span>
              <span class="item__time">{{ n.time }}</span>
            </span>
            <span v-if="n.text" class="item__text">{{ n.text }}</span>
          </span>
          <span class="item__dot" aria-hidden="true"></span>
        </button>
      </template>

      <template v-if="readItems.length">
        <div class="notif__group">{{ t("earlier_group") }}</div>
        <button
          v-for="n in props.variant === 'menu'
            ? readItems.slice(0, MENU_READ_LIMIT)
            : readItems"
          :key="n.id"
          type="button"
          class="item"
          @click="open(n)"
        >
          <span class="item__icon" :class="`item__icon--${n.tone}`">
            <v-icon size="20">{{ n.icon }}</v-icon>
          </span>
          <span class="item__body">
            <span class="item__row">
              <span class="item__title">{{ n.title }}</span>
              <span class="item__time">{{ n.time }}</span>
            </span>
            <span v-if="n.text" class="item__text">{{ n.text }}</span>
          </span>
        </button>
      </template>
    </div>

    <RouterLink
      v-if="props.variant === 'menu' && readItems.length > MENU_READ_LIMIT"
      to="/notifications"
      class="notif__footer"
      @click="emit('navigate')"
    >
      {{ t("all_notifications") }}
      <v-icon size="16">mdi-arrow-right</v-icon>
    </RouterLink>
  </section>
</template>

<style scoped lang="scss">
.notif {
  --ink: #0b3550;
  --ink-soft: #5a7085;

  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
  background: #fff;
  color: var(--ink);
}

.notif--menu {
  width: min(400px, calc(100vw - 24px));
  max-height: min(560px, calc(100dvh - 120px));
  box-shadow: 0 18px 40px rgba(15, 40, 80, 0.18);
}

.notif--page {
  box-shadow: 0 8px 26px rgba(15, 23, 42, 0.06);
}

/* --- Шапка --- */
.notif__head {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 16px 18px 14px;
  background:
    radial-gradient(
      220px 80px at 88% 0%,
      rgba(255, 255, 255, 0.85),
      transparent 70%
    ),
    linear-gradient(160deg, #8fd0f4 0%, #c6e8fb 55%, #eaf7ff 100%);
}

.notif__cloud {
  position: absolute;
  z-index: -1;
  top: 24px;
  right: 42%;
  width: 52px;
  height: 16px;
  border-radius: 16px;
  background: #fff;
  opacity: 0.65;

  &::before,
  &::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    background: inherit;
  }

  &::before {
    width: 24px;
    height: 24px;
    top: -12px;
    left: 7px;
  }

  &::after {
    width: 18px;
    height: 18px;
    top: -8px;
    left: 25px;
  }
}

.notif__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 19px;
  font-weight: 700;
}

.notif--page .notif__title {
  font-size: 24px;
}

.notif__count {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background: #ff6d00;
  color: #fff;
  font-family: "Roboto", sans-serif;
  font-size: 12px;
  font-weight: 700;
}

.notif__read-all {
  flex: none;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  color: #0b4fa8;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.9);
  }
}

/* --- Список --- */
.notif__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 8px 10px;
  scrollbar-width: thin;
  scrollbar-color: #c9dced transparent;
}

.notif__group {
  padding: 10px 10px 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #8a97a8;
}

.item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #f3f7fb;
  }

  &--unread {
    background: #f2f8fe;

    &:hover {
      background: #e8f2fc;
    }
  }
}

.item__icon {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: grid;
  place-items: center;

  &--wait {
    background: #fff3e0;
    color: #c56a00;
  }

  &--ok {
    background: #e7f6ee;
    color: #1f8a4c;
  }

  &--bad {
    background: #fdecea;
    color: #c0362c;
  }

  &--info {
    background: #e6f1fd;
    color: #1a6fd1;
  }

  &--muted {
    background: #eef1f5;
    color: #66758a;
  }
}

.item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.item__title {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;

  .item--unread & {
    font-weight: 700;
  }
}

.item__time {
  flex: none;
  font-size: 12px;
  color: #8a97a8;
}

.item__text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.45;
  color: var(--ink-soft);
}

.item__dot {
  position: absolute;
  top: 50%;
  right: 10px;
  width: 8px;
  height: 8px;
  margin-top: -4px;
  border-radius: 50%;
  background: #1e88e5;
}

.item--unread .item__body {
  padding-right: 14px;
}

/* --- Пусто --- */
.notif__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 32px 20px;
  text-align: center;
  color: var(--ink-soft);
  font-size: 13px;

  strong {
    color: var(--ink);
    font-size: 15px;
  }
}

.notif__empty-icon {
  width: 56px;
  height: 56px;
  margin-bottom: 4px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, #bfe6fb, #eaf7ff);
  color: #1a7cc9;
}

@media (max-width: 480px) {
  .notif--page .notif__title {
    font-size: 20px;
  }

  .notif__head {
    padding: 14px 14px 12px;
  }

  .notif__read-all {
    padding: 6px 10px;
    font-size: 12px;
  }
}

.notif__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px;
  border-top: 1px solid #eef2f7;
  color: #0b4fa8;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    background: #f6f9fc;
  }
}
</style>

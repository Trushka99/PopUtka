<script setup lang="ts">
import { computed } from "vue";
import { useLangStore } from "@/stores/langStore";
import { markAsRead } from "@/api";
type TNotif = {
  id: string;
  type: string;
  title: string;
  isRead: boolean;
  message: string;
  createdAt: string;
  relatedBookingId: string;
};

const langStore = useLangStore();

const unread = computed(() =>
  langStore.notifications.filter((n: TNotif) => !n.isRead),
);

const read = computed(() =>
  langStore.notifications.filter((n: TNotif) => n.isRead),
);

const getTypeIcon = (type: string) => {
  switch (type) {
    case "success":
      return "mdi-check-circle";
    case "error":
      return "mdi-alert-circle";
    case "info":
      return "mdi-information";
    default:
      return "mdi-bell-circle";
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "success":
      return "#4CAF50";
    case "error":
      return "#F44336";
    case "info":
      return "#2196F3";
    default:
      return "#9E9E9E";
  }
};

const markRead = (item: TNotif) => {
  item.isRead = true;
  markAsRead(item.id);
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
};
</script>

<template>
  <v-container fluid class="notifications-page">
    <v-card class="notifications-wrapper" elevation="0">
      <h2 class="page-title">Уведомления</h2>

      <!-- НОВЫЕ -->
      <div v-if="unread.length" class="section-header">
        <span style="color: white">Новые</span>
        <span class="count">{{ unread.length }}</span>
      </div>

      <transition-group name="notif" tag="div" class="list-group">
        <v-list-item
          v-for="n in unread"
          :key="n.id"
          class="notification-item unread"
        >
          <template #prepend>
            <div
              class="icon-wrapper"
              :style="{
                background: `linear-gradient(135deg, ${getTypeColor(n.type)}66, transparent)`,
              }"
            >
              <v-icon :color="getTypeColor(n.type)">
                {{ getTypeIcon(n.type) }}
              </v-icon>
            </div>
          </template>

          <div class="content">
            <div class="title">{{ n.title }}</div>
            <div class="message">{{ n.message }}</div>
            <div class="date">{{ formatDate(n.createdAt) }}</div>
          </div>

          <template #append>
            <v-btn
              icon="mdi-check"
              variant="text"
              density="compact"
              class="read-btn"
              @click.stop="markRead(n)"
            />
          </template>
        </v-list-item>
      </transition-group>

      <v-divider v-if="unread.length && read.length" class="divider" />

      <!-- ПРОЧИТАННЫЕ -->
      <div v-if="read.length" class="section-header muted">
        <span style="color: white">Прочитанные</span>
        <span class="count">{{ read.length }}</span>
      </div>

      <transition-group name="notif" tag="div" class="list-group">
        <v-list-item
          v-for="n in read"
          :key="n.id"
          class="notification-item read"
        >
          <template #prepend>
            <div class="icon-wrapper muted">
              <v-icon color="grey">
                {{ getTypeIcon(n.type) }}
              </v-icon>
            </div>
          </template>

          <div class="content">
            <div class="title">{{ n.title }}</div>
            <div class="message">{{ n.message }}</div>
            <div class="date">{{ formatDate(n.createdAt) }}</div>
          </div>
        </v-list-item>
      </transition-group>

      <!-- EMPTY -->
      <div v-if="!unread.length && !read.length" class="empty-state">
        <v-icon size="48">mdi-bell-off</v-icon>
        <p>Нет уведомлений</p>
      </div>
    </v-card>
  </v-container>
</template>

<style scoped>
.notifications-page {
  padding: 12px;
}

.notifications-wrapper {
  max-width: 520px;
  margin: 0 auto;
  background: transparent;
}

/* ---------- HEADER ---------- */

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 12px 0;
}

.section-header {
  position: sticky;
  top: 8px;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(15, 15, 15, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 10px;
  padding: 6px 10px;
  margin: 16px 0 8px;
}

.section-header.muted {
  opacity: 0.4;
}

.section-header .count {
  background: #2a2a2a;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 10px;
}

/* ---------- LIST ---------- */

.list-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  position: relative;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.04),
    rgba(255, 255, 255, 0.02)
  );
  backdrop-filter: blur(6px);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.notification-item.unread {
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.35),
    inset 0 0 0 1px rgba(76, 175, 80, 0.35);
}

.notification-item.unread::after {
  content: "";
  position: absolute;
  top: 14px;
  right: 14px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4caf50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.8);
}

.notification-item.read {
  opacity: 0.45;
  filter: saturate(0.7);
}

@media (hover: hover) {
  .notification-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
  }
}

.notification-item:active {
  transform: scale(0.985);
}

/* ---------- CONTENT ---------- */

.icon-wrapper {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-wrapper.muted {
  background: rgba(255, 255, 255, 0.05);
}

.content {
  flex: 1;
}

.title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 2px;
}

.message {
  font-size: 13px;
  opacity: 0.85;
}

.date {
  font-size: 11px;
  opacity: 0.5;
  margin-top: 6px;
}

.read-btn {
  opacity: 0.6;
}

/* ---------- EMPTY ---------- */

.empty-state {
  text-align: center;
  padding: 40px 0;
  opacity: 0.6;
}

/* ---------- ANIMATION ---------- */

.notif-enter-active,
.notif-leave-active {
  transition: all 0.25s ease;
}

.notif-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.notif-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

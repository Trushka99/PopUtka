<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Chat from "@/components/Chat.vue";
import { getChats } from "@/api";
import { useLangStore } from "@/stores/langStore";
import {
  cityName,
  initialsOf,
  localeOf,
  mediaUrl,
  shortDate,
  timeOf,
} from "@/utils/tripFormat";

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

interface Message {
  id?: string;
  chatId?: string | number;
  senderId: string;
  text: string;
  createdAt?: string;
}

interface ChatType {
  id: string;
  user1: User;
  user2: User;
  messages: Message[];
}

const router = useRouter();
const route = useRoute();
const langStore = useLangStore();
const t = (key: string) => langStore.t(key);

const chats = ref<ChatType[]>([]);
const loading = ref(true);
const search = ref("");

onMounted(async () => {
  try {
    const res = await getChats();
    chats.value = res.data.data.chats ?? [];
  } catch (err) {
    console.error("Не удалось загрузить чаты", err);
  } finally {
    loading.value = false;
  }
});

const partnerOf = (chat: ChatType) =>
  chat.user1?.id === langStore.user.id ? chat.user2 : chat.user1;

const lastMessageOf = (chat: ChatType) => {
  let last: Message | undefined;
  for (const m of chat.messages ?? []) {
    if (!last || new Date(m.createdAt ?? 0) >= new Date(last.createdAt ?? 0)) {
      last = m;
    }
  }
  return last;
};

const listTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return timeOf(d);
  if (d.toDateString() === yesterday.toDateString()) return t("yesterday");
  return d.toLocaleDateString(localeOf(langStore.currentLang), {
    day: "numeric",
    month: "short",
  });
};

// Чаты с последним сообщением — сверху
const list = computed(() => {
  const q = search.value.trim().toLowerCase();
  return chats.value
    .map((chat) => {
      const partner = partnerOf(chat);
      const last = lastMessageOf(chat);
      return {
        chat,
        partner,
        name: `${partner?.firstName ?? ""} ${partner?.lastName ?? ""}`.trim(),
        last,
        lastMine: last?.senderId === langStore.user.id,
        time: listTime(last?.createdAt),
        sortKey: new Date(last?.createdAt ?? 0).getTime(),
      };
    })
    .filter((item) => !q || item.name.toLowerCase().includes(q))
    .sort((a, b) => b.sortKey - a.sortKey);
});

const activeChat = computed(
  () => chats.value.find((c) => String(c.id) === String(route.params.id)) ?? null,
);
const activePartner = computed(() =>
  activeChat.value ? partnerOf(activeChat.value) : null,
);

// «Ташкент → Самарканд, 13 ноября», если с этим человеком есть общая поездка
const sharedTripLabel = (partnerId?: string) => {
  if (!partnerId) return "";
  const user = langStore.user;
  const label = (trip: any) =>
    `${cityName(trip.from, (k) => langStore.с(k))} → ${cityName(trip.to, (k) => langStore.с(k))}, ${shortDate(trip.departureAt, langStore.currentLang)}`;

  for (const trip of user.activeTrips ?? []) {
    const withPassenger = trip.bookings?.some(
      (b: any) => (b.passenger?.id ?? b.passengerId) === partnerId,
    );
    if (withPassenger || trip.driver?.id === partnerId) return label(trip);
  }
  for (const b of user.myBookings ?? []) {
    const active =
      !["rejected", "cancelled"].includes(b.status) &&
      !["completed", "cancelled"].includes(b.trip?.status);
    if (active && b.trip?.driverId === partnerId) return label(b.trip);
  }
  return "";
};

const openChat = (chat: ChatType) => router.push(`/chats/${chat.id}`);

// Своё новое сообщение сразу показываем в списке слева
const onSent = (msg: Message) => {
  activeChat.value?.messages.push(msg);
};
</script>

<template>
  <div class="chats" :class="{ 'chats--open': !!activeChat }">
    <!-- ===== Список ===== -->
    <aside class="chats__list">
      <div class="chats__head">
        <h1 class="chats__title">{{ t("chats_title") }}</h1>
        <label class="chats__search">
          <v-icon size="18">mdi-magnify</v-icon>
          <input
            v-model="search"
            type="search"
            :placeholder="t('search')"
            :aria-label="t('search')"
          />
        </label>
      </div>

      <div class="chats__items">
        <div v-if="loading" class="chats__state">
          <v-progress-circular indeterminate size="28" width="3" color="#1e88e5" />
        </div>

        <div v-else-if="!chats.length" class="chats__state">
          <span class="chats__state-icon"><v-icon size="26">mdi-message-text-outline</v-icon></span>
          <strong>{{ t("no_chats_title") }}</strong>
          <span>{{ t("no_chats_text") }}</span>
        </div>

        <div v-else-if="!list.length" class="chats__state">
          {{ t("noResults") }}
        </div>

        <template v-else>
        <button
          v-for="item in list"
          :key="item.chat.id"
          type="button"
          class="chat-item"
          :class="{ 'chat-item--active': activeChat?.id === item.chat.id }"
          @click="openChat(item.chat)"
        >
          <v-avatar size="46" class="chat-item__avatar">
            <v-img
              v-if="item.partner?.avatar"
              :src="mediaUrl(item.partner.avatar)"
              cover
            />
            <span v-else>{{
              initialsOf(item.partner?.firstName, item.partner?.lastName)
            }}</span>
          </v-avatar>
          <span class="chat-item__body">
            <span class="chat-item__row">
              <span class="chat-item__name">{{ item.name }}</span>
              <span class="chat-item__time">{{ item.time }}</span>
            </span>
            <span class="chat-item__last">
              <template v-if="item.last">
                <span v-if="item.lastMine" class="chat-item__you"
                  >{{ t("you_prefix") }}
                </span>
                {{ item.last.text }}
              </template>
              <span v-else class="chat-item__muted">{{ t("chat_empty_short") }}</span>
            </span>
          </span>
        </button>
        </template>
      </div>
    </aside>

    <!-- ===== Переписка ===== -->
    <main class="chats__conversation">
      <Chat
        v-if="activeChat && activePartner"
        :key="activeChat.id"
        :chat-id="String(activeChat.id)"
        :partner-id="activePartner.id"
        :partner="activePartner"
        :subtitle="sharedTripLabel(activePartner.id)"
        variant="page"
        @close="router.push('/chats')"
        @sent="onSent"
      />
      <div v-else class="chats__placeholder">
        <span class="chats__state-icon chats__state-icon--big">
          <v-icon size="34">mdi-weather-cloudy</v-icon>
        </span>
        <strong>{{ t("select_chat") }}</strong>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.chats {
  --ink: #0b3550;
  --ink-soft: #5a7085;

  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 1240px;
  height: calc(100dvh - 10vh - 8px);
  min-height: 480px;
  margin: 0 auto;
  padding: 36px 20px 20px;
  box-sizing: border-box;
  color: var(--ink);
}

/* --- Список --- */
.chats__list,
.chats__conversation {
  min-height: 0;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 8px 26px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.chats__list {
  display: flex;
  flex-direction: column;
}

.chats__head {
  padding: 18px 18px 12px;
}

.chats__title {
  margin: 0 0 12px;
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 24px;
  font-weight: 700;
}

.chats__search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid #e3e9f1;
  border-radius: 999px;
  background: #f6f9fc;
  color: #8a97a8;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus-within {
    border-color: #64b5f6;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.15);
    background: #fff;
  }

  input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: var(--ink);
    font-size: 14px;
  }
}

.chats__items {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 10px 12px;
  scrollbar-width: thin;
  scrollbar-color: #c9dced transparent;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 10px;
  border: none;
  border-radius: 16px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #f3f7fb;
  }

  &--active,
  &--active:hover {
    background: #e8f1fd;
  }
}

.chat-item__avatar {
  flex: none;
  border: 2px solid #fff;
  background: #dbeafe;
  color: #0b4fa8;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 3px 8px rgba(30, 100, 160, 0.12);
}

.chat-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chat-item__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.chat-item__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 700;
}

.chat-item__time {
  flex: none;
  font-size: 12px;
  color: #8a97a8;
}

.chat-item__last {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--ink-soft);
}

.chat-item__you {
  color: #0b4fa8;
  font-weight: 600;
}

.chat-item__muted {
  color: #9aa6b5;
}

.chats__state {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  max-width: 260px;
  padding: 24px 12px;
  text-align: center;
  color: var(--ink-soft);
  font-size: 14px;

  strong {
    color: var(--ink);
    font-size: 16px;
  }
}

.chats__state-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, #bfe6fb, #eaf7ff);
  color: #1a7cc9;

  &--big {
    width: 76px;
    height: 76px;
  }
}

/* --- Переписка --- */
.chats__conversation {
  display: flex;
  flex-direction: column;
}

.chats__placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--ink);
  font-size: 16px;
  background:
    radial-gradient(
      320px 140px at 80% 0%,
      rgba(255, 255, 255, 0.9),
      transparent 70%
    ),
    linear-gradient(180deg, #e6f4fd 0%, #f6fbff 100%);
}

/* --- Телефон: список и переписка по очереди --- */
@media (max-width: 900px) {
  .chats {
    grid-template-columns: 1fr;
    height: calc(100dvh - 10vh - 60px);
    padding: 28px 12px 12px;
  }

  .chats__conversation {
    display: none;
  }

  .chats--open {
    padding: 20px 0 0;

    .chats__list {
      display: none;
    }

    .chats__conversation {
      display: flex;
      border-radius: 0;
      box-shadow: none;
    }
  }
}
</style>

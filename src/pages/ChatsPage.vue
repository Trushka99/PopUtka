<script setup lang="ts">
import { ref, onMounted } from "vue";
import Chat from "@/components/Chat.vue";
import { getChats } from "@/api";
import { useLangStore } from "@/stores/langStore";
import { useRouter, useRoute } from "vue-router";
import { computed, watch } from "vue";
const router = useRouter();
const route = useRoute();
const langStore = useLangStore();
interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
  sender: User;
}

interface ChatType {
  id: string;
  user1: User;
  user2: User;
  messages: Message[];
}

const chats = ref<ChatType[]>([]);
const activePassengerId = ref<string | null>(null);

onMounted(async () => {
  const res = await getChats();
  chats.value = res.data.data.chats;
});

const getChatPartner = (chat: ChatType) => {
  return chat.user1.id === langStore.user.id ? chat.user2 : chat.user1;
};
const sortMessages = (messages: Message[]) => {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
};
const getLastMessage = (chat: ChatType) => {
  if (!chat.messages.length) return "";

  const sorted = sortMessages(chat.messages);
  return sorted[sorted.length - 1].text;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const openChat = (chat: ChatType) => {
  router.push(`/chats/${chat.id}`);
};
watch(
  [() => route.params.id, chats],
  ([id]) => {
    if (!id) {
      activePassengerId.value = null;
      return;
    }

    const chat = chats.value.find((c) => c.id === id);
    if (chat) {
      activePassengerId.value = getChatPartner(chat).id;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="chat-page-mobile">
    <div v-if="!activePassengerId" class="chat-list-panel">
      <div class="chat-list">
        <div
          v-for="chat in chats"
          :key="chat.id"
          class="chat-item"
          @click="openChat(chat)"
        >
          <v-avatar size="40" class="mr-3" v-if="getChatPartner(chat).avatar">
            <img
              :src="`https://api.pop-utka.uz${getChatPartner(chat).avatar}`"
              alt="Driver"
              class="avatar"
            />
          </v-avatar>

          <div v-else class="avatar-placeholder">
            {{ getChatPartner(chat).firstName[0] }}
          </div>
          <div class="chat-info">
            <div class="chat-name">
              {{ getChatPartner(chat).firstName }}
              {{ getChatPartner(chat).lastName }}
            </div>
            <div class="chat-last-message">{{ getLastMessage(chat) }}</div>
          </div>
          <div class="chat-time">
            {{
              chat.messages.length
                ? formatDate(chat.messages[chat.messages.length - 1].createdAt)
                : ""
            }}
          </div>
        </div>
      </div>
    </div>

    <div v-else class="chat-panel">
      <Chat :passengerId="activePassengerId" @close="router.push('/chats')" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-page-mobile {
  padding-top: 20px;
  height: 92dvh;
  background:
    radial-gradient(circle at top, rgba(255, 179, 71, 0.18), transparent 35%),
    linear-gradient(180deg, #fdfbfb 0%, #f5f7fa 100%);

  display: flex;
  flex-direction: column;
  overflow: hidden;

  .chat-list-panel {
    flex: 1;
    overflow-y: auto;
    padding: 16px;

    &::-webkit-scrollbar {
      width: 0;
    }
  }

  .chat-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .chat-item {
    position: relative;

    display: flex;
    align-items: center;
    gap: 14px;

    padding: 14px;

    border-radius: 24px;

    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(16px);

    border: 1px solid rgba(255, 255, 255, 0.45);

    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.06),
      0 2px 8px rgba(255, 255, 255, 0.4) inset;

    transition:
      transform 0.2s ease,
      box-shadow 0.25s ease,
      background 0.25s ease;

    cursor: pointer;

    &:active {
      transform: scale(0.985);
    }

    &:hover {
      background: rgba(255, 255, 255, 0.82);

      box-shadow:
        0 12px 30px rgba(255, 122, 0, 0.08),
        0 2px 10px rgba(255, 255, 255, 0.5) inset;
    }

    .avatar,
    .avatar-placeholder {
      width: 54px;
      height: 54px;
      min-width: 54px;

      border-radius: 50%;

      overflow: hidden;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 20px;
      font-weight: 700;

      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    .avatar {
      object-fit: cover;
    }

    .avatar-placeholder {
      background: linear-gradient(135deg, #ff7a00, #ffb347);
      color: white;
    }

    .chat-info {
      flex: 1;
      min-width: 0;

      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .chat-name {
      font-size: 15px;
      font-weight: 700;
      color: #1f1f1f;

      display: flex;
      align-items: center;
      gap: 6px;
    }

    .chat-last-message {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.55);

      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      max-width: 220px;
    }

    .chat-time {
      position: absolute;
      top: 14px;
      right: 14px;

      font-size: 11px;
      font-weight: 600;

      color: rgba(0, 0, 0, 0.4);
    }
  }

  .chat-panel {
    flex: 1;
    overflow: hidden;

    background:
      radial-gradient(
        circle at top right,
        rgba(255, 179, 71, 0.12),
        transparent 35%
      ),
      #f8fafc;

    border-top-left-radius: 24px;
    border-top-right-radius: 24px;


    box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.04);
  }
}
</style>

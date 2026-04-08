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
  chats.value = res.data.data;
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
  height: 90dvh;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  font-family: "Roboto", sans-serif;

  .chat-list-panel {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    background: #f8f8f8;

    h2 {
      text-align: center;
      margin-bottom: 15px;
    }

    .chat-list {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .chat-item {
        display: flex;
        align-items: center;
        padding: 10px;
        border-radius: 12px;
        background: #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: #e0f3ff;
        }

        .avatar {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;

          .avatar-img {
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
          }

          .avatar-placeholder {
            width: 100%;
            height: 100%;
            background: #aaa;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 20px;
          }
        }

        .chat-info {
          flex: 1;

          .chat-name {
            font-weight: 600;
          }

          .chat-last-message {
            font-size: 14px;
            color: #555;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .chat-time {
          font-size: 12px;
          color: #999;
          margin-left: 10px;
        }
      }
    }
  }

  .chat-panel {
    flex: 1;
    position: relative;
    background: #f0f5f9;
    display: flex;
    flex-direction: column;
    margin-top: 5px;

    .back-btn {
      padding: 10px;
      background: #00aeef;
      color: white;
      border: none;
      font-size: 16px;
      cursor: pointer;
    }
  }
}
</style>

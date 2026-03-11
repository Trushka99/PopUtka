<!-- src/components/Chat.vue -->
<template>
  <div class="chat-wrapper">
    <div class="chat-header">
      <span>Чат</span>
      <button class="close" @click="$emit('close')">✕</button>
    </div>

    <div ref="messagesRef" class="messages">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="message"
        :class="{ mine: msg.senderId === langStore.user.id }"
      >
        <div class="bubble">
          <span class="text">{{ msg.text }}</span>
        </div>
      </div>
    </div>

    <div class="input">
      <input
        v-model="text"
        placeholder="Введите сообщение…"
        @keyup.enter="send"
      />
      <button @click="send">➤</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useLangStore } from "@/stores/langStore";
import { io } from "socket.io-client";
import { createChat, getChatByID } from "@/api";
const emit = defineEmits<{
  (e: "close"): void;
}>();
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    emit("close");
  }
};

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));

const langStore = useLangStore();
const socket = io("http://localhost:5000", { withCredentials: true });

interface Message {
  text: string;
  senderId: string;
}

const chatId = ref<number | null>(null);
const messages = ref<Message[]>([]);
const text = ref("");
const messagesRef = ref<HTMLElement | null>(null);

const scrollToBottom = async () => {
  await nextTick();
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
};

const send = () => {
  if (!text.value.trim() || !chatId.value) return;

  const msg = {
    text: text.value,
    senderId: langStore.user.id,
  };

  socket.emit("send-message", {
    chatId: String(chatId.value),
    text: text.value,
  });

  messages.value.push(msg);
  text.value = "";
  scrollToBottom();
};
const props = defineProps<{
  passengerId: string;
}>();
onMounted(async () => {
  const res = await createChat(props.passengerId);

  chatId.value = res.data.data.id;
  const chat = await getChatByID(String(chatId.value));
  messages.value = chat.data.data.messages;
  socket.emit("join-chat", String(chatId.value));

  socket.on("new-message", (msg: Message) => {
    if (msg.senderId !== langStore.user.id) {
      console.log(msg);
      messages.value.push(msg);
    }
  });
});

onBeforeUnmount(() => {
  socket.off("new-message");
});
</script>

<style scoped>
.chat-wrapper {
  bottom: 20px;
  right: 20px;
  width: 100%;
  height: 480px;
  background: white;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.chat-header {
  padding: 14px;
  background: #00aeef;
  color: white;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close {
  background: transparent;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
}

.messages {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  background: #f7f7f7;
}

.message {
  display: flex;
  margin-bottom: 8px;
}

.message.mine {
  justify-content: flex-end;
}

.bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 16px;
  background: #e0e0e0;
}

.message.mine .bubble {
  background: #00aeef;
  color: white;
  border-bottom-right-radius: 4px;
}

.input {
  display: flex;
  padding: 10px;
  gap: 8px;
  border-top: 1px solid #eee;
}

input {
  flex: 1;
  border-radius: 12px;
  border: 1px solid #ccc;
  padding: 8px 12px;
  outline: none;
}

button {
  background: #00aeef;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0 14px;
  cursor: pointer;
}
</style>

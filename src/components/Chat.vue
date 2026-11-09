<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { RouterLink } from "vue-router";
import { useLangStore } from "@/stores/langStore";
import { socket } from "@/socket";
import { getChatByID, openChatWith } from "@/api";
import { initialsOf, mediaUrl, shortDate, timeOf } from "@/utils/tripFormat";

interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

interface Message {
  id?: string;
  chatId?: string | number;
  text: string;
  senderId: string;
  createdAt?: string;
}

const props = withDefaults(
  defineProps<{
    /** С кем переписка */
    partnerId: string;
    /** Если чат уже известен (страница чатов) — не создаём его заново */
    chatId?: string | null;
    /** Имя и аватар собеседника, если уже есть под рукой */
    partner?: ChatUser | null;
    /** Строка под именем, например маршрут общей поездки */
    subtitle?: string;
    /** page — на всю колонку страницы чатов, embedded — блок на странице брони */
    variant?: "page" | "embedded";
  }>(),
  { chatId: null, partner: null, subtitle: "", variant: "page" },
);

const emit = defineEmits<{
  (e: "close"): void;
  (e: "sent", msg: Message): void;
}>();

const langStore = useLangStore();
const t = (key: string) => langStore.t(key);
const me = computed(() => langStore.user.id);

const currentChatId = ref<string | null>(null);
const messages = ref<Message[]>([]);
const loadedPartner = ref<ChatUser | null>(null);
const loading = ref(true);
const failed = ref(false);
const text = ref("");
const listEl = ref<HTMLElement | null>(null);

const partnerInfo = computed(() => props.partner ?? loadedPartner.value);
const partnerName = computed(() =>
  partnerInfo.value
    ? `${partnerInfo.value.firstName} ${partnerInfo.value.lastName ?? ""}`.trim()
    : "",
);

const byTime = (a: Message, b: Message) =>
  new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();

const scrollToBottom = async (smooth = true) => {
  await nextTick();
  const el = listEl.value;
  if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
};

// ---------- Загрузка и сокет ----------
const joinRoom = () => {
  if (currentChatId.value) socket.emit("join-chat", currentChatId.value);
};

async function load() {
  loading.value = true;
  failed.value = false;
  messages.value = [];
  try {
    const id = props.chatId
      ? String(props.chatId)
      : await openChatWith(props.partnerId);
    currentChatId.value = id;

    const res = await getChatByID(id);
    const chat = res.data.data.chat;
    messages.value = [...(chat.messages ?? [])].sort(byTime);
    loadedPartner.value =
      chat.user1?.id === me.value ? chat.user2 : chat.user1;

    joinRoom();
  } catch (err) {
    console.error("Не удалось открыть чат", err);
    failed.value = true;
  } finally {
    loading.value = false;
  }
  // Прокручиваем, когда сообщения уже отрисованы вместо спиннера
  if (!failed.value) scrollToBottom(false);
}

const onNewMessage = (msg: Message) => {
  if (String(msg.chatId) !== currentChatId.value) return;
  // Свои сообщения уже добавлены при отправке
  if (msg.senderId === me.value) return;
  messages.value.push(msg);
  scrollToBottom();
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && props.variant === "page") emit("close");
};

onMounted(() => {
  if (!socket.connected) socket.connect();
  socket.on("connect", joinRoom); // после переподключения комнату надо зайти заново
  socket.on("new-message", onNewMessage);
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  socket.off("connect", joinRoom);
  socket.off("new-message", onNewMessage);
  window.removeEventListener("keydown", onKeydown);
});

watch(() => [props.partnerId, props.chatId], load, { immediate: true });

// ---------- Отправка ----------
function send() {
  const value = text.value.trim();
  if (!value || !currentChatId.value) return;

  socket.emit("send-message", { chatId: currentChatId.value, text: value });

  const msg: Message = {
    chatId: currentChatId.value,
    text: value,
    senderId: me.value,
    createdAt: new Date().toISOString(),
  };
  messages.value.push(msg);
  emit("sent", msg);
  text.value = "";
  scrollToBottom();
}

// ---------- Лента: разделители дней и группы сообщений ----------
const dayLabel = (d: Date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return t("today");
  if (d.toDateString() === yesterday.toDateString()) return t("yesterday");
  return shortDate(d, langStore.currentLang);
};

type Item =
  | { kind: "day"; key: string; label: string }
  | {
      kind: "msg";
      key: string;
      text: string;
      mine: boolean;
      time: string;
      tail: boolean;
    };

const items = computed<Item[]>(() => {
  const out: Item[] = [];
  let lastDay = "";
  messages.value.forEach((m, i) => {
    const d = m.createdAt ? new Date(m.createdAt) : new Date();
    const day = d.toDateString();
    if (day !== lastDay) {
      out.push({ kind: "day", key: `day-${day}`, label: dayLabel(d) });
      lastDay = day;
    }
    const next = messages.value[i + 1];
    const nextDay = next?.createdAt
      ? new Date(next.createdAt).toDateString()
      : day;
    out.push({
      kind: "msg",
      key: m.id ? String(m.id) : `m-${i}`,
      text: m.text,
      mine: m.senderId === me.value,
      time: timeOf(d),
      // «Хвостик» у последнего сообщения в серии от одного человека
      tail: !next || next.senderId !== m.senderId || nextDay !== day,
    });
  });
  return out;
});
</script>

<template>
  <section class="chat" :class="`chat--${variant}`">
    <header class="chat__head">
      <span class="chat__cloud" aria-hidden="true"></span>

      <button
        v-if="variant === 'page'"
        type="button"
        class="chat__icon-btn chat__back"
        :aria-label="t('return')"
        @click="emit('close')"
      >
        <v-icon size="22">mdi-arrow-left</v-icon>
      </button>

      <v-avatar size="40" class="chat__avatar">
        <v-img
          v-if="partnerInfo?.avatar"
          :src="mediaUrl(partnerInfo.avatar)"
          cover
        />
        <span v-else>{{
          initialsOf(partnerInfo?.firstName, partnerInfo?.lastName)
        }}</span>
      </v-avatar>

      <div class="chat__who">
        <div class="chat__name">{{ partnerName || "…" }}</div>
        <div v-if="subtitle" class="chat__sub">
          <v-icon size="13">mdi-map-marker-path</v-icon>
          {{ subtitle }}
        </div>
      </div>

      <RouterLink
        v-if="variant === 'page'"
        class="chat__pill"
        :to="{ name: 'user', params: { id: partnerId } }"
      >
        {{ t("profile") }}
      </RouterLink>
      <RouterLink
        v-else-if="currentChatId"
        class="chat__icon-btn"
        :to="`/chats/${currentChatId}`"
        :title="t('open_in_chats')"
        :aria-label="t('open_in_chats')"
      >
        <v-icon size="20">mdi-arrow-expand</v-icon>
      </RouterLink>
    </header>

    <div ref="listEl" class="chat__messages">
      <div v-if="loading" class="chat__state">
        <v-progress-circular indeterminate size="28" width="3" color="#1e88e5" />
      </div>

      <div v-else-if="failed" class="chat__state">
        <span class="chat__state-icon"><v-icon size="26">mdi-cloud-off-outline</v-icon></span>
        {{ t("chat_server_error") }}
        <button type="button" class="chat__retry" @click="load">
          {{ t("retry") }}
        </button>
      </div>

      <div v-else-if="!messages.length" class="chat__state">
        <span class="chat__state-icon"><v-icon size="26">mdi-message-text-outline</v-icon></span>
        {{ t("chat_empty") }}
      </div>

      <template v-else>
        <template v-for="item in items" :key="item.key">
          <div v-if="item.kind === 'day'" class="chat__day">
            <span>{{ item.label }}</span>
          </div>
          <div
            v-else
            class="msg"
            :class="{ 'msg--mine': item.mine, 'msg--tail': item.tail }"
          >
            <!-- prettier-ignore -->
            <div class="msg__bubble"><span class="msg__text">{{ item.text }}</span><span class="msg__time">{{ item.time }}</span></div>
          </div>
        </template>
      </template>
    </div>

    <form class="chat__input" @submit.prevent="send">
      <input
        v-model="text"
        type="text"
        maxlength="2000"
        autocomplete="off"
        :placeholder="t('chat_placeholder')"
        :aria-label="t('chat_placeholder')"
        :disabled="loading || failed"
      />
      <button
        type="submit"
        class="chat__send"
        :class="{ 'chat__send--ready': text.trim() }"
        :aria-label="t('sendMessage')"
      >
        <v-icon size="20">mdi-send</v-icon>
      </button>
    </form>
  </section>
</template>

<style scoped lang="scss">
.chat {
  --ink: #0b3550;
  --ink-soft: #5a7085;

  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  border-radius: 20px;
  background: #fff;
  color: var(--ink);
}

.chat--embedded {
  height: 440px;
  border: 1px solid #e3e9f1;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
}

/* --- Шапка --- */
.chat__head {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background:
    radial-gradient(
      220px 80px at 88% 0%,
      rgba(255, 255, 255, 0.85),
      transparent 70%
    ),
    linear-gradient(160deg, #8fd0f4 0%, #c6e8fb 55%, #eaf7ff 100%);
}

.chat--embedded .chat__head {
  padding: 10px 14px;
}

.chat__cloud {
  position: absolute;
  z-index: -1;
  top: 22px;
  right: 34%;
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

.chat__avatar {
  flex: none;
  border: 2px solid #fff;
  background: #dbeafe;
  color: #0b4fa8;
  font-size: 13px;
  font-weight: 700;
}

.chat__who {
  flex: 1;
  min-width: 0;
}

.chat__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 700;
}

.chat__sub {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #0b4fa8;
}

.chat__icon-btn {
  flex: none;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.55);
  color: #0b4fa8;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.85);
  }
}

.chat__back {
  display: none;
}

.chat__pill {
  flex: none;
  padding: 6px 14px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  color: #0b4fa8;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.9);
  }
}

/* --- Лента --- */
.chat__messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  background: linear-gradient(180deg, #f2f9ff 0%, #f8fbfe 100%);
  scrollbar-width: thin;
  scrollbar-color: #c9dced transparent;
}

.chat__state {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: 260px;
  text-align: center;
  color: var(--ink-soft);
  font-size: 14px;
}

.chat__state-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, #bfe6fb, #eaf7ff);
  color: #1a7cc9;
}

.chat__retry {
  border: none;
  background: none;
  color: #0b4fa8;
  font-weight: 600;
  cursor: pointer;
}

.chat__day {
  display: flex;
  justify-content: center;
  margin: 10px 0 8px;

  span {
    padding: 3px 12px;
    border-radius: 999px;
    background: #e3eef8;
    color: var(--ink-soft);
    font-size: 12px;
    font-weight: 600;
  }
}

.msg {
  display: flex;
  margin-bottom: 3px;

  &--tail {
    margin-bottom: 10px;
  }

  &--mine {
    justify-content: flex-end;
  }
}

.msg__bubble {
  max-width: min(78%, 520px);
  padding: 8px 12px 6px;
  border-radius: 18px;
  border: 1px solid #e3ecf5;
  background: #fff;
  color: #24425a;
  font-size: 14px;
  line-height: 1.45;
  word-break: break-word;
  white-space: pre-line;

  .msg--tail & {
    border-bottom-left-radius: 6px;
  }

  .msg--mine & {
    border-color: transparent;
    background: linear-gradient(135deg, #1e88e5, #42a5f5);
    color: #fff;
  }

  .msg--mine.msg--tail & {
    border-bottom-left-radius: 18px;
    border-bottom-right-radius: 6px;
  }
}

.msg__time {
  float: right;
  margin: 6px 0 -2px 10px;
  font-size: 11px;
  line-height: 1;
  opacity: 0.6;
}

/* --- Ввод --- */
.chat__input {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-top: 1px solid #eef2f7;
  background: #fff;

  input {
    flex: 1;
    min-width: 0;
    height: 42px;
    padding: 0 16px;
    border: 1px solid #d6e3f0;
    border-radius: 999px;
    outline: none;
    background: #f8fbfe;
    color: var(--ink);
    font-size: 14px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:focus {
      border-color: #64b5f6;
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.15);
      background: #fff;
    }
  }
}

.chat__send {
  flex: none;
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #d6e6f5;
  color: #fff;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.15s ease;

  &--ready {
    background: linear-gradient(135deg, #1e88e5, #42a5f5);
    box-shadow: 0 4px 12px rgba(30, 136, 229, 0.35);
  }

  &:active {
    transform: scale(0.94);
  }
}

@media (max-width: 900px) {
  .chat--page {
    border-radius: 0;

    .chat__back {
      display: grid;
    }

    .chat__pill {
      display: none;
    }
  }
}
</style>

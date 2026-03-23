<template>
  <v-bottom-sheet v-model="model" inset>
    <v-card class="pa-5 rounded-xl review-card">
      <!-- Заголовок -->
      <div class="text-h6 font-weight-bold mb-4 text-center">
        Как прошла поездка?
      </div>

      <!-- SELECT -->
      <v-menu v-model="menu" offset-y>
        <template #activator="{ props: menuProps }">
          <v-text-field
            v-bind="menuProps"
            readonly
            clearable
            @click:clear="clear"
            variant="outlined"
            class="mb-4 select-field"
            hide-details
          >
            <template #prepend-inner v-if="selectedPassenger">
              <v-avatar size="36">
                <v-img
                  :src="
                    selectedPassenger.avatar
                      ? `https://api.pop-utka.uz${selectedPassenger.avatar}`
                      : defaultAvatar
                  "
                />
              </v-avatar>
            </template>

            <template #default>
              <span v-if="selectedPassenger">
                {{ selectedPassenger.firstName }}
              </span>
              <span v-else class="text-grey"> Выберите пассажира </span>
            </template>
          </v-text-field>
        </template>

        <v-list class="rounded-lg">
          <v-list-item
            v-for="p in array"
            :key="p.id"
            @click="select(p)"
            class="list-item"
          >
            <template #prepend>
              <v-avatar size="32">
                <v-img
                  :src="
                    p.avatar
                      ? `https://api.pop-utka.uz${p.avatar}`
                      : defaultAvatar
                  "
                />
              </v-avatar>
            </template>

            <v-list-item-title>
              {{ p.firstName }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Рейтинг -->
      <div class="rating-box">
        <div class="rating-label">Оценка поездки</div>

        <v-rating
          class="big-rating"
          v-model="rating"
          length="5"
          color="amber"
          hover
        />

        <div class="rating-hint">
          {{ rating ? `${rating} из 5` : "Выберите оценку" }}
        </div>
      </div>

      <!-- Комментарий -->
      <v-textarea
        v-model="comment"
        label="Комментарий"
        auto-grow
        rows="2"
        variant="outlined"
        class="mb-5 textarea"
      />

      <!-- Кнопки -->
      <div class="d-flex justify-space-between">
        <v-btn variant="text" class="skip-btn" @click="close">
          Пропустить
        </v-btn>

        <v-btn
          color="primary"
          class="submit-btn"
          :disabled="!rating || !selectedPassenger"
          @click="submit"
        >
          Отправить
        </v-btn>
      </div>
    </v-card>
  </v-bottom-sheet>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { createReview } from "@/api";
const props = defineProps<{
  modelValue: boolean;
  trip: {
    tripId: string;
    role: string;
    passengers?: { id: string; firstName: string; avatar: string | null }[];
    withUser?: { id: string; firstName: string; avatar: string | null };
  };
}>();

const emit = defineEmits(["update:modelValue", "submit"]);
const array = computed(() => {
  if (props.trip.role === "passenger") {
    return props.trip.withUser ? [props.trip.withUser] : [];
  }
  return props.trip.passengers ?? [];
});
const defaultAvatar =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3VOMpLxYT-XE2QvIUw5HK-qF6TqBPczQdMQ&s";

// bottom sheet
const model = ref(props.modelValue);
watch(
  () => props.modelValue,
  (v) => (model.value = v),
);
watch(model, (v) => emit("update:modelValue", v));

const close = () => (model.value = false);

// select logic
const selectedPassenger = ref<{
  id: string;
  firstName: string;
  avatar: string | null;
} | null>(null);

const menu = ref(false);

const select = (p: any) => {
  selectedPassenger.value = p;
  menu.value = false;
};

const clear = () => {
  selectedPassenger.value = null;
};

// остальное
const rating = ref(0);
const comment = ref("");

const submit = async () => {
  if (!selectedPassenger.value) return;
  try {
    const res = await createReview(
      props.trip.tripId,
      selectedPassenger.value.id,
      rating.value,
      comment.value,
    );
    console.log(res);
  } catch {
    console.log("ERROR PIDORASINA");
  }

  rating.value = 0;
  comment.value = "";
  selectedPassenger.value = null;
  close();
};
</script>
<style lang="css">
.review-card {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}
.rating-box {
  background: rgba(255, 193, 7, 0.08); /* лёгкий amber */
  border-radius: 16px;
  padding: 16px;
  text-align: center;
  margin: 20px 0;
}

.rating-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.rating-hint {
  font-size: 13px;
  color: #999;
  margin-top: 6px;
}

.big-rating .v-icon {
  font-size: 42px;
  transition: transform 0.15s ease;
}

.big-rating .v-icon:hover {
  transform: scale(1.2);
}
/* select */
.select-field {
  border-radius: 14px;
}

/* список */
.list-item {
  transition: background 0.2s ease;
}
.list-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* рейтинг */
.big-rating .v-icon {
  font-size: 42px;
  transition: transform 0.15s ease;
}
.big-rating .v-icon:hover {
  transform: scale(1.2);
}

/* textarea */
.textarea .v-field {
  border-radius: 14px;
}

/* кнопки */
.submit-btn {
  border-radius: 12px;
  padding: 0 20px;
  font-weight: 500;
}

.skip-btn {
  opacity: 0.7;
}
.skip-btn:hover {
  opacity: 1;
}
</style>

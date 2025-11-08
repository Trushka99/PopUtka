<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useLangStore } from "@/stores/langStore";
import Loading from "@/components/Loading.vue";
import { getUser } from "@/api";
import { apiUploadAvatar } from "@/api";
const langStore = useLangStore();
const route = useRoute();

const loading = ref<boolean>(false);
const user = ref<any>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const uploadAvatar = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    const res = await apiUploadAvatar(file); 
    console.log(res.data);

    user.value.avatar = res.data.data.avatar;
  } catch (err) {
    console.error("Ошибка загрузки аватара:", err);
  }
};
onMounted(() => {
  loading.value = true;
  getUser(Number(langStore.user.id))
    .then((res) => {
      user.value = res.data.data;
      console.log(res.data.data);
    })
    .catch((err) => {
      console.error("API ERROR:", err);
    })
    .finally(() => (loading.value = false));
});

const age = computed(() => {
  if (!user.value?.birthDate) return "";
  const b = new Date(user.value.birthDate);
  if (isNaN(b.getTime())) return "";
  const diff = Date.now() - b.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

const categoryRatings = computed(() => {
  if (!user.value?.ratings)
    return [{ key: "Общий", value: user.value?.rating ?? 0 }];
  return Object.entries(user.value.ratings).map(([k, v]) => ({
    key: k,
    value: v,
  }));
});

function openFileDialog() {
  fileInput.value?.click();
}
</script>

<template>
  <Loading v-if="loading" />

  <div v-else-if="user" class="profile-page">
    <!-- MAIN CARD -->
    <div class="profile-card">
      <div class="left-col">
        <v-avatar
          class="profile-avatar"
          :image="
            user.avatar
              ? `http://localhost:5000${user.avatar}`
              : '/images/test-avatar.jpg'
          "
          @click="openFileDialog"
          size="120"
        />
        <input
          type="file"
          ref="fileInput"
          style="display: none"
          accept="image/*"
          @change="uploadAvatar"
        />
        <div class="basic-info">
          <h2 class="name">{{ user.firstName }} {{ user.lastName }}</h2>
          <p class="subtitle">
            <span v-if="age">Возраст: {{ age }} </span>
            <span v-if="user.city">• {{ user.city }}</span>
          </p>

          <div class="contacts">
            <p class="contact-row">
              <v-icon small>mdi-phone</v-icon> {{ user.phone ?? "—" }}
            </p>
            <p class="contact-row">
              <v-icon small>mdi-email</v-icon> {{ user.email ?? "—" }}
            </p>
          </div>

          <div class="action-row">
            <v-btn variant="tonal" color="info" class="action-btn"
              >Пожаловаться</v-btn
            >
            <v-btn class="action-btn" outlined>Написать</v-btn>
          </div>
        </div>
      </div>

      <div class="right-col">
        <div class="top-row">
          <div class="rating-block">
            <v-icon class="big-star">mdi-star-circle</v-icon>
            <div class="rating-text">
              <div class="rating-value">
                {{ (user.rating ?? 0).toFixed(1) }} / 5
              </div>
              <div class="rating-reviews">
                {{ user.reviews?.length ?? 0 }} отзыва
              </div>
            </div>
          </div>

          <div class="verified-block">
            <div class="verified-item" v-if="user.verifiedPassport">
              <v-icon small class="ok">mdi-check-circle-outline</v-icon>
              <span>Паспорт</span>
            </div>
            <div class="verified-item" v-if="user.verifiedEmail">
              <v-icon small class="ok">mdi-check-circle-outline</v-icon>
              <span>Email</span>
            </div>
            <div class="verified-item" v-if="user.verifiedPhone">
              <v-icon small class="ok">mdi-check-circle-outline</v-icon>
              <span>Телефон</span>
            </div>
          </div>
        </div>

        <v-divider class="divider" />

        <div class="ratings-by-category">
          <h4>Рейтинг по категориям</h4>
          <div class="chips">
            <v-chip
              v-for="(r, i) in categoryRatings"
              :key="i"
              class="rating-chip"
              variant="outlined"
              density="compact"
            >
              <strong>{{ r.key }}</strong> · {{ Number(r.value).toFixed(1) }}
            </v-chip>
          </div>
        </div>

        <v-divider class="divider" />

        <div class="about">
          <h4>О себе</h4>
          <p class="about-text">
            {{
              user.about && user.about !== ""
                ? user.about
                : "Описание отсутствует"
            }}
          </p>
        </div>

        <div class="meta-row">
          <div>
            Опубликовано и завершено:
            <strong>{{ user.completedTripsCount ?? 0 }}</strong>
          </div>
          <div>
            {{ langStore.t("regDate") }}:
            <strong>
              {{
                user.createdAt
                  ? new Date(user.createdAt).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"
              }}
            </strong>
          </div>
        </div>
      </div>
    </div>

    <!-- SECONDARY CARDS: CAR + TRIPS -->
    <div class="secondary-row">
      <div class="card car-card" v-if="user.car">
        <div class="card-title">
          <h4>Автомобиль</h4>
          <v-icon class="edit-icon">mdi-pencil</v-icon>
        </div>

        <div class="car-content">
          <img
            class="car-photo"
            :src="
              user.car.photo
                ? `http://localhost:5000${user.car.photo}`
                : '/images/test-car.jpg'
            "
            alt="car"
          />
          <div class="car-info">
            <p>
              <strong>{{ user.car.brand }} {{ user.car.model }}</strong>
            </p>
            <p>Гос. номер: {{ user.car.plate ?? "—" }}</p>
            <p>Год: {{ user.car.year ?? "—" }}</p>
            <p>
              Категория: {{ user.car.category ?? "—" }} • Мест:
              {{ user.car.seats ?? "-" }}
            </p>
          </div>
        </div>
      </div>

      <div class="card trips-card">
        <div class="card-title">
          <h4>История поездок</h4>
        </div>

        <div class="trips-list">
          <div
            v-if="user.trips?.length"
            class="trip"
            v-for="t in user.trips"
            :key="t.id"
          >
            <div class="trip-row">
              <div class="trip-fromto">
                <div class="from">{{ t.from }}</div>
                <v-icon small>mdi-arrow-right</v-icon>
                <div class="to">{{ t.to }}</div>
              </div>
              <div class="trip-meta">
                <div class="date">
                  {{
                    new Date(t.date).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  }}
                </div>
                <div class="status">{{ t.status }}</div>
              </div>
            </div>
          </div>

          <p v-else class="empty">Поездок нет</p>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="no-user">Пользователь не найден</div>
</template>

<style lang="scss" scoped>
.profile-page {
  width: 100%;
  max-width: 1100px;
  margin: 30px auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* MAIN CARD */
.profile-card {
  display: flex;
  gap: 24px;
  background: #fff;
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 6px 20px rgba(25, 54, 100, 0.06);
  align-items: flex-start;
}

.left-col {
  width: 280px;
  display: flex;
  gap: 18px;
  align-items: flex-start;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.profile-avatar {
  border: 4px solid rgb(26, 115, 232);
  box-shadow: 0 6px 18px rgba(26, 115, 232, 0.12);
}

.basic-info {
  width: 100%;
}

.name {
  margin: 8px 0 2px;
  font-size: 20px;
  font-weight: 700;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.contacts {
  margin-top: 12px;
  color: #374151;
  font-size: 14px;
}

.contact-row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin: 6px 0;
}

.action-row {
  margin-top: 14px;
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  text-transform: none;
}

/* right column */
.right-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rating-block {
  display: flex;
  gap: 12px;
  align-items: center;
}

.big-star {
  font-size: 48px;
  color: #1976d2;
}

.rating-text .rating-value {
  font-size: 20px;
  font-weight: 700;
}

.rating-reviews {
  color: #6b7280;
  font-size: 13px;
}

/* verified */
.verified-block {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.verified-item {
  display: flex;
  gap: 6px;
  align-items: center;
  color: #047857;
  font-size: 14px;
}

.ok {
  color: #047857;
}

/* divider */
.divider {
  margin: 6px 0 6px;
}

/* ratings chips */
.ratings-by-category h4 {
  margin: 0 0 8px;
}

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.rating-chip {
  font-size: 13px;
  background: transparent;
}

/* about text */
.about-text {
  color: #374151;
  line-height: 1.45;
  margin: 8px 0;
}

/* meta row */
.meta-row {
  display: flex;
  gap: 20px;
  color: #6b7280;
  font-size: 13px;
  margin-top: 6px;
}

/* secondary row */
.secondary-row {
  display: flex;
  gap: 20px;
  width: 100%;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
  flex: 1;
}

.car-card {
  max-width: 360px;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-icon {
  color: #6b7280;
  cursor: pointer;
}

.car-content {
  display: flex;
  gap: 14px;
  margin-top: 12px;
  align-items: center;
}

.car-photo {
  width: 130px;
  height: 86px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e6eefc;
}

.car-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #374151;
}

/* trips */
.trips-card {
  flex: 1;
}

.trips-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trip {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #eef2ff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.trip-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.trip-fromto {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 600;
  color: #111827;
}

.trip-meta {
  text-align: right;
  color: #6b7280;
  font-size: 13px;
}

.empty {
  color: #6b7280;
}

/* responsive */
@media (max-width: 900px) {
  .profile-card {
    flex-direction: column;
    align-items: stretch;
  }
  .left-col {
    width: 100%;
    flex-direction: row;
    text-align: left;
    justify-content: flex-start;
  }
  .basic-info {
    text-align: left;
  }
  .secondary-row {
    flex-direction: column;
  }
  .car-card {
    max-width: 100%;
  }
}
</style>

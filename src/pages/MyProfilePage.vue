<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useLangStore } from "@/stores/langStore";
import Loading from "@/components/Loading.vue";
import {
  getUser,
  apiUploadAvatar,
  getMyBookings,
  confirmBooking,
  rejectBooking,
  getTripHistory,
  updateCar,
  updateCarPhoto,
} from "@/api";
import HistoryTripCard from "@/components/HistoryTripCard.vue";

const langStore = useLangStore();
const loading = ref(true);
const user = ref<any>(null);
const bookings = ref<any>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const carModalOpen = ref(false);

const carForm = ref({
  model: "",
  color: "",
  year: "",
  licensePlate: "",
});

function openCarModal() {
  if (user.value?.car) {
    carForm.value = {
      model: user.value.car.model ?? "",
      color: user.value.car.color ?? "",
      year: user.value.car.year ?? "",
      licensePlate: user.value.car.licensePlate ?? "",
    };
  }
  carModalOpen.value = true;
}
const activeSection = ref<"main" | "trips" | "bookings" | "about">("main");

function openFileDialog() {
  fileInput.value?.click();
}
const carPhotoInput = ref<HTMLInputElement | null>(null);

function openCarPhotoDialog() {
  carPhotoInput.value?.click();
}

async function uploadCarPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    const res = updateCarPhoto(file);
    console.log(res);
  } catch (err) {
    alert("Не удалось загрузить фото автомобиля");
  }
}

async function uploadAvatar(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const res = await apiUploadAvatar(file);
    // adapt to your API shape
    user.value.avatar = res.data?.data?.avatar || user.value.avatar;
  } catch (err) {
    console.error("Ошибка загрузки аватара", err);
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    const res = await getUser(String(langStore.user.id));
    const trips = await getTripHistory();
    const bookingsRes = await getMyBookings();
    console.log(trips.data.data);
    console.log(res.data.data);
    user.value = res.data.data;
    bookings.value = bookingsRes.data.data;
  } catch (err) {
    console.warn("API failed, using fallback data", err);
  } finally {
    loading.value = false;
  }
});
async function saveCar() {
  try {
    const res = await updateCar("2kIO1ljvRF7Y", {
      model: carForm.value.model,
      color: carForm.value.color,
      year: carForm.value.year,
      licensePlate: carForm.value.licensePlate,
    });

    user.value.car = res.data.data.car;
    carModalOpen.value = false;
  } catch (e) {
    console.error("Ошибка сохранения авто", e);
    alert("Не удалось сохранить автомобиль");
  }
}

const age = computed(() => {
  if (!user.value?.birthDate) return "-";
  const b = new Date(user.value.birthDate);
  return Math.floor(
    (Date.now() - b.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
});

const categoryRatings = computed(() => {
  if (!user.value?.ratings)
    return [{ key: "Общий", value: user.value?.rating ?? 0 }];
  return Object.entries(user.value.ratings).map(([k, v]) => ({
    key: k,
    value: v,
  }));
});
</script>

<template>
  <Loading v-if="loading" />

  <div v-else class="profile-fullscreen">
    <div v-if="carModalOpen" class="modal-backdrop">
      <div class="modal">
        <h3>Автомобиль</h3>

        <div class="form">
          <input v-model="carForm.model" placeholder="Модель" />
          <input v-model="carForm.color" placeholder="Цвет" />
          <input v-model="carForm.year" type="number" placeholder="Год" />
          <input v-model="carForm.licensePlate" placeholder="Гос. номер" />
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary" @click="saveCar">Сохранить</button>
          <button class="btn btn-outline" @click="carModalOpen = false">
            Отмена
          </button>
        </div>
      </div>
    </div>
    <aside class="left-panel">
      <div class="card main-card">
        <div class="avatar-wrap" @click="openFileDialog">
          <img
            class="avatar"
            :src="
              user.avatar
                ? `https://web-production-68c29.up.railway.app${user.avatar}`
                : '/images/test-avatar.jpg'
            "
            alt="avatar"
          />
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="uploadAvatar"
            style="display: none"
          />
        </div>

        <div class="user-head">
          <div class="name">
            {{ user.firstName }} <span class="last">{{ user.lastName }}</span>
          </div>
          <div class="sub">{{ age }} лет · {{ user.city }}</div>

          <div class="rating">
            <div class="big-rating">{{ (user.rating ?? 0).toFixed(1) }}</div>
            <div class="rating-meta">
              <div class="stars">★★★★★</div>
              <div class="reviews">{{ user.reviews?.length ?? 0 }} отзывов</div>
            </div>
          </div>

          <div class="verifications">
            <span class="ver-item" :class="{ ok: user.verifiedPassport }"
              >Паспорт</span
            >
            <span class="ver-item" :class="{ ok: user.verifiedEmail }"
              >Email</span
            >
            <span class="ver-item" :class="{ ok: user.verifiedPhone }"
              >Телефон</span
            >
          </div>

          <div class="contacts">
            <div class="contact">
              <strong>Телефон:</strong> {{ user.phone ?? "—" }}
            </div>
            <div class="contact">
              <strong>Email:</strong> {{ user.email ?? "—" }}
            </div>
          </div>

          <div class="actions">
            <button class="btn btn-primary">Написать</button>
            <button class="btn btn-outline">Пожаловаться</button>
          </div>
        </div>
        <div v-if="user.car" class="car-block">
          <h3 class="small-title">Автомобиль</h3>
          <div class="car-info">
            <div class="car-title">
              {{ user.car.brand }} {{ user.car.model }}
            </div>
            <div class="car-meta">
              Год: {{ user.car.year }} · Цвет: {{ user.car.color }}
            </div>
            <div class="car-plate">
              Гос. номер: <strong>{{ user.car.licensePlate }}</strong>
            </div>
          </div>

          <button class="btn btn-outline btn-sm" @click="openCarModal">
            ✏️ Редактировать автомобиль
          </button>

          <div class="car-photo-section">
            <div class="car-photo-wrap" @click="openCarPhotoDialog">
              <img
                class="car-photo"
                :src="
                  user.car?.photo
                    ? `https://web-production-68c29.up.railway.app${user.car.photo}`
                    : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSe0NweKjJYqN3lSKJNkGM8X95kcP8BpjLJ-Q&s'
                "
                alt="car"
              />
              <div class="car-photo-overlay">
                <span>📷</span>
              </div>
            </div>
            <input
              ref="carPhotoInput"
              type="file"
              accept="image/*"
              hidden
              @change="uploadCarPhoto"
            />
          </div>
        </div>
      </div>
    </aside>

    <main class="right-panel">
      <nav class="section-nav">
        <button
          :class="{ active: activeSection === 'main' }"
          @click="activeSection = 'main'"
        >
          Профиль
        </button>
        <button
          :class="{ active: activeSection === 'trips' }"
          @click="activeSection = 'trips'"
        >
          История поездок
        </button>
        <button
          :class="{ active: activeSection === 'bookings' }"
          @click="activeSection = 'bookings'"
        >
          Бронирования
        </button>
        <button
          :class="{ active: activeSection === 'about' }"
          @click="activeSection = 'about'"
        >
          О себе
        </button>
      </nav>

      <section v-show="activeSection === 'main'" class="section-card">
        <h2>Краткая информация</h2>
        <div class="grid-2">
          <div class="info-card">
            <h4>Рейтинг</h4>
            <div class="big">{{ (user.rating ?? 0).toFixed(1) }} / 5</div>
            <div class="muted">
              {{ user.reviews?.length ?? 0 }} отзывов • Завершено:
              {{ user.completedTripsCount ?? 0 }}
            </div>
          </div>
          <div class="info-card">
            <h4>Контакты</h4>
            <div>{{ user.phone ?? "—" }}</div>
            <div>{{ user.email ?? "—" }}</div>
            <div class="muted">
              Регистрация:
              {{
                user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("ru-RU")
                  : "—"
              }}
            </div>
          </div>
        </div>
      </section>

      <section v-show="activeSection === 'trips'" class="section-card">
        <h2>История поездок</h2>
        <HistoryTripCard v-for="t in user.trips" :key="t.id" :trip="t" />
      </section>

      <section v-show="activeSection === 'bookings'" class="section-card">
        <h2>Текущие бронирования</h2>
        <div class="cards-list">
          <article class="booking-card" v-for="b in bookings" :key="b.id">
            <div class="row">
              <div class="place">
                <strong>{{
                  langStore.с(b.trip.from.cityKey.toLowerCase())
                }}</strong>
                →
                <strong>{{
                  langStore.с(b.trip.to.cityKey.toLowerCase())
                }}</strong>
              </div>
              <div class="status">
                {{
                  b.status === "pending"
                    ? "Ожидает подтверждения"
                    : "хуй поймет"
                }}
              </div>
            </div>
            <div class="meta">
              Выезд: {{ b.trip.departureDate }} · Пассажиры: {{ b.seats }} ·
              Цена: {{ b.trip.price }} UZS
            </div>
            <div class="booking-actions">
              <v-btn
                @click="
                  async () => {
                    const res = await confirmBooking(b.id);
                    console.log(res);
                  }
                "
                class="btn btn-small"
                >Подтвердить</v-btn
              >
              <v-btn
                @click="
                  async () => {
                    const res = await rejectBooking(b.id);
                    console.log(res);
                  }
                "
                class="btn btn-outline btn-small"
                >Отменить</v-btn
              >
              <RouterLink
                class="link"
                :to="{ name: 'bookings', params: { id: b.id } }"
                ><v-btn class="btn btn-outline btn-small"
                  >Подробнее</v-btn
                ></RouterLink
              >
            </div>
          </article>
        </div>
        <div v-if="!(user.bookings && user.bookings.length)" class="empty">
          Бронирований нет
        </div>
      </section>

      <section v-show="activeSection === 'about'" class="section-card">
        <h2>О себе</h2>
        <p class="about-text">{{ user.about || "Описание отсутствует" }}</p>
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.profile-fullscreen {
  display: grid;
  grid-template-columns: 20% 1fr;
  gap: 24px;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  margin-top: 15px;
}

.left-panel {
  max-height: 80vh;
  overflow: auto;
}

.right-panel {
  height: 80vh;
  display: flex;
  max-height: 80vh;
  flex-direction: column;
}

.card.main-card {
  background: #fff;
  padding: 22px;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.avatar-wrap {
  display: flex;
  justify-content: center;
}

.avatar {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 50%;
  border: 5px solid #1976d2;
  box-shadow: 0 10px 30px rgba(25, 118, 210, 0.12);
  cursor: pointer;
}

.user-head {
  text-align: center;
}

.name {
  font-size: 26px;
  font-weight: 700;
}

.sub {
  color: #6b7280;
  margin-top: 6px;
}

.rating {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 10px;
}

.big-rating {
  font-size: 34px;
  font-weight: 800;
  color: #f59e0b;
}

.rating-meta .reviews {
  color: #6b7280;
}

.verifications {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 10px;
}

.ver-item {
  padding: 6px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-weight: 600;
}

.ver-item.ok {
  background: #ecfdf5;
  color: #065f46;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.02);
}

.contacts {
  margin-top: 12px;
  color: #374151;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 14px;
}

.btn {
  padding: 8px 14px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background: #1976d2;
  color: white;
}
.btn-outline {
  background: transparent;
  border: 1px solid #e5e7eb;
}

.car-block {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px solid #eef2ff;
}
.small-title {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 8px;
}
.car-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.car-title {
  font-weight: 700;
  font-size: 16px;
}
.car-photo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.car-photo-wrap {
  position: relative;
  width: 220px;
  height: 140px;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
}

.car-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.car-photo-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.car-photo-wrap:hover .car-photo-overlay {
  opacity: 1;
}

.car-meta {
  color: #6b7280;
}
.car-plate {
  margin-top: 6px;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.form input {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  justify-content: flex-end;
}

/* RIGHT PANEL */
.section-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.section-nav button {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  font-weight: 600;
}

.section-nav button.active {
  background: #eef2ff;
  border-color: #c7e0ff;
}

.section-card {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  overflow: auto;
  flex: 1 1 auto;
}

.grid-2 {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.info-card {
  padding: 14px;
  border-radius: 10px;
  background: #f8fafc;
}
.info-card .big {
  font-size: 24px;
  font-weight: 800;
}
.muted {
  color: #6b7280;
  margin-top: 8px;
}

.chips {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.chip {
  padding: 8px 10px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eef2ff;
}

.table-wrap {
  margin-top: 10px;
}
.trips-table {
  width: 100%;
  border-collapse: collapse;
}
.trips-table th,
.trips-table td {
  padding: 12px 10px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
}

.cards-list {
  display: grid;
  gap: 12px;
  margin-top: 10px;
}
.booking-card {
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #eef2ff;
}
.booking-card .row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.booking-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.btn-small {
  padding: 6px 10px;
  font-size: 13px;
}

.about-text {
  line-height: 1.6;
  color: #374151;
}

.empty {
  color: #6b7280;
  margin-top: 10px;
}

/* Responsive: collapse to single column on small screens */
@media (max-width: 1100px) {
  .profile-fullscreen {
    grid-template-columns: 1fr;
    height: auto;
  }
  .left-panel {
    order: 1;
  }
  .right-panel {
    order: 2;
  }
}
@media (max-width: 768px) {
  .section-nav button {
    font-size: 14px;
  }
}
</style>

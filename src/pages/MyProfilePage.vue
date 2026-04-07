<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import type { Ref } from "vue";
import { useLangStore } from "@/stores/langStore";
import Loading from "@/components/Loading.vue";
import BookingCard from "@/components/BookingCard.vue";
import ReviewCard from "@/components/ReviewCard.vue";
import { useRouter } from "vue-router";
import {
  apiUploadAvatar,
  logout,
  updateCar,
  updateCarPhoto,
  updateProfile,
  getReviews,
  getUser,
} from "@/api";
import { useRoute } from "vue-router";
const openedSections = ref({
  my: true,
  pending: true,
  active: true,
  full: false,
});

function toggleSection(key: keyof typeof openedSections.value) {
  openedSections.value[key] = !openedSections.value[key];
}
import HistoryTripCard from "@/components/HistoryTripCard.vue";
const router = useRouter();
const editingPhone = ref<boolean>(false);
const editingEmail = ref<boolean>(false);
const editingDesc = ref<boolean>(false);
const route = useRoute();
const isMeRoute = computed(() => route.path === "/users/me");
function toggleEditingField(
  editing: Ref<boolean>,
  model: Ref<string>,
  original: string,
) {
  if (editing.value) {
    editing.value = false;
    model.value = original;
  } else {
    editing.value = true;
  }
}
const langStore = useLangStore();
const loading = ref(true);
const user = ref<any>(null);
const reviews = ref<any>(null);
const number = ref<string>(langStore.user.phone);
const email = ref<string>(langStore.user.email);
const desc = ref<string>(langStore.user.about);
const fileInput = ref<HTMLInputElement | null>(null);
const carModalOpen = ref(false);
const logOUT = () => {
  logout()
    .then(() => {
      langStore.setUser(null);
      router.push({
        path: "/",
      });
    })
    .catch((err) => console.error(err));
};
const carForm = ref({
  model: "",
  color: "",
  year: "",
  licensePlate: "",
});
const changeData = (body: any) => {
  updateProfile(body)
    .then((res) => console.log(res))
    .catch((err) => console.log(err));
};
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
const activeSection = ref<"main" | "trips" | "bookings" | "reviews">(
  isMeRoute.value ? "main" : "reviews",
);
function openFileDialog() {
  fileInput.value?.click();
}
const carPhotoInput = ref<HTMLInputElement | null>(null);

function openCarPhotoDialog() {
  carPhotoInput.value?.click();
}
const pendingTrips = computed(
  () =>
    user.value?.activeTrips?.filter((t: any) =>
      t.bookings?.some((b: any) => b.status === "pending"),
    ) || [],
);

const activeTrips = computed(
  () =>
    user.value?.activeTrips?.filter(
      (t: any) =>
        t.availableSeats > 0 &&
        !t.bookings?.some((b: any) => b.status === "pending"),
    ) || [],
);

const fullTrips = computed(
  () =>
    user.value?.activeTrips?.filter((t: any) => t.availableSeats === 0) || [],
);
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
    user.value.avatar = res.data?.data?.avatar || user.value.avatar;
  } catch (err) {
    console.error("Ошибка загрузки аватара", err);
  }
}

watch(
  () => route.fullPath,
  async (newPath, oldPath) => {
    loading.value = true;

    try {
      let userId: string;
      if (route.path === "/users/me") {
        userId = langStore.user.id;
        user.value = langStore.user;
      } else if (route.params.id) {
        userId = route.params.id as string;
        const data = await getUser(userId);
        user.value = data.data.data;
      } else {
        userId = langStore.user.id;
      }

      const apiRev = await getReviews(userId);
      const rev = apiRev.data || apiRev;
      reviews.value = rev.data?.reviews || rev.reviews || [];
    } catch (err) {
      console.warn("API failed, using fallback data", err);
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);
async function saveCar() {
  try {
    const res = await updateCar(langStore.user.id, {
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
function togglePhoneEditing() {
  toggleEditingField(editingPhone, number, langStore.user.phone);
}
function toggleEmailEditing() {
  toggleEditingField(editingEmail, email, langStore.user.email);
}
function toggleDescEditing() {
  toggleEditingField(editingDesc, desc, langStore.user.description);
}
const age = computed(() => {
  if (!user.value?.birthDate) return "-";
  const b = new Date(user.value.birthDate);
  return Math.floor(
    (Date.now() - b.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
  );
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
    <aside :class="isMeRoute ? 'left-panel' : ''">
      <div class="card main-card">
        <div class="avatar-wrap">
          <img
            class="avatar"
            @click="openFileDialog"
            :src="
              user.avatar
                ? `https://api.pop-utka.uz${user.avatar}`
                : 'https://img.freepik.com/premium-vector/character-avatar-isolated_729149-194801.jpg?semt=ais_incoming&w=740&q=80'
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
            <v-btn
              icon
              v-if="isMeRoute"
              variant="text"
              size="small"
              class="logout-btn"
              @click="logOUT"
            >
              <v-icon size="20">mdi-logout</v-icon>
            </v-btn>
          </div>
          <v-textarea
            variant="solo"
            auto-grow
            :label="langStore.user.about ? undefined : langStore.t('about me')"
            v-model="desc"
            class="no-append-padding"
            :readonly="!editingDesc"
            @click:append="toggleDescEditing"
            :clearable="editingDesc"
            ><template #append>
              <v-container v-if="isMeRoute" style="padding: 0; width: 30px">
                <v-col style="padding: 0" cols="1">
                  <v-icon
                    @click="toggleDescEditing"
                    v-if="editingDesc"
                    size="large"
                    style="color: rgba(0, 0, 0, 0.6)"
                    >mdi-pencil-off-outline</v-icon
                  >
                  <v-icon
                    @click="toggleDescEditing"
                    v-else
                    size="large"
                    style="color: rgba(0, 0, 0, 0.6)"
                    >mdi-pencil-outline</v-icon
                  >
                  <v-icon
                    @click="changeData({ about: desc })"
                    v-if="editingDesc"
                    size="large"
                    style="color: rgb(80, 200, 120)"
                    >mdi-check-circle</v-icon
                  >
                </v-col>
              </v-container>
            </template></v-textarea
          >
          <div class="sub">
            {{ age }} {{ langStore.t("age") }} · {{ user.city }}
          </div>

          <div class="rating">
            <div class="big-rating">{{ (user.rating ?? 0).toFixed(1) }}</div>
            <div class="rating-meta">
              <div class="stars">★★★★★</div>
              <div class="reviews">
                {{ reviews?.length ?? 0 }} {{ langStore.t("reviews") }}
              </div>
            </div>
          </div>

          <div class="verifications">
            <span class="ver-item" :class="{ ok: user.verifiedPassport }">{{
              langStore.t("passport")
            }}</span>
            <span class="ver-item" :class="{ ok: user.verifiedEmail }">{{
              langStore.t("email")
            }}</span>
            <span class="ver-item" :class="{ ok: user.verifiedPhone }">{{
              langStore.t("phone")
            }}</span>
          </div>

          <div v-if="isMeRoute" class="contacts">
            <v-container class="contact">
              <strong>{{ langStore.t("phone") }}:</strong>
              <v-text-field
                v-model="number"
                :readonly="!editingPhone"
                variant="solo"
                :clearable="editingPhone"
                style="max-width: 70%"
                hide-details="auto"
                class="small-input"
                density="compact"
              >
                <template #append-inner>
                  <v-icon size="small" class="mr-2" @click="togglePhoneEditing">
                    {{
                      editingPhone
                        ? "mdi-pencil-off-outline"
                        : "mdi-pencil-outline"
                    }}
                  </v-icon>

                  <v-icon
                    v-if="editingPhone"
                    size="small"
                    color="success"
                    @click="changeData({ phone: number })"
                  >
                    mdi-check-circle
                  </v-icon>
                </template>
              </v-text-field>
            </v-container>
            <v-container class="contact">
              <strong>{{ langStore.t("email") }}:</strong>
              <v-text-field
                v-model="email"
                :readonly="!editingEmail"
                variant="solo"
                :clearable="editingEmail"
                style="max-width: 70%"
                class="small-input"
                hide-details="auto"
                density="compact"
              >
                <template #append-inner>
                  <v-icon size="small" class="mr-2" @click="toggleEmailEditing">
                    {{
                      editingEmail
                        ? "mdi-pencil-off-outline"
                        : "mdi-pencil-outline"
                    }}
                  </v-icon>

                  <v-icon
                    v-if="editingEmail"
                    size="small"
                    color="success"
                    @click="changeData({ email: email })"
                  >
                    mdi-check-circle
                  </v-icon>
                </template>
              </v-text-field>
            </v-container>
          </div>

          <!-- <div class="actions">
            <button class="btn btn-primary">{{ langStore.t("write") }}</button>
            <button class="btn btn-outline">{{ langStore.t("report") }}</button>
          </div> -->
        </div>
        <div v-if="user.car && isMeRoute" class="car-block">
          <h3 class="small-title">Автомобиль</h3>
          <div class="car-info">
            <div class="car-title">
              {{ user.car.brand }} {{ user.car.model }}
            </div>
            <div class="car-meta">
              {{ langStore.t("year") }}: {{ user.car.year }} ·
              {{ langStore.t("color") }}:
              {{ user.car.color }}
            </div>
            <div class="car-plate">
              {{ langStore.t("car number") }}:
              <strong>{{ user.car.licensePlate }}</strong>
            </div>
          </div>
          <div class="car-photo-section">
            <div class="car-photo-wrap" @click="openCarPhotoDialog">
              <img
                class="car-photo"
                :src="
                  user.car?.photos[0]
                    ? `https://api.pop-utka.uz${user.car?.photos[0]}`
                    : ''
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
        <button
          v-if="isMeRoute"
          class="btn btn-outline btn-sm"
          @click="openCarModal"
        >
          ✏️ {{ langStore.t("edit car") }}
        </button>
      </div>
    </aside>

    <main class="right-panel">
      <nav class="section-nav">
        <button
          v-if="isMeRoute"
          :class="{ active: activeSection === 'main' }"
          @click="activeSection = 'main'"
        >
          {{ langStore.t("profile") }}
        </button>
        <button
          v-if="isMeRoute"
          :class="{ active: activeSection === 'trips' }"
          @click="activeSection = 'trips'"
        >
          {{ langStore.t("myTrips") }}
        </button>
        <button
          v-if="isMeRoute"
          :class="{ active: activeSection === 'bookings' }"
          @click="activeSection = 'bookings'"
        >
          {{ langStore.t("bookings") }}
        </button>
        <button
          :class="{ active: activeSection === 'reviews' }"
          @click="activeSection = 'reviews'"
        >
          {{ langStore.t("reviews") }}
        </button>
      </nav>

      <section
        v-if="isMeRoute"
        v-show="activeSection === 'main'"
        class="section-card"
      >
        <h2>{{ langStore.t("summary") }}</h2>
        <div class="grid-2">
          <div class="info-card">
            <h4>{{ langStore.t("rating") }}</h4>
            <div class="big">{{ (user.rating ?? 0).toFixed(1) }} / 5</div>
            <div class="muted">
              {{ reviews?.length ?? 0 }} отзывов • Завершено:
              {{ user.tripHistory.length ?? 0 }}
            </div>
          </div>
          <div class="info-card">
            <h4>{{ langStore.t("contacts") }}</h4>
            <div>{{ user.phone ?? "—" }}</div>
            <div>{{ user.email ?? "—" }}</div>
            <div class="muted">
              {{ langStore.t("signup") }}:
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
        <HistoryTripCard v-for="t in user.tripHistory" :key="t.id" :trip="t" />
      </section>

      <section v-show="activeSection === 'bookings'" class="section-card">
        <!-- МОИ БРОНИ -->
        <div class="booking-section my" v-if="user.myBookings.length">
          <h3>Мои бронирования</h3>
          <div class="cards-list">
            <BookingCard
              v-for="b in user.myBookings"
              :key="b.id"
              :trip="{ type: 'booking', data: b }"
            />
          </div>
        </div>

        <!-- PENDING -->
        <div class="booking-section pending" v-if="pendingTrips.length">
          <div class="section-header" @click="toggleSection('pending')">
            <div class="left">
              <span class="icon">
                <v-icon size="18">mdi-timer-sand</v-icon>
              </span>
              <span class="title">Ожидают подтверждения</span>
            </div>

            <div class="right">
              <span class="count">{{ pendingTrips.length }}</span>
              <span class="arrow" :class="{ open: openedSections.pending }">
                <v-icon size="18">mdi-arrow-down-bold</v-icon></span
              >
            </div>
          </div>
          <div v-show="openedSections.pending" class="cards-list">
            <BookingCard
              v-for="t in pendingTrips"
              :key="t.id"
              :trip="{ type: 'trip', data: t }"
            />
          </div>
        </div>

        <!-- АКТИВНЫЕ -->
        <div class="booking-section active" v-if="activeTrips.length">
          <div class="section-header" @click="toggleSection('active')">
            <div class="left">
              <span class="icon">
                <v-icon size="18">mdi-check-circle-outline</v-icon>
              </span>
              <span class="title"> Активные поездки</span>
            </div>

            <div class="right">
              <span class="count">{{ activeTrips.length }}</span>
              <span class="arrow" :class="{ open: openedSections.active }"
                ><v-icon size="18">mdi-arrow-down-bold</v-icon></span
              >
            </div>
          </div>
          <div class="cards-list">
            <BookingCard
              v-show="openedSections.active"
              v-for="t in activeTrips"
              :key="t.id"
              :trip="{ type: 'trip', data: t }"
            />
          </div>
        </div>

        <!-- ЗАПОЛНЕННЫЕ -->
        <div class="booking-section full" v-if="fullTrips.length">
          <div class="section-header" @click="toggleSection('full')">
            <div class="left">
              <span class="icon">
                <v-icon size="18">mdi-close-circle-outline</v-icon>
              </span>
              <span class="title">Заполненные</span>
            </div>

            <div class="right">
              <span class="count">{{ fullTrips.length }}</span>
              <span class="arrow" :class="{ open: openedSections.full }"
                ><v-icon size="18">mdi-arrow-down-bold</v-icon></span
              >
            </div>
          </div>
          <div class="cards-list">
            <BookingCard
              v-show="openedSections.full"
              v-for="t in fullTrips"
              :key="t.id"
              :trip="{ type: 'trip', data: t }"
            />
          </div>
        </div>
        <div
          v-if="user.myBookings.length === 0 && user.activeTrips.length === 0"
          class="empty"
        >
          Бронирований нет
        </div>
      </section>

      <section v-show="activeSection === 'reviews'" class="section-card">
        <ReviewCard
          v-if="reviews.length > 0"
          v-for="review in reviews"
          :review="review"
        />
        <div v-else class="empty">Отзывов нет</div>
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

  @media (max-width: 768px) {
    padding-bottom: 70px;
  }
}

.left-panel {
  height: 80dvh;
}

.card.main-card {
  height: 100%;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #1976d2;
    border-radius: 8px;
    border: 2px solid #f3f4f6;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: #115293;
  }

  scrollbar-width: thin;
  scrollbar-color: #1976d2 #f3f4f6;
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
  border-radius: 15px;
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
:deep(.small-input input) {
  font-size: 14px;
}

.ver-item {
  padding: 6px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-weight: 600;
}
.booking-section {
  border-radius: 14px;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid transparent;
  transition: all 0.25s ease;
}

.booking-section.pending {
  background-color: #ffedd5;
  border-color: #fdba74;
}

.booking-section.active {
  background-color: #d1fae5;
  border-color: #6ee7b7;
}

.booking-section.full {
  background-color: #fee2e2;
  border-color: #fca5a5;
}

.booking-section.my {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-color: #93c5fd;
}
.ver-item.ok {
  background: #ecfdf5;
  color: #065f46;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.02);
}

.contacts {
  margin-top: 12px;
  color: #374151;
  flex-direction: column;
  gap: 10px;
  display: flex;
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
.contact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
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
.booking-section.pending .section-header {
  background: #fff7ed;
}

.booking-section.active .section-header {
  background: #f0fdf4;
}

.booking-section.full .section-header {
  background: #fef2f2;
}

.booking-section.my .section-header {
  background: #eff6ff;
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
.no-append-padding {
  margin-top: 5px;
}
.no-append-padding :deep(.v-input__append) {
  padding: 0 !important;
  margin-left: 10px !important;
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
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  backdrop-filter: blur(6px);

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
  }
}
.section-header .left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.section-header .title {
  font-weight: 700;
  font-size: 14px;
}

.section-header .icon {
  font-size: 16px;
}

.section-header .right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.count {
  font-size: 12px;
  font-weight: 600;
  background: white;
  color: #111827;
  padding: 3px 8px;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}
.arrow {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.arrow.open {
  transform: rotate(180deg);
}
.section-card {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #1976d2;
    border-radius: 8px;
    border: 2px solid #f3f4f6;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: #115293;
  }

  scrollbar-width: thin;
  scrollbar-color: #1976d2 #f3f4f6;

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
    height: 100%;
    max-height: 100%;
  }
  .right-panel {
    order: 2;
  }
}
@media (max-width: 768px) {
  .section-nav {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .section-nav button {
    width: 100%;
    padding: 10px 8px;
    font-size: 14px;
    text-align: center;
  }
}
</style>

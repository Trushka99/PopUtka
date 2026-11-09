<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useLangStore } from "@/stores/langStore";
import Loading from "@/components/Loading.vue";
import BookingCard from "@/components/BookingCard.vue";
import HistoryTripCard from "@/components/HistoryTripCard.vue";
import ReviewCard from "@/components/ReviewCard.vue";
import ReviewsSummary from "@/components/ReviewsSummary.vue";
import ChangeNumberForm from "@/components/ChangeNumberForm.vue";
import {
  apiUploadAvatar,
  openChatWith,
  updateCar,
  updateCarPhoto,
  updateProfile,
  getReviews,
  getUser,
} from "@/api";
import {
  cityName,
  formatRating,
  initialsOf,
  mediaUrl,
  monthLabel,
} from "@/utils/tripFormat";

type Section = "main" | "trips" | "bookings" | "reviews";

const router = useRouter();
const route = useRoute();
const langStore = useLangStore();
const t = (key: string) => langStore.t(key);

const isMeRoute = computed(() => route.path === "/users/me");

const loading = ref(true);
const user = ref<any>(null);
const reviews = ref<any[]>([]);

// ---------- Редактирование «О себе» и email ----------
const editingEmail = ref<boolean>(false);
const editingDesc = ref<boolean>(false);
const email = ref<string>(langStore.user.email ?? "");
const desc = ref<string>(langStore.user.about ?? "");

watch(
  () => langStore.user.email,
  (value) => {
    email.value = value ?? "";
  },
  { immediate: true },
);

watch(
  () => langStore.user.about,
  (value) => {
    desc.value = value ?? "";
  },
  { immediate: true },
);

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

function toggleEmailEditing() {
  toggleEditingField(editingEmail, email, langStore.user.email ?? "");
}

function toggleDescEditing() {
  toggleEditingField(editingDesc, desc, langStore.user.about ?? "");
}

const changeData = async (body: Partial<typeof langStore.user>) => {
  try {
    await updateProfile(body);
    Object.assign(langStore.user, body);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

async function saveEmail() {
  if (await changeData({ email: email.value })) editingEmail.value = false;
}

async function saveDesc() {
  if (await changeData({ about: desc.value })) editingDesc.value = false;
}

// ---------- Телефон ----------
const changingNumberModal = ref<boolean>(false);
const changeNumberOpen = () => {
  changingNumberModal.value = true;
};

// ---------- Аватар ----------
const fileInput = ref<HTMLInputElement | null>(null);

function openFileDialog() {
  if (isMeRoute.value) fileInput.value?.click();
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

// ---------- Автомобиль ----------
const carModalOpen = ref<boolean>(false);
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

const carPhotoInput = ref<HTMLInputElement | null>(null);

function openCarPhotoDialog() {
  if (isMeRoute.value) carPhotoInput.value?.click();
}

async function uploadCarPhoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    const res = await updateCarPhoto(file);
    const uploaded: string[] = res.data?.data?.carPhotos ?? [];
    if (user.value?.car && uploaded.length) {
      user.value.car.photos = [...(user.value.car.photos ?? []), ...uploaded];
    }
  } catch (err) {
    alert("Не удалось загрузить фото автомобиля");
  }
}

// Показываем последнее загруженное фото
const carPhoto = computed(() => {
  const photos: string[] = user.value?.car?.photos ?? [];
  return photos.length ? mediaUrl(photos[photos.length - 1]) : "";
});

// «01 A 123 BC» → регион + остальное, для рисунка номерного знака
const plateParts = computed(() => {
  const raw = String(user.value?.car?.licensePlate ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const match = raw.match(/^(\d{2})\s?(.+)$/);
  return match
    ? { region: match[1], rest: match[2] }
    : { region: "", rest: raw };
});

const showCarPanel = computed(
  () => !!user.value?.car || (isMeRoute.value && user.value?.role === "driver"),
);

// ---------- Утка едет по дороге на обложке ----------
// Дорога — это /images/traceLine.svg (viewBox 1200×200), растянутый на всю
// ширину обложки и на ROAD_BG_HEIGHT её высоты снизу. Пунктир в нём —
// кривая Безье M0,180 C0,120 1200,120 1200,180. Считаем ту же кривую в
// пикселях обложки и отдаём её машинке как offset-path.
const ROAD_BG_HEIGHT = 0.8;
const coverEl = ref<HTMLElement | null>(null);
const roadPath = ref("");

function updateRoad() {
  const el = coverEl.value;
  if (!el) return;
  const w = el.clientWidth;
  const h = el.clientHeight;
  const bgH = h * ROAD_BG_HEIGHT;
  const top = h - bgH;
  const k = bgH / 200;

  // Края дуги почти вертикальные — берём середину, где наклон плавный
  const points: string[] = [];
  const STEPS = 60;
  for (let i = 0; i <= STEPS; i++) {
    const t = 0.05 + (0.9 * i) / STEPS;
    const x = w * (3 * t * t - 2 * t * t * t);
    const y = top + (180 - 180 * t * (1 - t)) * k;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  roadPath.value = `path("M${points.join(" L")}")`;
}

watch(coverEl, (el, _old, onCleanup) => {
  if (!el) return;
  updateRoad();
  const observer = new ResizeObserver(updateRoad);
  observer.observe(el);
  onCleanup(() => observer.disconnect());
});

// ---------- Прочее ----------
const logOUT = async () => {
  try {
    await langStore.signOut();
    router.push({ path: "/" });
  } catch (err) {
    console.error(err);
  }
};

const reRouteToChat = async () => {
  try {
    const chatId = await openChatWith(user.value.id);
    router.push(`/chats/${chatId}`);
  } catch (err) {
    console.error(err);
  }
};

const age = computed(() => {
  if (!user.value?.birthDate) return null;
  const b = new Date(user.value.birthDate);
  return Math.floor((Date.now() - b.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
});

const subtitle = computed(() =>
  [age.value ? `${age.value} ${t("age")}` : "", user.value?.city ?? ""]
    .filter(Boolean)
    .join(" · "),
);

const verifications = computed(() => [
  {
    key: "passport",
    icon: "mdi-card-account-details-outline",
    ok: !!(user.value?.isVerified ?? user.value?.verifiedPassport),
  },
  {
    key: "phone",
    icon: "mdi-phone-outline",
    ok: !!(user.value?.phoneVerified ?? user.value?.verifiedPhone),
  },
  {
    key: "email",
    icon: "mdi-email-outline",
    ok: !!(user.value?.emailVerified ?? user.value?.verifiedEmail),
  },
]);

const ratingValue = computed(() => Number(user.value?.rating ?? 0));

// ---------- Поездки и брони ----------
const tripsSource = computed(() =>
  isMeRoute.value ? langStore.user : user.value,
);

const hasPending = (t: any) =>
  t.bookings?.some((b: any) => b.status === "pending");

const pendingTrips = computed(
  () => tripsSource.value?.activeTrips?.filter(hasPending) || [],
);

const activeTrips = computed(
  () =>
    tripsSource.value?.activeTrips?.filter((t: any) => !hasPending(t)) || [],
);

const pendingCount = computed(() =>
  pendingTrips.value.reduce(
    (sum: number, t: any) =>
      sum + t.bookings.filter((b: any) => b.status === "pending").length,
    0,
  ),
);

const isClosedBooking = (b: any) =>
  ["rejected", "cancelled"].includes(b.status) ||
  ["completed", "cancelled"].includes(b.trip?.status);

// Сначала актуальные брони, потом завершённые / отклонённые
const myBookings = computed<any[]>(() => {
  const list: any[] = user.value?.myBookings ?? [];
  return [
    ...list.filter((b) => !isClosedBooking(b)),
    ...list.filter((b) => isClosedBooking(b)),
  ];
});

const isDriver = computed(() => langStore.user.role === "driver");

const hasAnyBookings = computed(
  () =>
    (isDriver.value &&
      (pendingTrips.value.length > 0 || activeTrips.value.length > 0)) ||
    myBookings.value.length > 0,
);

const tripHistory = computed<any[]>(() => tripsSource.value?.tripHistory ?? []);

const tripsCount = computed(
  () => user.value?.tripsCount ?? tripHistory.value.length,
);

const historyGroups = computed(() => {
  const groups: { key: string; label: string; trips: any[] }[] = [];
  for (const trip of tripHistory.value) {
    const d = new Date(trip.departureAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = {
        key,
        label: monthLabel(d, langStore.currentLang),
        trips: [],
      };
      groups.push(group);
    }
    group.trips.push(trip);
  }
  return groups;
});

// Ближайшая поездка для вкладки «Профиль»
const nextTrip = computed(() => {
  const now = Date.now();
  if (isDriver.value) {
    const trip = [...(tripsSource.value?.activeTrips ?? [])]
      .filter((t: any) => Date.parse(t.departureAt) > now)
      .sort(
        (a: any, b: any) => Date.parse(a.departureAt) - Date.parse(b.departureAt),
      )[0];
    return trip ? { type: "trip" as const, data: trip } : null;
  }
  const booking = myBookings.value
    .filter(
      (b) => !isClosedBooking(b) && Date.parse(b.trip?.departureAt) > now,
    )
    .sort(
      (a, b) => Date.parse(a.trip.departureAt) - Date.parse(b.trip.departureAt),
    )[0];
  return booking ? { type: "booking" as const, data: booking } : null;
});

const latestReviews = computed(() => reviews.value.slice(0, 2));

// Водителю пишут отзывы пассажиры, пассажиру — водители
const reviewAuthorRole = computed(() =>
  user.value?.role === "driver" ? "passenger" : "driver",
);

// Маршрут поездки для отзыва: ищем по tripId в своей истории поездок
const tripRouteById = computed<Record<string, string>>(() => {
  if (!isMeRoute.value) return {};
  const map: Record<string, string> = {};
  for (const trip of tripHistory.value) {
    map[trip.tripId] =
      `${cityName(trip.from, (k) => langStore.с(k))} → ${cityName(trip.to, (k) => langStore.с(k))}`;
  }
  return map;
});

// ---------- Вкладки ----------
// Вкладка берётся из ссылки (/users/me?tab=bookings), чтобы на неё вело меню в шапке
const SECTIONS: Section[] = ["main", "trips", "bookings", "reviews"];

const sectionFromRoute = (): Section => {
  if (!isMeRoute.value) return "reviews";
  const tab = route.query.tab as Section;
  return SECTIONS.includes(tab) ? tab : "main";
};

const activeSection = ref<Section>(sectionFromRoute());

watch(
  () => route.query.tab,
  () => {
    activeSection.value = sectionFromRoute();
  },
);

function selectTab(key: Section) {
  activeSection.value = key;
  if (isMeRoute.value) {
    router.replace({
      query: { ...route.query, tab: key === "main" ? undefined : key },
    });
  }
}

const tabs = computed(() => {
  const all: {
    key: Section;
    icon: string;
    label: string;
    badge?: number;
    hot?: boolean;
  }[] = [
    { key: "main", icon: "mdi-account-outline", label: t("profile") },
    {
      key: "trips",
      icon: "mdi-map-marker-path",
      label: t("myTrips"),
      badge: tripHistory.value.length,
    },
    {
      key: "bookings",
      icon: "mdi-ticket-confirmation-outline",
      label: t("bookings"),
      badge: pendingCount.value,
      hot: true,
    },
    {
      key: "reviews",
      icon: "mdi-star-outline",
      label: t("reviews"),
      badge: reviews.value.length,
    },
  ];
  return isMeRoute.value ? all : all.filter((tab) => tab.key === "reviews");
});

// ---------- Загрузка ----------
watch(
  () => route.path,
  async () => {
    loading.value = true;
    activeSection.value = sectionFromRoute();

    try {
      let userId: string;
      if (route.path === "/users/me") {
        await langStore.initUser();
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
</script>

<template>
  <Loading v-if="loading" />

  <div v-else-if="user" class="profile">
    <!-- ===== Шапка ===== -->
    <section class="hero">
      <div ref="coverEl" class="hero__cover">
        <span class="hero__cloud hero__cloud--a" aria-hidden="true"></span>
        <span class="hero__cloud hero__cloud--b" aria-hidden="true"></span>
        <span class="hero__cloud hero__cloud--c" aria-hidden="true"></span>

        <div
          v-if="roadPath"
          class="duck-car"
          :style="{ offsetPath: roadPath }"
          aria-hidden="true"
        >
          <img class="duck-car__img" src="/images/duckCar.png" alt="" />
        </div>

        <v-menu v-if="isMeRoute" location="bottom end" offset="8">
          <template #activator="{ props }">
            <button
              type="button"
              class="hero__menu-btn"
              v-bind="props"
              :aria-label="t('settings')"
            >
              <v-icon size="22">mdi-dots-horizontal</v-icon>
            </button>
          </template>

          <v-card class="cover-menu" min-width="240" rounded="xl" elevation="10">
            <v-list density="comfortable" nav class="cover-menu__list">
              <v-list-item
                prepend-icon="mdi-camera-outline"
                :title="t('change_photo')"
                @click="openFileDialog"
              />
              <v-list-item
                v-if="user.role === 'driver'"
                prepend-icon="mdi-car-outline"
                :title="user.car ? t('edit car') : t('add_car')"
                @click="openCarModal"
              />
            </v-list>
            <v-divider />
            <v-list density="comfortable" nav class="cover-menu__list">
              <v-list-item
                prepend-icon="mdi-logout"
                :title="t('logout')"
                class="cover-menu__danger"
                @click="logOUT"
              />
            </v-list>
          </v-card>
        </v-menu>
      </div>

      <div class="hero__body">
        <button
          type="button"
          class="hero__avatar"
          :class="{ 'hero__avatar--editable': isMeRoute }"
          :disabled="!isMeRoute"
          :aria-label="isMeRoute ? t('change_photo') : undefined"
          @click="openFileDialog"
        >
          <img v-if="user.avatar" :src="mediaUrl(user.avatar)" alt="" />
          <span v-else>{{ initialsOf(user.firstName, user.lastName) }}</span>
          <span v-if="isMeRoute" class="hero__avatar-edit">
            <v-icon size="18">mdi-camera-outline</v-icon>
          </span>
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          hidden
          :disabled="!isMeRoute"
          @change="uploadAvatar"
        />

        <div class="hero__info">
          <h1 class="hero__name">
            {{ user.firstName }} <span>{{ user.lastName }}</span>
          </h1>
          <div class="hero__sub">
            <span v-if="subtitle">{{ subtitle }}</span>
            <span class="role-chip">
              <v-icon size="14">{{
                user.role === "driver" ? "mdi-steering" : "mdi-account-outline"
              }}</v-icon>
              {{ user.role === "driver" ? t("driver") : t("passenger") }}
            </span>
          </div>
          <div class="badges">
            <span
              v-for="v in verifications"
              :key="v.key"
              class="badge"
              :class="{ 'badge--ok': v.ok }"
              :title="v.ok ? t('confirmed') : t('not_confirmed')"
            >
              <v-icon size="15">{{ v.ok ? "mdi-check-decagram" : v.icon }}</v-icon>
              {{ t(v.key) }}
            </span>
          </div>
        </div>

        <div class="hero__side">
          <div class="stats">
            <div class="stat stat--rating">
              <div class="stat__value">
                {{ formatRating(ratingValue) }}
                <v-icon size="18">mdi-star</v-icon>
              </div>
              <div class="stat__label">{{ t("rating") }}</div>
            </div>
            <div class="stat">
              <div class="stat__value">{{ tripsCount }}</div>
              <div class="stat__label">{{ t("rides") }}</div>
            </div>
            <div class="stat">
              <div class="stat__value">{{ reviews.length }}</div>
              <div class="stat__label">{{ t("reviews") }}</div>
            </div>
          </div>

          <div v-if="!isMeRoute" class="hero__actions">
            <v-btn
              class="btn-sky"
              variant="flat"
              prepend-icon="mdi-message-outline"
              @click="reRouteToChat"
            >
              {{ t("write") }}
            </v-btn>
            <v-btn
              class="btn-ghost"
              variant="text"
              prepend-icon="mdi-flag-outline"
            >
              {{ t("report") }}
            </v-btn>
          </div>
        </div>
      </div>
    </section>

    <div class="layout">
      <!-- ===== Боковая колонка ===== -->
      <aside class="side">
        <div class="panel">
          <div class="panel__head">
            <span class="panel__title">{{ t("about me") }}</span>
            <button
              v-if="isMeRoute"
              type="button"
              class="icon-btn"
              :aria-label="t('edit')"
              @click="toggleDescEditing"
            >
              <v-icon size="18">{{
                editingDesc ? "mdi-close" : "mdi-pencil-outline"
              }}</v-icon>
            </button>
          </div>

          <template v-if="editingDesc">
            <v-textarea
              v-model="desc"
              variant="outlined"
              density="comfortable"
              rows="3"
              auto-grow
              hide-details
              autofocus
              :placeholder="t('about_empty')"
            />
            <div class="panel__actions">
              <v-btn variant="text" class="btn-ghost" @click="toggleDescEditing">
                {{ t("cancel") }}
              </v-btn>
              <v-btn variant="flat" class="btn-sky" @click="saveDesc">
                {{ t("save") }}
              </v-btn>
            </div>
          </template>
          <p v-else-if="user.about" class="about">{{ user.about }}</p>
          <p v-else class="about about--empty">
            {{ isMeRoute ? t("about_empty") : "—" }}
          </p>
        </div>

        <div v-if="isMeRoute" class="panel">
          <div class="panel__head">
            <span class="panel__title">{{ t("contacts") }}</span>
          </div>

          <div class="contact">
            <v-icon size="18" class="contact__icon">mdi-phone-outline</v-icon>
            <span class="contact__value">{{ langStore.user.phone || "—" }}</span>
            <button
              type="button"
              class="icon-btn"
              :aria-label="t('edit')"
              @click="changeNumberOpen"
            >
              <v-icon size="18">mdi-pencil-outline</v-icon>
            </button>
          </div>

          <div class="contact">
            <v-icon size="18" class="contact__icon">mdi-email-outline</v-icon>
            <template v-if="editingEmail">
              <v-text-field
                v-model="email"
                variant="outlined"
                density="compact"
                hide-details
                autofocus
                class="contact__field"
                @keyup.enter="saveEmail"
              />
              <button
                type="button"
                class="icon-btn icon-btn--ok"
                :aria-label="t('save')"
                @click="saveEmail"
              >
                <v-icon size="18">mdi-check</v-icon>
              </button>
              <button
                type="button"
                class="icon-btn"
                :aria-label="t('cancel')"
                @click="toggleEmailEditing"
              >
                <v-icon size="18">mdi-close</v-icon>
              </button>
            </template>
            <template v-else>
              <span class="contact__value">{{ email || "—" }}</span>
              <button
                type="button"
                class="icon-btn"
                :aria-label="t('edit')"
                @click="toggleEmailEditing"
              >
                <v-icon size="18">mdi-pencil-outline</v-icon>
              </button>
            </template>
          </div>
        </div>

        <div v-if="showCarPanel" class="panel panel--car">
          <template v-if="user.car">
            <button
              type="button"
              class="car-photo"
              :class="{ 'car-photo--editable': isMeRoute }"
              :disabled="!isMeRoute"
              :aria-label="isMeRoute ? t('change_photo') : undefined"
              @click="openCarPhotoDialog"
            >
              <img v-if="carPhoto" :src="carPhoto" alt="" />
              <v-icon v-else size="40" class="car-photo__placeholder"
                >mdi-car-side</v-icon
              >
              <span v-if="isMeRoute" class="car-photo__overlay">
                <v-icon size="22">mdi-camera-outline</v-icon>
              </span>
            </button>
            <input
              ref="carPhotoInput"
              type="file"
              accept="image/*"
              hidden
              @change="uploadCarPhoto"
            />

            <div class="car-info">
              <div class="panel__head">
                <span class="car-info__title">
                  {{ [user.car.brand, user.car.model].filter(Boolean).join(" ") }}
                </span>
                <button
                  v-if="isMeRoute && user.role === 'driver'"
                  type="button"
                  class="icon-btn"
                  :aria-label="t('edit car')"
                  @click="openCarModal"
                >
                  <v-icon size="18">mdi-pencil-outline</v-icon>
                </button>
              </div>
              <div class="car-info__meta">
                {{ [user.car.year, user.car.color].filter(Boolean).join(" · ") }}
              </div>

              <div v-if="user.car.licensePlate" class="plate">
                <span v-if="plateParts.region" class="plate__region">{{
                  plateParts.region
                }}</span>
                <span class="plate__number">{{ plateParts.rest }}</span>
                <span class="plate__flag" aria-hidden="true">
                  <i></i><i></i><i></i>
                  <b>UZ</b>
                </span>
              </div>
            </div>
          </template>

          <div v-else class="car-empty">
            <v-icon size="34">mdi-car-side</v-icon>
            <v-btn
              variant="flat"
              class="btn-sky"
              prepend-icon="mdi-plus"
              @click="openCarModal"
            >
              {{ t("add_car") }}
            </v-btn>
          </div>
        </div>
      </aside>

      <!-- ===== Контент ===== -->
      <main class="content">
        <nav class="tabs" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            role="tab"
            class="tab"
            :class="{ 'tab--active': activeSection === tab.key }"
            :aria-selected="activeSection === tab.key"
            @click="selectTab(tab.key)"
          >
            <v-icon size="18">{{ tab.icon }}</v-icon>
            <span>{{ tab.label }}</span>
            <span
              v-if="tab.badge"
              class="tab__badge"
              :class="{ 'tab__badge--hot': tab.hot }"
              >{{ tab.badge }}</span
            >
          </button>
        </nav>

        <!-- Профиль -->
        <section v-if="isMeRoute" v-show="activeSection === 'main'" class="tab-body">
          <button
            v-if="pendingCount"
            type="button"
            class="callout"
            @click="selectTab('bookings')"
          >
            <span class="callout__dot"></span>
            <span class="callout__text">
              <strong>{{ t("new_requests_banner") }}: {{ pendingCount }}</strong>
            </span>
            <span class="callout__action">
              {{ t("view") }} <v-icon size="18">mdi-arrow-right</v-icon>
            </span>
          </button>

          <div class="group-label">{{ t("next_trip") }}</div>
          <BookingCard v-if="nextTrip" :trip="nextTrip" />
          <div v-else class="empty">
            <div class="empty__icon"><v-icon size="30">mdi-weather-cloudy</v-icon></div>
            <h3>{{ t("nothing_planned_title") }}</h3>
            <p>{{ t("nothing_planned_text") }}</p>
            <v-btn variant="flat" class="btn-sky" to="/">
              {{ t("find_ride") }}
            </v-btn>
          </div>

          <template v-if="latestReviews.length">
            <div class="group-label">
              {{ t("latest_reviews") }}
              <button
                type="button"
                class="group-label__link"
                @click="selectTab('reviews')"
              >
                {{ t("all_reviews") }}
              </button>
            </div>
            <div class="reviews-list">
              <ReviewCard
                v-for="(review, i) in latestReviews"
                :key="`${review.authorId}-${i}`"
                :review="review"
                :author-role="reviewAuthorRole"
                :trip-route="tripRouteById[review.tripId]"
              />
            </div>
          </template>
        </section>

        <!-- Мои поездки -->
        <section v-if="isMeRoute" v-show="activeSection === 'trips'" class="tab-body">
          <template v-if="historyGroups.length">
            <div v-for="group in historyGroups" :key="group.key">
              <div class="group-label">{{ group.label }}</div>
              <div class="history-grid">
                <HistoryTripCard
                  v-for="(trip, i) in group.trips"
                  :key="`${trip.tripId}-${trip.role}-${i}`"
                  :trip="trip"
                />
              </div>
            </div>
          </template>
          <div v-else class="empty">
            <div class="empty__icon"><v-icon size="30">mdi-map-marker-path</v-icon></div>
            <h3>{{ t("no_trips_title") }}</h3>
            <p>{{ t("no_trips_text") }}</p>
          </div>
        </section>

        <!-- Бронирования -->
        <section
          v-if="isMeRoute"
          v-show="activeSection === 'bookings'"
          class="tab-body"
        >
          <template v-if="isDriver && pendingTrips.length">
            <div class="group-label group-label--hot">
              <span class="group-label__dot"></span>
              {{ t("awaiting_your_answer") }}
              <span class="group-label__count">{{ pendingCount }}</span>
            </div>
            <div class="cards">
              <BookingCard
                v-for="trip in pendingTrips"
                :key="trip.id"
                :trip="{ type: 'trip', data: trip }"
              />
            </div>
          </template>

          <template v-if="isDriver && activeTrips.length">
            <div class="group-label">
              {{ t("active") }}
              <span class="group-label__count">{{ activeTrips.length }}</span>
            </div>
            <div class="cards">
              <BookingCard
                v-for="trip in activeTrips"
                :key="trip.id"
                :trip="{ type: 'trip', data: trip }"
              />
            </div>
          </template>

          <template v-if="myBookings.length">
            <div class="group-label">
              {{ t("my") }}
              <span class="group-label__count">{{ myBookings.length }}</span>
            </div>
            <div class="cards">
              <BookingCard
                v-for="b in myBookings"
                :key="b.id"
                :trip="{ type: 'booking', data: b }"
              />
            </div>
          </template>

          <div v-if="!hasAnyBookings" class="empty">
            <div class="empty__icon">
              <v-icon size="30">mdi-ticket-confirmation-outline</v-icon>
            </div>
            <h3>{{ t("no_bookings_title") }}</h3>
            <p>{{ t("no_bookings_text") }}</p>
            <v-btn variant="flat" class="btn-sky" to="/">
              {{ t("find_ride") }}
            </v-btn>
          </div>
        </section>

        <!-- Отзывы -->
        <section v-show="activeSection === 'reviews'" class="tab-body">
          <template v-if="reviews.length">
            <ReviewsSummary
              class="reviews-summary"
              :reviews="reviews"
              :rating="ratingValue"
            />
            <div class="reviews-list">
              <ReviewCard
                v-for="(review, i) in reviews"
                :key="`${review.authorId}-${i}`"
                :review="review"
                :author-role="reviewAuthorRole"
                :trip-route="tripRouteById[review.tripId]"
              />
            </div>
          </template>
          <div v-else class="empty">
            <div class="empty__icon"><v-icon size="30">mdi-star-outline</v-icon></div>
            <h3>{{ t("no_reviews") }}</h3>
          </div>
        </section>
      </main>
    </div>

    <!-- ===== Модальные окна ===== -->
    <div
      v-if="carModalOpen"
      class="modal-backdrop"
      @click.self="carModalOpen = false"
    >
      <div class="modal">
        <h3 class="modal__title">{{ t("car") }}</h3>

        <div class="modal__form">
          <v-text-field
            v-model="carForm.model"
            :label="t('model')"
            variant="outlined"
            density="comfortable"
            hide-details
          />
          <v-text-field
            v-model="carForm.color"
            :label="t('color')"
            variant="outlined"
            density="comfortable"
            hide-details
          />
          <v-text-field
            v-model="carForm.year"
            :label="t('year')"
            type="number"
            variant="outlined"
            density="comfortable"
            hide-details
          />
          <v-text-field
            v-model="carForm.licensePlate"
            :label="t('car number')"
            placeholder="01 A 123 BC"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </div>

        <div class="modal__actions">
          <v-btn variant="text" class="btn-ghost" @click="carModalOpen = false">
            {{ t("cancel") }}
          </v-btn>
          <v-btn variant="flat" class="btn-sky" @click="saveCar">
            {{ t("save") }}
          </v-btn>
        </div>
      </div>
    </div>

    <div v-if="changingNumberModal" class="modal-backdrop">
      <ChangeNumberForm v-model="changingNumberModal" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile {
  --ticket-notch: #eeeeee;
  --ink: #0f1d33;
  --ink-soft: #66758a;
  --line: #e3e9f1;
  --blue: #0b4fa8;

  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 36px 20px 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: var(--ink);
  box-sizing: border-box;
}

/* ================= Шапка ================= */
.hero {
  background: #fff;
  border-radius: 26px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.hero__cover {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  height: 130px;
  background:
    url("/images/traceLine.svg") bottom / 100% 80% no-repeat,
    linear-gradient(120deg, #0080ff 0%, #0a5ad6 55%, #002583 100%);
}

/* --- Утка на машинке едет по пунктиру --- */
.duck-car {
  position: absolute;
  top: 0;
  left: 0;
  width: 76px;
  offset-anchor: 50% 100%;
  offset-rotate: auto;
  offset-distance: 0%;
  opacity: 0;
  pointer-events: none;
  animation: duck-drive 16s linear infinite;
}

.duck-car__img {
  display: block;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 4px 6px rgba(0, 20, 70, 0.35));
  transform-origin: 50% 100%;
  animation: duck-bump 0.45s ease-in-out infinite alternate;
}

/* Проезжает за ~85% цикла, потом короткая пауза за кадром */
@keyframes duck-drive {
  0% {
    offset-distance: 0%;
    opacity: 0;
  }
  4% {
    opacity: 1;
  }
  81% {
    opacity: 1;
  }
  85% {
    offset-distance: 100%;
    opacity: 0;
  }
  100% {
    offset-distance: 100%;
    opacity: 0;
  }
}

/* Лёгкое покачивание, будто едет по кочкам */
@keyframes duck-bump {
  from {
    translate: 0 0;
    rotate: 0deg;
  }
  to {
    translate: 0 -1.5px;
    rotate: -0.8deg;
  }
}

@media (prefers-reduced-motion: reduce) {
  .duck-car,
  .duck-car__img {
    animation: none;
  }

  .duck-car {
    offset-distance: 62%;
    opacity: 1;
  }
}

.hero__menu-btn {
  position: absolute;
  top: 14px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  transition: background 0.2s ease;

  &:hover,
  &[aria-expanded="true"] {
    background: rgba(255, 255, 255, 0.3);
  }
}

.cover-menu {
  padding: 4px;
}

.cover-menu__list {
  padding: 4px;
}

.cover-menu__danger {
  color: #c0362c !important;
}

.hero__cloud {
  position: absolute;
  z-index: -1;
  width: 90px;
  height: 28px;
  border-radius: 28px;
  background: #fff;
  opacity: 0.22;
  animation: drift 12s ease-in-out infinite alternate;

  &::before,
  &::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    background: inherit;
  }

  &::before {
    width: 42px;
    height: 42px;
    top: -21px;
    left: 12px;
  }

  &::after {
    width: 32px;
    height: 32px;
    top: -14px;
    left: 45px;
  }
}

.hero__cloud--a {
  top: 40px;
  right: 18%;
}

.hero__cloud--b {
  top: 70px;
  right: 5%;
  scale: 0.6;
  opacity: 0.18;
  animation-duration: 15s;
}

.hero__cloud--c {
  top: 30px;
  left: 38%;
  scale: 0.75;
  opacity: 0.14;
  animation-duration: 18s;
  animation-direction: alternate-reverse;
}

@keyframes drift {
  from {
    translate: 0 0;
  }
  to {
    translate: 18px 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__cloud,
  .callout__dot,
  .group-label__dot {
    animation: none;
  }
}

.hero__body {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: end;
  gap: 22px;
  padding: 0 28px 24px;
}

.hero__avatar {
  position: relative;
  width: 128px;
  height: 128px;
  margin-top: -60px;
  padding: 0;
  border-radius: 50%;
  border: 5px solid #fff;
  background: #dbeafe;
  color: var(--blue);
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 40px;
  font-weight: 700;
  display: grid;
  place-items: center;
  box-shadow: 0 12px 30px rgba(0, 60, 160, 0.2);
  cursor: default;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  &--editable {
    cursor: pointer;

    &:hover .hero__avatar-edit {
      transform: scale(1.08);
    }
  }
}

.hero__avatar-edit {
  position: absolute;
  right: 0;
  bottom: 4px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #fff;
  color: var(--blue);
  box-shadow: 0 4px 12px rgba(0, 60, 160, 0.25);
  transition: transform 0.2s ease;
}

.hero__info {
  min-width: 0;
  padding-top: 14px;
}

.hero__name {
  margin: 0;
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.15;
  word-break: break-word;

  span {
    color: #3b4a60;
  }
}

.hero__sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
  color: var(--ink-soft);
}

.role-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 999px;
  background: #e8f1fd;
  color: var(--blue);
  font-size: 12px;
  font-weight: 600;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 11px;
  border-radius: 999px;
  background: #f1f3f6;
  color: #7a8696;
  font-size: 12px;
  font-weight: 600;
}

.badge--ok {
  background: #e7f6ee;
  color: #0f6b3d;
}

.hero__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.stats {
  display: flex;
  gap: 10px;
}

.stat {
  min-width: 96px;
  padding: 10px 16px;
  border-radius: 16px;
  background: #f3f6fa;
  text-align: center;
}

.stat__value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
}

.stat__label {
  margin-top: 2px;
  font-size: 12px;
  color: var(--ink-soft);
}

.stat--rating {
  background: #fff4e6;

  .stat__value {
    color: #e05d00;
  }
}

.hero__actions {
  display: flex;
  gap: 8px;
}

/* ================= Раскладка ================= */
.layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

@media (min-width: 1025px) and (min-height: 860px) {
  .side {
    position: sticky;
    top: 16px;
  }
}

.panel {
  background: #fff;
  border-radius: 20px;
  padding: 16px 18px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
}

.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.panel__title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.about {
  margin: 0;
  line-height: 1.6;
  color: #2b3a52;
  white-space: pre-line;
  word-break: break-word;

  &--empty {
    color: #9aa6b5;
  }
}

.icon-btn {
  flex: none;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: transparent;
  color: #8a97a8;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;

  &:hover {
    background: #eef4fb;
    color: var(--blue);
  }

  &--ok {
    color: #1f9d55;
  }
}

.contact {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;

  & + & {
    border-top: 1px solid #eef2f7;
  }
}

.contact__icon {
  color: #8a97a8;
}

.contact__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact__field {
  flex: 1;
  min-width: 0;
}

/* --- Автомобиль --- */
.panel--car {
  padding: 0;
  overflow: hidden;
}

.car-photo {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 150px;
  padding: 0;
  border: none;
  background: linear-gradient(160deg, #dff1fd, #f2f8fd);
  cursor: default;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &--editable {
    cursor: pointer;

    &:hover .car-photo__overlay {
      opacity: 1;
    }
  }
}

.car-photo__placeholder {
  color: #9cc4e4;
}

.car-photo__overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(8, 40, 80, 0.4);
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.car-info {
  padding: 14px 18px 16px;

  .panel__head {
    margin-bottom: 2px;
  }
}

.car-info__title {
  font-size: 16px;
  font-weight: 700;
}

.car-info__meta {
  color: var(--ink-soft);
}

.plate {
  display: inline-flex;
  align-items: stretch;
  margin-top: 10px;
  border: 2px solid #0f1d33;
  border-radius: 6px;
  background: #fff;
  font-family: "Exo 2", "Roboto", sans-serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.06em;
  overflow: hidden;
}

.plate__region {
  padding: 2px 8px;
  border-right: 2px solid #0f1d33;
}

.plate__number {
  padding: 2px 10px;
}

.plate__flag {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  padding: 0 6px;

  i {
    display: block;
    width: 14px;
    height: 3px;

    &:nth-child(1) {
      background: #1eb2e8;
    }

    &:nth-child(2) {
      background: #fff;
      box-shadow: inset 0 0 0 0.5px #c9d3de;
    }

    &:nth-child(3) {
      background: #1eb53a;
    }
  }

  b {
    margin-top: 1px;
    font-size: 9px;
    line-height: 1;
    letter-spacing: 0;
    color: #0a6fe0;
  }
}

.car-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 22px 18px;
  color: #9cc4e4;
}

/* ================= Контент ================= */
.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 6px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tab {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 13px;
  background: transparent;
  color: #43526a;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;

  &:hover {
    background: #f3f6fa;
  }

  &--active,
  &--active:hover {
    background: #e8f1fd;
    color: var(--blue);
  }
}

.tab__badge {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background: #eef1f5;
  color: var(--ink-soft);
  font-size: 12px;
  font-weight: 700;

  &--hot {
    background: #ff6d00;
    color: #fff;
  }
}

.tab-body {
  display: flex;
  flex-direction: column;
}

.group-label {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 4px 12px;
  font-size: 14px;
  font-weight: 600;
  color: #43526a;

  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #dbe2ea;
  }

  &--hot {
    color: #9a4a00;
  }
}

.group-label__count {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background: #fff;
  font-size: 12px;
  font-weight: 700;
}

.group-label__dot,
.callout__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff8a00;
  animation: pulse 1.8s ease-out infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 138, 0, 0.55);
  }
  100% {
    box-shadow: 0 0 0 9px rgba(255, 138, 0, 0);
  }
}

.group-label__link {
  order: 2;
  border: none;
  background: none;
  padding: 0;
  color: var(--blue);
  font-weight: 600;
  cursor: pointer;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 18px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.reviews-summary {
  margin-bottom: 18px;
}

.callout {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-bottom: 8px;
  padding: 14px 18px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 18px;
  background:
    radial-gradient(
      220px 80px at 90% 0%,
      rgba(255, 255, 255, 0.8),
      transparent 70%
    ),
    linear-gradient(120deg, #ffc58f 0%, #ffe2c4 45%, #d6efff 100%);
  color: #7a3a00;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(200, 110, 30, 0.14);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

.callout__text {
  flex: 1;
}

.callout__action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: var(--blue);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 36px 20px;
  border-radius: 22px;
  background: #fff;
  text-align: center;

  h3 {
    margin: 6px 0 0;
    font-size: 18px;
  }

  p {
    max-width: 360px;
    margin: 0 0 10px;
    color: var(--ink-soft);
  }
}

.empty__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, #bfe6fb, #eaf7ff);
  color: #1a7cc9;
}

/* ================= Кнопки ================= */
.btn-sky,
.btn-ghost {
  border-radius: 12px;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}

.btn-sky {
  color: #fff !important;
  background: linear-gradient(135deg, #1e88e5, #42a5f5) !important;
  box-shadow: 0 4px 12px rgba(30, 136, 229, 0.3);
}

.btn-ghost {
  color: #43526a !important;
}

/* ================= Модалки ================= */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.4);
}

.modal {
  width: 100%;
  max-width: 420px;
  padding: 22px;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.modal__title {
  margin: 0;
  font-size: 20px;
}

.modal__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

/* ================= Адаптив ================= */
@media (max-width: 1180px) {
  .hero__body {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .hero__side {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }
}

@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .side {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    align-items: start;
  }
}

@media (max-width: 720px) {
  .profile {
    padding: 28px 12px 90px;
    gap: 14px;
  }

  .hero__cover {
    height: 128px;
  }

  .duck-car {
    width: 56px;
  }

  .hero__body {
    grid-template-columns: 1fr;
    justify-items: center;
    gap: 12px;
    padding: 0 16px 18px;
    text-align: center;
  }

  .hero__avatar {
    width: 108px;
    height: 108px;
    margin-top: -40px;
    font-size: 34px;
  }

  .hero__info {
    padding-top: 0;
  }

  .hero__name {
    font-size: 24px;
  }

  .hero__sub,
  .badges {
    justify-content: center;
  }

  .hero__side {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .stats {
    width: 100%;

    .stat {
      flex: 1;
      min-width: 0;
      padding: 8px 6px;
    }
  }

  .hero__actions .v-btn {
    flex: 1;
  }

  .history-grid {
    grid-template-columns: 1fr;
  }

  .tab {
    padding: 9px 12px;
    font-size: 14px;
  }
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  adminBanUser,
  adminDeleteUser,
  adminDownloadUsersXlsx,
  adminGetGrowth,
  adminGetReports,
  adminGetStats,
  adminGetUsers,
  adminUnbanUser,
  adminUpdateReport,
  type AdminRole,
  type ReportStatus,
} from "@/api";
import { useSnackbarStore } from "@/stores/snackbarStore";
import { useLangStore } from "@/stores/langStore";

// Админка внутренняя, поэтому тексты только на русском.
const snackbar = useSnackbarStore();
const langStore = useLangStore();

const tab = ref<"stats" | "users" | "reports">("stats");

const errorText = (err: any, fallback: string) =>
  err?.response?.data?.message || fallback;

const fmtDate = (iso?: string | null, withTime = false) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

const fullName = (u: any) =>
  [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.username || "—";

const roleLabel: Record<string, string> = {
  driver: "Водитель",
  passenger: "Пассажир",
  admin: "Админ",
};

// ---------------- Статистика ----------------
const stats = ref<any>(null);
const growth = ref<any>(null);
const statsLoading = ref(false);
const exporting = ref(false);

const loadStats = async () => {
  statsLoading.value = true;
  try {
    const [s, g] = await Promise.all([adminGetStats(), adminGetGrowth()]);
    stats.value = s.data.data;
    growth.value = g.data.data;
  } catch (err) {
    snackbar.error(errorText(err, "Не удалось загрузить статистику"));
  } finally {
    statsLoading.value = false;
  }
};

const statCards = computed(() => {
  const g = growth.value;
  const s = stats.value;
  if (!g || !s) return [];
  return [
    { title: "Пользователей", value: g.users.total, sub: `водителей ${g.users.drivers} · пассажиров ${g.users.passengers}`, icon: "mdi-account-group-outline" },
    { title: "Новых сегодня", value: g.newUsers.today, sub: `за 7 дней ${g.newUsers.last7d} · за 30 дней ${g.newUsers.last30d}`, icon: "mdi-account-plus-outline" },
    { title: "Активных за день", value: g.activeUsers.last1d, sub: `за 7 дней ${g.activeUsers.last7d} · за 30 дней ${g.activeUsers.last30d}`, icon: "mdi-pulse" },
    { title: "Поездок", value: g.usage.tripsTotal, sub: `активных ${s.trips.active} · завершённых ${s.trips.completed} · за 30 дней ${g.usage.trips30d}`, icon: "mdi-car-outline" },
    { title: "Бронирований", value: g.usage.bookingsTotal, sub: `подтверждённых ${g.usage.bookingsConfirmed} · за 30 дней ${g.usage.bookings30d}`, icon: "mdi-ticket-confirmation-outline" },
    { title: "Заблокировано", value: g.users.banned, sub: "пользователей", icon: "mdi-account-cancel-outline" },
    { title: "Жалоб ждут ответа", value: s.reports.pending, sub: "со статусом «новая»", icon: "mdi-alert-octagon-outline", action: () => (tab.value = "reports") },
  ];
});

const downloadXlsx = async () => {
  exporting.value = true;
  try {
    await adminDownloadUsersXlsx();
  } catch (err) {
    snackbar.error("Не удалось скачать Excel");
  } finally {
    exporting.value = false;
  }
};

// ---------------- Пользователи ----------------
const users = ref<any[]>([]);
const usersTotal = ref(0);
const usersLoading = ref(false);
const usersPage = ref(1);
const usersPerPage = ref(20);
const search = ref("");
const roleFilter = ref<AdminRole>("");
let searchTimer: ReturnType<typeof setTimeout> | undefined;

const userHeaders = [
  { title: "Пользователь", key: "name", sortable: false },
  { title: "Телефон", key: "phone", sortable: false },
  { title: "Роль", key: "role", sortable: false },
  { title: "Регистрация", key: "createdAt", sortable: false },
  { title: "Был в сети", key: "lastSeenAt", sortable: false },
  { title: "Статус", key: "status", sortable: false },
  { title: "", key: "actions", sortable: false, align: "end" as const },
];

const loadUsers = async () => {
  usersLoading.value = true;
  try {
    const res = await adminGetUsers({
      page: usersPage.value,
      limit: usersPerPage.value,
      search: search.value.trim() || undefined,
      role: roleFilter.value || undefined,
    });
    users.value = res.data.data;
    usersTotal.value = res.data.meta.total;
  } catch (err) {
    snackbar.error(errorText(err, "Не удалось загрузить пользователей"));
  } finally {
    usersLoading.value = false;
  }
};

const onUsersOptions = (opts: { page: number; itemsPerPage: number }) => {
  usersPage.value = opts.page;
  usersPerPage.value = opts.itemsPerPage;
  loadUsers();
};

// При смене фильтра возвращаемся на 1-ю страницу; смена страницы сама
// перезагрузит таблицу через update:options, иначе грузим вручную.
const reloadFromFirstPage = () => {
  if (usersPage.value !== 1) usersPage.value = 1;
  else loadUsers();
};
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(reloadFromFirstPage, 400);
});
watch(roleFilter, reloadFromFirstPage);

const isBannedNow = (u: any) =>
  u.isBanned && (!u.bannedUntil || new Date(u.bannedUntil) > new Date());

// Блокировка
const banDialog = ref(false);
const banTarget = ref<any>(null);
const banReason = ref("");
const banDays = ref<number | null>(null);
const banSaving = ref(false);
const banPeriods = [
  { title: "Навсегда", value: null },
  { title: "1 день", value: 1 },
  { title: "7 дней", value: 7 },
  { title: "30 дней", value: 30 },
];

const openBan = (u: any) => {
  banTarget.value = u;
  banReason.value = "";
  banDays.value = null;
  banDialog.value = true;
};

const confirmBan = async () => {
  if (!banTarget.value) return;
  banSaving.value = true;
  try {
    const res = await adminBanUser(banTarget.value.id, {
      reason: banReason.value.trim() || undefined,
      days: banDays.value ?? undefined,
    });
    snackbar.success(res.data.message || "Пользователь заблокирован");
    banDialog.value = false;
    loadUsers();
  } catch (err) {
    snackbar.error(errorText(err, "Не удалось заблокировать"));
  } finally {
    banSaving.value = false;
  }
};

const unban = async (u: any) => {
  try {
    await adminUnbanUser(u.id);
    snackbar.success("Пользователь разблокирован");
    loadUsers();
  } catch (err) {
    snackbar.error(errorText(err, "Не удалось разблокировать"));
  }
};

// Удаление
const deleteDialog = ref(false);
const deleteTarget = ref<any>(null);
const deleting = ref(false);

const openDelete = (u: any) => {
  deleteTarget.value = u;
  deleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    await adminDeleteUser(deleteTarget.value.id);
    snackbar.success("Пользователь удалён");
    deleteDialog.value = false;
    loadUsers();
  } catch (err) {
    snackbar.error(errorText(err, "Не удалось удалить"));
  } finally {
    deleting.value = false;
  }
};

// ---------------- Жалобы ----------------
const reports = ref<any[]>([]);
const reportsTotal = ref(0);
const reportsLoading = ref(false);
const reportsPage = ref(1);
const reportsPerPage = 20;
const reportStatus = ref<ReportStatus | "all">("pending");

const reportStatusLabel: Record<string, string> = {
  pending: "Новая",
  reviewed: "Рассмотрена",
  resolved: "Решена",
};
const reportStatusColor: Record<string, string> = {
  pending: "orange",
  reviewed: "blue",
  resolved: "green",
};
const reportStatusFilters = [
  { title: "Новые", value: "pending" },
  { title: "Рассмотренные", value: "reviewed" },
  { title: "Решённые", value: "resolved" },
  { title: "Все", value: "all" },
];

const reportsPages = computed(() =>
  Math.max(1, Math.ceil(reportsTotal.value / reportsPerPage)),
);

const loadReports = async () => {
  reportsLoading.value = true;
  try {
    const res = await adminGetReports({
      page: reportsPage.value,
      limit: reportsPerPage,
      status: reportStatus.value,
    });
    reports.value = res.data.data;
    reportsTotal.value = res.data.meta.total;
  } catch (err) {
    snackbar.error(errorText(err, "Не удалось загрузить жалобы"));
  } finally {
    reportsLoading.value = false;
  }
};

watch(reportStatus, () => {
  reportsPage.value = 1;
  loadReports();
});
watch(reportsPage, loadReports);

const noteDialog = ref(false);
const noteTarget = ref<any>(null);
const noteStatus = ref<ReportStatus>("resolved");
const noteText = ref("");
const noteSaving = ref(false);

const openReportAction = (r: any, status: ReportStatus) => {
  noteTarget.value = r;
  noteStatus.value = status;
  noteText.value = r.adminNote || "";
  noteDialog.value = true;
};

const saveReport = async () => {
  if (!noteTarget.value) return;
  noteSaving.value = true;
  try {
    await adminUpdateReport(noteTarget.value.targetUser.id, noteTarget.value.id, {
      status: noteStatus.value,
      adminNote: noteText.value.trim() || undefined,
    });
    snackbar.success("Жалоба обновлена");
    noteDialog.value = false;
    loadReports();
    loadStats();
  } catch (err) {
    snackbar.error(errorText(err, "Не удалось обновить жалобу"));
  } finally {
    noteSaving.value = false;
  }
};

const banFromReport = (r: any) => {
  openBan(r.targetUser);
  banReason.value = r.reason || "";
};

// ---------------- Загрузка ----------------
// Таблица пользователей грузит себя сама при первом показе (update:options).
const loaded = { reports: false };
watch(tab, (t) => {
  if (t === "reports" && !loaded.reports) {
    loaded.reports = true;
    loadReports();
  }
});

onMounted(loadStats);
</script>

<template>
  <div class="admin">
    <div class="admin__head">
      <div>
        <h1 class="admin__title">Админка</h1>
        <div class="admin__subtitle">
          {{ langStore.user.firstName }}, здесь пользователи, жалобы и статистика
        </div>
      </div>
      <v-btn
        color="primary"
        variant="elevated"
        rounded="lg"
        prepend-icon="mdi-microsoft-excel"
        :loading="exporting"
        @click="downloadXlsx"
      >
        Скачать Excel
      </v-btn>
    </div>

    <v-tabs v-model="tab" color="primary" class="admin__tabs" show-arrows>
      <v-tab value="stats" prepend-icon="mdi-chart-box-outline">Статистика</v-tab>
      <v-tab value="users" prepend-icon="mdi-account-multiple-outline">Пользователи</v-tab>
      <v-tab value="reports" prepend-icon="mdi-alert-octagon-outline">
        Жалобы
        <v-badge
          v-if="stats?.reports?.pending"
          :content="stats.reports.pending"
          color="error"
          inline
        />
      </v-tab>
    </v-tabs>

    <v-window v-model="tab" class="admin__window">
      <!-- Статистика -->
      <v-window-item value="stats">
        <v-progress-linear v-if="statsLoading" indeterminate color="primary" />
        <div class="stats-grid">
          <v-card
            v-for="c in statCards"
            :key="c.title"
            rounded="xl"
            class="stat-card"
            :class="{ 'stat-card--link': !!c.action }"
            @click="c.action?.()"
            :ripple="!!c.action"
          >
            <div class="stat-card__top">
              <span class="stat-card__title">{{ c.title }}</span>
              <v-icon color="primary">{{ c.icon }}</v-icon>
            </div>
            <div class="stat-card__value">{{ c.value.toLocaleString("ru-RU") }}</div>
            <div class="stat-card__sub">{{ c.sub }}</div>
          </v-card>
        </div>


        <v-card v-if="stats?.recentUsers?.length" rounded="xl" class="admin__card">
          <v-card-title class="admin__card-title">Последние регистрации</v-card-title>
          <v-list density="compact">
            <v-list-item
              v-for="u in stats.recentUsers"
              :key="u.id"
              :title="u.username"
              :subtitle="`${roleLabel[u.role] || u.role} · ${fmtDate(u.createdAt, true)}`"
              :to="`/users/${u.id}`"
            />
          </v-list>
        </v-card>
      </v-window-item>

      <!-- Пользователи -->
      <v-window-item value="users">
        <v-card rounded="xl" class="admin__card">
          <div class="filters">
            <v-text-field
              v-model="search"
              placeholder="Имя, логин, телефон или email"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="filters__search"
            />
            <v-btn-toggle
              v-model="roleFilter"
              mandatory
              density="compact"
              color="primary"
              variant="outlined"
              rounded="lg"
            >
              <v-btn value="">Все</v-btn>
              <v-btn value="driver">Водители</v-btn>
              <v-btn value="passenger">Пассажиры</v-btn>
              <v-btn value="admin">Админы</v-btn>
            </v-btn-toggle>
          </div>

          <v-data-table-server
            :headers="userHeaders"
            :items="users"
            :items-length="usersTotal"
            :loading="usersLoading"
            :page="usersPage"
            :items-per-page="usersPerPage"
            :items-per-page-options="[10, 20, 50, 100]"
            item-value="id"
            no-data-text="Никого не нашли"
            loading-text="Загружаем…"
            items-per-page-text="На странице"
            @update:options="onUsersOptions"
          >
            <template #item.name="{ item }">
              <RouterLink :to="`/users/${item.id}`" class="user-cell">
                <span class="user-cell__name">{{ fullName(item) }}</span>
                <span class="user-cell__meta">@{{ item.username }} · {{ item.email }}</span>
              </RouterLink>
            </template>
            <template #item.phone="{ item }">
              <span class="nowrap">{{ item.phone || "—" }}</span>
              <v-icon v-if="item.phoneVerified" size="16" color="green" title="Телефон подтверждён">
                mdi-check-decagram
              </v-icon>
            </template>
            <template #item.role="{ item }">
              {{ roleLabel[item.role] || item.role }}
            </template>
            <template #item.createdAt="{ item }">
              <span class="nowrap">{{ fmtDate(item.createdAt) }}</span>
            </template>
            <template #item.lastSeenAt="{ item }">
              <span class="nowrap">{{ fmtDate(item.lastSeenAt, true) }}</span>
            </template>
            <template #item.status="{ item }">
              <v-chip
                v-if="isBannedNow(item)"
                color="error"
                size="small"
                :title="item.banReason"
              >
                {{ item.bannedUntil ? `Бан до ${fmtDate(item.bannedUntil)}` : "Бан навсегда" }}
              </v-chip>
              <v-chip v-else color="green" size="small" variant="tonal">Активен</v-chip>
            </template>
            <template #item.actions="{ item }">
              <div v-if="item.role !== 'admin'" class="actions">
                <v-btn
                  v-if="isBannedNow(item)"
                  size="small"
                  variant="tonal"
                  color="green"
                  @click="unban(item)"
                >
                  Разбанить
                </v-btn>
                <v-btn
                  v-else
                  size="small"
                  variant="tonal"
                  color="orange-darken-2"
                  @click="openBan(item)"
                >
                  Забанить
                </v-btn>
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  icon="mdi-delete-outline"
                  title="Удалить"
                  @click="openDelete(item)"
                />
              </div>
            </template>
          </v-data-table-server>
        </v-card>
      </v-window-item>

      <!-- Жалобы -->
      <v-window-item value="reports">
        <div class="filters">
          <v-btn-toggle
            v-model="reportStatus"
            mandatory
            density="compact"
            color="primary"
            variant="outlined"
            rounded="lg"
          >
            <v-btn v-for="f in reportStatusFilters" :key="f.value" :value="f.value">
              {{ f.title }}
            </v-btn>
          </v-btn-toggle>
        </div>

        <v-progress-linear v-if="reportsLoading" indeterminate color="primary" />

        <div v-if="!reportsLoading && !reports.length" class="admin__empty">
          Жалоб нет
        </div>

        <v-card v-for="r in reports" :key="r.id" rounded="xl" class="report">
          <div class="report__head">
            <div>
              <RouterLink :to="`/users/${r.targetUser.id}`" class="report__target">
                {{ fullName(r.targetUser) }}
              </RouterLink>
              <span class="report__meta">@{{ r.targetUser.username }} · {{ fmtDate(r.createdAt, true) }}</span>
            </div>
            <v-chip :color="reportStatusColor[r.status]" size="small">
              {{ reportStatusLabel[r.status] || r.status }}
            </v-chip>
          </div>
          <div class="report__reason">{{ r.reason }}</div>
          <div v-if="r.details" class="report__details">{{ r.details }}</div>
          <div class="report__meta">
            Пожаловался:
            <RouterLink :to="`/users/${r.reporterId}`">профиль</RouterLink>
          </div>
          <div v-if="r.adminNote" class="report__note">
            <v-icon size="16">mdi-note-text-outline</v-icon>
            {{ r.adminNote }}
            <span v-if="r.resolvedAt" class="report__meta">· {{ fmtDate(r.resolvedAt, true) }}</span>
          </div>
          <div class="report__actions">
            <v-btn
              v-if="r.status !== 'reviewed'"
              size="small"
              variant="tonal"
              color="blue"
              @click="openReportAction(r, 'reviewed')"
            >
              Рассмотрена
            </v-btn>
            <v-btn
              v-if="r.status !== 'resolved'"
              size="small"
              variant="tonal"
              color="green"
              @click="openReportAction(r, 'resolved')"
            >
              Решена
            </v-btn>
            <v-btn
              size="small"
              variant="tonal"
              color="orange-darken-2"
              @click="banFromReport(r)"
            >
              Забанить
            </v-btn>
          </div>
        </v-card>

        <v-pagination
          v-if="reportsPages > 1"
          v-model="reportsPage"
          :length="reportsPages"
          density="comfortable"
          rounded="lg"
        />
      </v-window-item>
    </v-window>

    <!-- Диалог блокировки -->
    <v-dialog v-model="banDialog" max-width="460">
      <v-card rounded="xl">
        <v-card-title>Заблокировать {{ fullName(banTarget) }}</v-card-title>
        <v-card-text>
          <v-select
            v-model="banDays"
            :items="banPeriods"
            label="Срок"
            variant="outlined"
            density="comfortable"
          />
          <v-textarea
            v-model="banReason"
            label="Причина"
            placeholder="Нарушение правил сервиса"
            variant="outlined"
            rows="3"
            auto-grow
            counter="300"
            maxlength="300"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="banDialog = false">Отмена</v-btn>
          <v-btn color="error" variant="elevated" :loading="banSaving" @click="confirmBan">
            Заблокировать
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог удаления -->
    <v-dialog v-model="deleteDialog" max-width="460">
      <v-card rounded="xl">
        <v-card-title>Удалить пользователя?</v-card-title>
        <v-card-text>
          {{ fullName(deleteTarget) }} (@{{ deleteTarget?.username }}) будет удалён
          вместе со всеми поездками и бронированиями. Отменить это нельзя.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" variant="elevated" :loading="deleting" @click="confirmDelete">
            Удалить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Диалог статуса жалобы -->
    <v-dialog v-model="noteDialog" max-width="460">
      <v-card rounded="xl">
        <v-card-title>
          Отметить как «{{ reportStatusLabel[noteStatus] }}»
        </v-card-title>
        <v-card-text>
          <v-textarea
            v-model="noteText"
            label="Комментарий (необязательно)"
            autofocus
            variant="outlined"
            rows="3"
            auto-grow
            counter="500"
            maxlength="500"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="noteDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="elevated" :loading="noteSaving" @click="saveReport">
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.admin {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px 96px;
}
.admin__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.admin__title {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}
.admin__subtitle {
  color: rgba(0, 0, 0, 0.6);
  margin-top: 4px;
}
.admin__tabs {
  margin-bottom: 16px;
}
.admin__window {
  overflow: visible;
}
.admin__card {
  margin-top: 16px;
}
.admin__card-title {
  font-size: 18px;
  font-weight: 600;
}
.admin__empty {
  text-align: center;
  color: rgba(0, 0, 0, 0.55);
  padding: 48px 0;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
.stat-card {
  padding: 16px 20px;
}
.stat-card--link {
  cursor: pointer;
}
.stat-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.stat-card__title {
  color: rgba(0, 0, 0, 0.6);
  font-size: 14px;
}
.stat-card__value {
  font-size: 32px;
  font-weight: 700;
  margin: 4px 0;
  font-variant-numeric: tabular-nums;
}
.stat-card__sub {
  color: rgba(0, 0, 0, 0.55);
  font-size: 13px;
}
.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  padding: 16px;
}
.filters__search {
  flex: 1 1 260px;
  min-width: 0;
}
.user-cell {
  display: flex;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
  padding: 6px 0;
}
.user-cell__name {
  font-weight: 600;
}
.user-cell__meta {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}
.nowrap {
  white-space: nowrap;
}
.actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  align-items: center;
}
.report {
  padding: 16px 20px;
  margin-bottom: 12px;
}
.report__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.report__target {
  font-weight: 600;
  color: inherit;
  margin-right: 8px;
}
.report__meta {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}
.report__reason {
  font-weight: 600;
  margin-top: 8px;
}
.report__details {
  margin-top: 4px;
  white-space: pre-wrap;
}
.report__note {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  font-size: 14px;
}
.report__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}
</style>

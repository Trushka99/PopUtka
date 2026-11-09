import { computed } from "vue";
import { useLangStore } from "@/stores/langStore";
import { markAsRead, markUnreadAsRead } from "@/api";
import {
  SEAT_FORMS,
  cityName,
  localeOf,
  pluralize,
  shortDate,
} from "@/utils/tripFormat";

export interface AppNotification {
  id: string;
  type: string;
  code?: string;
  params?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  relatedBookingId?: string;
  relatedTripId?: string;
}

export type NotifTone = "wait" | "ok" | "bad" | "info" | "muted";

export interface NotificationView {
  id: string;
  isRead: boolean;
  icon: string;
  tone: NotifTone;
  title: string;
  text: string;
  time: string;
  link: string | Record<string, any> | null;
  raw: AppNotification;
}

// Как показывать уведомление каждого кода с сервера.
// Ключи title/text — строки из termins.json с подстановками {name}.
const BY_CODE: Record<
  string,
  { icon: string; tone: NotifTone; title: string; text: string }
> = {
  NOTIFICATION_BOOKING_REQUEST_TO_DRIVER: {
    icon: "mdi-account-clock-outline",
    tone: "wait",
    title: "ntf_request_driver_title",
    text: "ntf_request_driver_text",
  },
  NOTIFICATION_BOOKING_REQUEST_TO_PASSENGER: {
    icon: "mdi-send-clock-outline",
    tone: "info",
    title: "ntf_request_passenger_title",
    text: "ntf_request_passenger_text",
  },
  NOTIFICATION_BOOKING_CONFIRMED_TO_PASSENGER: {
    icon: "mdi-check-circle-outline",
    tone: "ok",
    title: "ntf_confirmed_title",
    text: "ntf_confirmed_text",
  },
  NOTIFICATION_BOOKING_CONFIRMED_AUTO_TO_PASSENGER: {
    icon: "mdi-check-circle-outline",
    tone: "ok",
    title: "ntf_confirmed_title",
    text: "ntf_confirmed_text",
  },
  NOTIFICATION_BOOKING_CONFIRMED_TO_DRIVER: {
    icon: "mdi-account-check-outline",
    tone: "ok",
    title: "ntf_confirmed_driver_title",
    text: "ntf_route_text",
  },
  NOTIFICATION_BOOKING_CONFIRMED_AUTO_TO_DRIVER: {
    icon: "mdi-account-check-outline",
    tone: "ok",
    title: "ntf_confirmed_driver_title",
    text: "ntf_route_text",
  },
  NOTIFICATION_BOOKING_REJECTED_TO_PASSENGER: {
    icon: "mdi-close-circle-outline",
    tone: "bad",
    title: "ntf_rejected_title",
    text: "ntf_rejected_text",
  },
  NOTIFICATION_BOOKING_CANCELLED_BY_PASSENGER_TO_DRIVER: {
    icon: "mdi-account-cancel-outline",
    tone: "muted",
    title: "ntf_cancelled_driver_title",
    text: "ntf_cancelled_driver_text",
  },
  NOTIFICATION_BOOKING_CANCELLED_BY_PASSENGER_TO_PASSENGER: {
    icon: "mdi-cancel",
    tone: "muted",
    title: "ntf_cancelled_passenger_title",
    text: "ntf_route_text",
  },
  NOTIFICATION_TRIP_COMPLETED_TO_DRIVER: {
    icon: "mdi-flag-checkered",
    tone: "ok",
    title: "trip_completed",
    text: "ntf_trip_completed_text",
  },
  NOTIFICATION_TRIP_COMPLETED_TO_PASSENGER: {
    icon: "mdi-flag-checkered",
    tone: "ok",
    title: "trip_completed",
    text: "ntf_trip_completed_text",
  },
  NOTIFICATION_PAYMENT_SUCCESS: {
    icon: "mdi-credit-card-check-outline",
    tone: "ok",
    title: "ntf_payment_ok_title",
    text: "ntf_route_text",
  },
  NOTIFICATION_PAYMENT_FAILED: {
    icon: "mdi-credit-card-remove-outline",
    tone: "bad",
    title: "ntf_payment_fail_title",
    text: "ntf_route_text",
  },
};

// Запасной вариант по типу, если код неизвестен
const BY_TYPE: Record<string, { icon: string; tone: NotifTone; title: string }> =
  {
    booking_request: { icon: "mdi-account-clock-outline", tone: "wait", title: "book_request" },
    booking_confirmed: { icon: "mdi-check-circle-outline", tone: "ok", title: "booking_confirmed" },
    booking_rejected: { icon: "mdi-close-circle-outline", tone: "bad", title: "booking_rejected" },
    booking_cancelled: { icon: "mdi-cancel", tone: "muted", title: "status_cancelled" },
    trip_completed: { icon: "mdi-flag-checkered", tone: "ok", title: "trip_completed" },
    success: { icon: "mdi-check-circle-outline", tone: "ok", title: "notifications" },
    error: { icon: "mdi-alert-circle-outline", tone: "bad", title: "notifications" },
    info: { icon: "mdi-information-outline", tone: "info", title: "notifications" },
  };

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");

export function useNotifications() {
  const langStore = useLangStore();
  const t = (key: string) => langStore.t(key);

  const all = computed<AppNotification[]>(() =>
    [...((langStore.notifications as AppNotification[]) ?? [])].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );

  const unreadCount = computed(() => all.value.filter((n) => !n.isRead).length);

  // «только что», «5 минут назад», «вчера», дальше — дата
  const relativeTime = (iso: string) => {
    const diffSec = (new Date(iso).getTime() - Date.now()) / 1000;
    const rtf = new Intl.RelativeTimeFormat(localeOf(langStore.currentLang), {
      numeric: "auto",
    });
    const abs = Math.abs(diffSec);
    if (abs < 45) return rtf.format(0, "second");
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
    if (abs < 2 * 86400) return rtf.format(Math.round(diffSec / 86400), "day");
    return shortDate(iso, langStore.currentLang);
  };

  const view = (n: AppNotification): NotificationView => {
    const p = n.params ?? {};
    const seats = Number(p.seats ?? 0);
    const values: Record<string, string> = {
      from: p.from ? cityName({ cityKey: p.from }, (k) => langStore.с(k)) : "",
      to: p.to ? cityName({ cityKey: p.to }, (k) => langStore.с(k)) : "",
      passenger: p.passengerName ?? "",
      driver: p.driverName ?? "",
      seats: seats
        ? `${seats} ${pluralize(langStore.currentLang, seats, SEAT_FORMS)}`
        : "",
      date: p.departureAt ? shortDate(p.departureAt, langStore.currentLang) : "",
    };

    let icon: string;
    let tone: NotifTone;
    let title: string;
    let text: string;

    const byCode = n.code ? BY_CODE[n.code] : undefined;
    if (n.code === "NOTIFICATION_INFO_GENERAL" && p.reason === "driver_cancelled") {
      icon = "mdi-car-off";
      tone = "bad";
      title = t("ntf_driver_cancelled_title");
      text = fill(t("ntf_route_text"), values);
    } else if (byCode) {
      icon = byCode.icon;
      tone = byCode.tone;
      title = t(byCode.title);
      text = fill(t(byCode.text), values);
    } else {
      const byType = BY_TYPE[n.type] ?? BY_TYPE.info;
      icon = byType.icon;
      tone = byType.tone;
      title = t(byType.title);
      text = values.from && values.to ? `${values.from} → ${values.to}` : "";
    }

    // Убираем хвосты от пустых подстановок: « · », «, »
    text = text
      .replace(/\s*·\s*(·\s*)+/g, " · ")
      .replace(/^[\s·,]+|[\s·,]+$/g, "")
      .replace(/\s{2,}/g, " ");

    let link: NotificationView["link"] = null;
    if (n.code?.startsWith("NOTIFICATION_TRIP_COMPLETED")) {
      link = { path: "/users/me", query: { tab: "trips" } };
    } else if (n.relatedBookingId) {
      link = { name: "bookings", params: { id: n.relatedBookingId } };
    }

    return {
      id: n.id,
      isRead: n.isRead,
      icon,
      tone,
      title,
      text,
      time: n.createdAt ? relativeTime(n.createdAt) : "",
      link,
      raw: n,
    };
  };

  const items = computed(() => all.value.map(view));
  const unreadItems = computed(() => items.value.filter((n) => !n.isRead));
  const readItems = computed(() => items.value.filter((n) => n.isRead));

  const markRead = async (n: AppNotification) => {
    if (n.isRead) return;
    n.isRead = true;
    try {
      await markAsRead(n.id);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    const unread = all.value.filter((n) => !n.isRead);
    if (!unread.length) return;
    unread.forEach((n) => (n.isRead = true));
    try {
      await markUnreadAsRead();
    } catch (err) {
      console.error(err);
    }
  };

  const push = (n: AppNotification) => {
    if (all.value.some((x) => x.id === n.id)) return;
    langStore.setNotifications([n, ...((langStore.notifications as any[]) ?? [])]);
  };

  return {
    items,
    unreadItems,
    readItems,
    unreadCount,
    view,
    markRead,
    markAllRead,
    push,
  };
}

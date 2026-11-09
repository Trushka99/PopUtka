// Общие хелперы для плашек поездок / бронирований и страницы профиля.

export const API_ORIGIN = "https://api.pop-utka.uz";

export const mediaUrl = (path?: string | null) =>
  path ? `${API_ORIGIN}${path}` : "";

export const initialsOf = (first?: string | null, last?: string | null) =>
  `${first?.trim()?.[0] ?? ""}${last?.trim()?.[0] ?? ""}`.toUpperCase() || "?";

const LOCALES: Record<string, string> = {
  ru: "ru-RU",
  en: "en-GB",
  uz: "uz-Latn-UZ",
};

export const localeOf = (lang: string) => LOCALES[lang] ?? "ru-RU";

export const capitalize = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

type PluralForms = {
  ru: [string, string, string];
  en: [string, string];
  uz: string;
};

export function pluralize(lang: string, n: number, forms: PluralForms) {
  if (lang === "en") return n === 1 ? forms.en[0] : forms.en[1];
  if (lang === "uz") return forms.uz;
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms.ru[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return forms.ru[1];
  return forms.ru[2];
}

export const SEAT_FORMS: PluralForms = {
  ru: ["место", "места", "мест"],
  en: ["seat", "seats"],
  uz: "o'rin",
};

export const PASSENGER_FORMS: PluralForms = {
  ru: ["пассажир", "пассажира", "пассажиров"],
  en: ["passenger", "passengers"],
  uz: "yo'lovchi",
};

export const TRIP_FORMS: PluralForms = {
  ru: ["поездка", "поездки", "поездок"],
  en: ["trip", "trips"],
  uz: "ta sayohat",
};

export const REVIEW_FORMS: PluralForms = {
  ru: ["отзыв", "отзыва", "отзывов"],
  en: ["review", "reviews"],
  uz: "ta sharh",
};

export const formatPrice = (value?: number | string | null) =>
  Number(value ?? 0).toLocaleString("ru-RU");

export const formatRating = (value?: number | string | null) =>
  Number(value ?? 0).toFixed(1);

export const timeOf = (iso: string | Date) =>
  new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

export const addMinutes = (iso: string | Date, minutes = 0) =>
  new Date(new Date(iso).getTime() + minutes * 60_000);

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** «Сегодня», «Завтра» или «Чт, 13 ноября». */
export function dayLabel(
  iso: string | Date,
  lang: string,
  t: (key: string) => string,
) {
  const d = new Date(iso);
  const diff = Math.round((startOfDay(d) - startOfDay(new Date())) / 864e5);
  if (diff === 0) return t("today");
  if (diff === 1) return t("tomorrow");
  return capitalize(
    d.toLocaleDateString(localeOf(lang), {
      weekday: "short",
      day: "numeric",
      month: "long",
    }),
  );
}

/** «4 ноября», а для прошлых лет — «4 ноября 2025 г.» */
export function shortDate(iso: string | Date, lang: string) {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(localeOf(lang), {
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export const monthLabel = (iso: string | Date, lang: string) =>
  capitalize(
    new Date(iso).toLocaleDateString(localeOf(lang), {
      month: "long",
      year: "numeric",
    }),
  );

/** Название города по ключу; ключи в словаре в нижнем регистре. */
export function cityName(
  loc: { cityKey?: string } | null | undefined,
  translate: (key: string) => string,
) {
  const key = loc?.cityKey;
  if (!key) return "—";
  const direct = translate(key);
  return direct !== key ? direct : translate(key.toLowerCase());
}

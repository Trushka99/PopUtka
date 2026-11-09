export type DayPart = "morning" | "day" | "evening";

export interface TripFilters {
  dayParts: DayPart[];
  minPrice: number | null;
  maxPrice: number | null;
  driverGender: "" | "male" | "female";
  verifiedOnly: boolean;
}

export const emptyFilters = (): TripFilters => ({
  dayParts: [],
  minPrice: null,
  maxPrice: null,
  driverGender: "",
  verifiedOnly: false,
});

/** Утро — до 12:00, день — 12–18, вечер — с 18:00 (по местному времени) */
export const dayPartOf = (iso: string): DayPart => {
  const h = new Date(iso).getHours();
  if (h < 12) return "morning";
  if (h < 18) return "day";
  return "evening";
};

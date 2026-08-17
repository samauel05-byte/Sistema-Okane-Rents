export const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Change to your local currency code if needed (e.g. "USD").
export const CURRENCY = "DOP";

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 2,
  }).format(amount);
}

// Dates are stored as UTC-midnight instants representing a calendar day
// (from <input type="date">), so they must be formatted in UTC too —
// otherwise a negative UTC-offset timezone displays the previous day.
export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-DO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function monthLabel(month: number, year: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

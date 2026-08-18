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

export const CURRENCIES = ["DOP", "USD", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const DEFAULT_CURRENCY: Currency = "DOP";

export const CURRENCY_LABELS: Record<Currency, string> = {
  DOP: "RD$ — Peso dominicano",
  USD: "US$ — Dólar",
  EUR: "€ — Euro",
};

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

export function formatMoney(amount: number, currency: string = DEFAULT_CURRENCY) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

type MoneyItem = { amount: number; currency: string };

/** Sums amounts per currency — summing across currencies would be wrong. */
function sumByCurrency(items: MoneyItem[], sign: 1 | -1 = 1) {
  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(item.currency, (totals.get(item.currency) ?? 0) + sign * item.amount);
  }
  return totals;
}

/** Renders one amount per currency present, e.g. "RD$25,000.00, US$500.00". */
export function formatMoneyByCurrency(items: MoneyItem[]) {
  const totals = sumByCurrency(items);
  if (totals.size === 0) return formatMoney(0);
  return [...totals.entries()]
    .map(([currency, amount]) => formatMoney(amount, currency))
    .join(", ");
}

/** Net (collected − expenses) per currency; only currencies that appear in
 * either list show up, so a currency with only expenses still nets negative. */
export function netByCurrency(collected: MoneyItem[], expenses: MoneyItem[]) {
  const totals = sumByCurrency(collected);
  for (const [currency, amount] of sumByCurrency(expenses, -1)) {
    totals.set(currency, (totals.get(currency) ?? 0) + amount);
  }
  return [...totals.entries()].map(([currency, amount]) => ({ currency, amount }));
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

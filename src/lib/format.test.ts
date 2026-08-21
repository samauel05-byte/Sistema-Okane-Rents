import { describe, expect, it } from "vitest";
import { formatMoney, formatMoneyByCurrency, netByCurrency, monthLabel } from "./format";

describe("formatMoney", () => {
  it("formats DOP by default", () => {
    expect(formatMoney(1000)).toContain("1,000.00");
  });

  it("formats other currencies", () => {
    expect(formatMoney(50, "USD")).toContain("50.00");
  });
});

describe("formatMoneyByCurrency", () => {
  it("shows one amount per currency present", () => {
    const items = [
      { amount: 100, currency: "DOP" },
      { amount: 50, currency: "USD" },
      { amount: 25, currency: "DOP" },
    ];
    const result = formatMoneyByCurrency(items);
    expect(result).toContain("125.00");
    expect(result).toContain("50.00");
  });

  it("returns a zero amount when the list is empty", () => {
    expect(formatMoneyByCurrency([])).toBe(formatMoney(0));
  });
});

describe("netByCurrency", () => {
  it("never sums across different currencies", () => {
    const collected = [{ amount: 100, currency: "DOP" }];
    const expenses = [{ amount: 30, currency: "USD" }];
    const result = netByCurrency(collected, expenses);
    const dop = result.find((r) => r.currency === "DOP");
    const usd = result.find((r) => r.currency === "USD");
    expect(dop?.amount).toBe(100);
    expect(usd?.amount).toBe(-30);
  });

  it("nets collected minus expenses within the same currency", () => {
    const collected = [{ amount: 100, currency: "DOP" }];
    const expenses = [{ amount: 40, currency: "DOP" }];
    const result = netByCurrency(collected, expenses);
    expect(result).toEqual([{ currency: "DOP", amount: 60 }]);
  });
});

describe("monthLabel", () => {
  it("renders the Spanish month name and year", () => {
    expect(monthLabel(8, 2026)).toBe("Agosto 2026");
  });
});

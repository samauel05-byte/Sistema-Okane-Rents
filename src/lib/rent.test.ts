import { describe, expect, it } from "vitest";
import { monthsOverdue } from "./rent";

describe("monthsOverdue", () => {
  const today = new Date(2026, 7, 18); // Aug 18, 2026

  it("is 0 when the current period is already paid", () => {
    const payments = [{ periodMonth: 8, periodYear: 2026 }];
    expect(monthsOverdue(payments, 1, null, today)).toBe(0);
  });

  it("counts back from the current period when nothing is paid", () => {
    // The move-in date is normalized to the 1st of its month, so the
    // move-in month itself still counts as a billable (unpaid) period.
    const moveIn = new Date(2026, 6, 15); // moved in mid-July
    expect(monthsOverdue([], 1, moveIn, today)).toBe(2); // July + August
  });

  it("caps at 24 months when there is no move-in date to stop at", () => {
    expect(monthsOverdue([], 1, null, today)).toBe(24);
  });

  it("treats the current month as not-yet-due before the due day", () => {
    // Due day 25, today is the 18th — this month's rent isn't due yet.
    const payments = [{ periodMonth: 7, periodYear: 2026 }];
    expect(monthsOverdue(payments, 25, null, today)).toBe(0);
  });

  it("counts multiple consecutive unpaid months", () => {
    const payments = [{ periodMonth: 5, periodYear: 2026 }];
    // Unpaid: Jun, Jul, Aug = 3 months.
    expect(monthsOverdue(payments, 1, null, today)).toBe(3);
  });

  it("stops counting before the tenant's move-in month", () => {
    const moveIn = new Date(2026, 6, 10); // moved in mid-July
    // Unpaid Jul + Aug, but nothing before move-in counts.
    expect(monthsOverdue([], 1, moveIn, today)).toBe(2);
  });

  it("defaults the due day to 1 when not configured", () => {
    const payments = [{ periodMonth: 8, periodYear: 2026 }];
    expect(monthsOverdue(payments, null, null, today)).toBe(0);
  });
});

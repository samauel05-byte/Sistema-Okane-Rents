import { describe, expect, it } from "vitest";
import { computeReportFinancials } from "./report";

const base = {
  rentAmount: 1000,
  lateFeePercent: 10,
  managementCommissionPercent: 8,
  rentCollected: 0,
  maintenanceCost: 0,
};

describe("computeReportFinancials", () => {
  it("applies no late fee when rent was collected", () => {
    const r = computeReportFinancials({ ...base, rentCollected: 1000 });
    expect(r.lateFee).toBe(0);
    expect(r.totalIncome).toBe(1000);
  });

  it("applies the late fee only when nothing was collected", () => {
    const r = computeReportFinancials({ ...base, rentCollected: 0 });
    expect(r.lateFee).toBe(100); // 10% of 1000
    expect(r.totalIncome).toBe(100);
  });

  it("computes commission as a percentage of total income", () => {
    const r = computeReportFinancials({ ...base, rentCollected: 1000 });
    expect(r.commissionAmount).toBe(80); // 8% of 1000
  });

  it("treats a missing commission % as 0", () => {
    const r = computeReportFinancials({
      ...base,
      rentCollected: 1000,
      managementCommissionPercent: null,
    });
    expect(r.commissionPercent).toBe(0);
    expect(r.commissionAmount).toBe(0);
  });

  it("nets income minus commission and maintenance costs", () => {
    const r = computeReportFinancials({
      ...base,
      rentCollected: 1000,
      maintenanceCost: 150,
    });
    // 1000 income - 80 commission (8%) - 150 maintenance = 770
    expect(r.netAmount).toBe(770);
  });

  it("never applies a late fee without a configured percentage", () => {
    const r = computeReportFinancials({ ...base, rentCollected: 0, lateFeePercent: null });
    expect(r.lateFee).toBe(0);
  });
});

/** Pure calculation of a single apartment's monthly financial summary —
 * shared by the report page (live view) and the snapshot taken when a
 * payout is marked as remitted, so both use the exact same formula. */
export type ReportFinancials = {
  rentCollected: number;
  lateFee: number;
  totalIncome: number;
  commissionPercent: number;
  commissionAmount: number;
  maintenanceCost: number;
  netAmount: number;
};

export function computeReportFinancials(params: {
  rentAmount: number;
  lateFeePercent: number | null;
  managementCommissionPercent: number | null;
  rentCollected: number;
  maintenanceCost: number;
}): ReportFinancials {
  const { rentAmount, lateFeePercent, managementCommissionPercent, rentCollected, maintenanceCost } =
    params;

  // A late fee (% of rent) applies only when nothing was collected this period.
  const lateFee = rentCollected === 0 && lateFeePercent ? (rentAmount * lateFeePercent) / 100 : 0;
  const totalIncome = rentCollected + lateFee;
  const commissionPercent = managementCommissionPercent ?? 0;
  const commissionAmount = (totalIncome * commissionPercent) / 100;
  const netAmount = totalIncome - commissionAmount - maintenanceCost;

  return {
    rentCollected,
    lateFee,
    totalIncome,
    commissionPercent,
    commissionAmount,
    maintenanceCost,
    netAmount,
  };
}

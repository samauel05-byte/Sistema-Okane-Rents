export const CONTRACT_STATUSES = ["Vigente", "En renovación", "Por vencer"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const PAYOUT_STATUSES = ["PENDIENTE", "REMITIDO"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  PENDIENTE: "Pendiente",
  REMITIDO: "Remitido",
};

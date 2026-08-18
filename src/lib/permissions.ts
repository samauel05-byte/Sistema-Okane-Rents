// Plain data, safe to import from client components — no server-only code.
export const PERMISSIONS = [
  "manageUsers",
  "manageOwners",
  "manageApartments",
  "managePayments",
  "manageExpenses",
  "manageInvoices",
  "viewReports",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  manageUsers: "Administrar usuarios y roles",
  manageOwners: "Crear y eliminar propietarios",
  manageApartments: "Crear/eliminar apartamentos, asignar inquilinos",
  managePayments: "Registrar y eliminar cobros",
  manageExpenses: "Registrar y eliminar eventualidades",
  manageInvoices: "Crear y eliminar facturas/recibos",
  viewReports: "Ver reportes mensuales",
};

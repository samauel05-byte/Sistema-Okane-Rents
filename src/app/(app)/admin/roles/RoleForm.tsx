"use client";

import { PERMISSIONS, PERMISSION_LABELS } from "@/lib/permissions";

export type RoleData = {
  id: string;
  name: string;
  description: string | null;
  scopeAllApartments: boolean;
  manageUsers: boolean;
  manageOwners: boolean;
  manageApartments: boolean;
  managePayments: boolean;
  manageExpenses: boolean;
  viewReports: boolean;
};

export default function RoleForm({
  role,
  action,
  submitLabel,
}: {
  role?: RoleData;
  action: (formData: FormData) => void;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-3">
      {role && <input type="hidden" name="id" value={role.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="name"
          placeholder="Nombre del rol (ej. Gestor de zona norte)"
          defaultValue={role?.name}
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="description"
          placeholder="Descripción (opcional)"
          defaultValue={role?.description ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 rounded-md border border-slate-200 p-3 text-sm">
        <input
          type="checkbox"
          name="scopeAllApartments"
          defaultChecked={role?.scopeAllApartments ?? false}
        />
        Acceso a todos los apartamentos (en vez de solo los asignados por usuario)
      </label>

      <div className="grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-2">
        {PERMISSIONS.map((perm) => (
          <label key={perm} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={perm}
              defaultChecked={role?.[perm] ?? false}
            />
            {PERMISSION_LABELS[perm]}
          </label>
        ))}
      </div>

      <button
        type="submit"
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}

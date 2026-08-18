"use client";

import { useMemo, useState } from "react";

type RoleOption = { id: string; name: string; scopeAllApartments: boolean };
type ApartmentOption = { id: string; label: string; ownerName: string };

export default function UserAccessFields({
  roles,
  apartments,
  defaultRoleId,
  defaultApartmentIds = [],
}: {
  roles: RoleOption[];
  apartments: ApartmentOption[];
  defaultRoleId?: string;
  defaultApartmentIds?: string[];
}) {
  const [roleId, setRoleId] = useState(defaultRoleId ?? roles[0]?.id ?? "");
  const role = useMemo(() => roles.find((r) => r.id === roleId), [roles, roleId]);

  return (
    <>
      <select
        name="roleId"
        required
        value={roleId}
        onChange={(e) => setRoleId(e.target.value)}
        className="w-full min-w-0 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50"
      >
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      {role && !role.scopeAllApartments && (
        <div className="rounded-md border border-slate-800 p-3">
          <p className="mb-2 text-xs font-medium text-slate-300">
            Apartamentos a los que tendrá acceso
          </p>
          {apartments.length === 0 ? (
            <p className="text-xs text-slate-500">No hay apartamentos creados aún.</p>
          ) : (
            <div className="grid max-h-48 gap-1 overflow-y-auto sm:grid-cols-2">
              {apartments.map((apt) => (
                <label key={apt.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="apartmentIds"
                    value={apt.id}
                    defaultChecked={defaultApartmentIds.includes(apt.id)}
                  />
                  {apt.ownerName} — {apt.label}
                </label>
              ))}
            </div>
          )}
        </div>
      )}
      {role && role.scopeAllApartments && (
        <p className="text-xs text-slate-500">
          Este rol tiene acceso a todos los apartamentos.
        </p>
      )}
    </>
  );
}

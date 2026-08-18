import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { monthsOverdue } from "@/lib/rent";
import { CONTRACT_STATUSES } from "@/lib/reportStatus";
import {
  createTenant,
  updateTenant,
  deactivateTenant,
  updateApartmentTerms,
} from "@/app/actions";
import { requireUser, accessibleApartmentIds } from "@/lib/auth";

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function TenantsPage() {
  const user = await requireUser();
  const ids = accessibleApartmentIds(user);
  const canManage = user.role.manageApartments;

  const owners = await prisma.owner.findMany({
    where: ids ? { apartments: { some: { id: { in: ids } } } } : undefined,
    include: {
      apartments: {
        where: ids ? { id: { in: ids } } : undefined,
        include: {
          tenants: { orderBy: { createdAt: "desc" } },
          payments: { select: { periodMonth: true, periodYear: true } },
        },
        orderBy: { label: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inquilinos</h1>
        <p className="text-sm text-slate-400">
          Inquilino activo por apartamento, día de pago, mora, y su historial
          de inquilinos anteriores.
        </p>
      </div>

      {canManage && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-3 font-semibold">Asignar inquilino</h2>
          <form action={createTenant} className="grid gap-3 sm:grid-cols-3">
            <select
              name="apartmentId"
              required
              className="w-full min-w-0 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 sm:col-span-3"
            >
              <option value="">Selecciona apartamento</option>
              {owners.map((owner) => (
                <optgroup key={owner.id} label={owner.name}>
                  {owner.apartments.map((apt) => {
                    const current = apt.tenants.find((t) => t.active);
                    return (
                      <option key={apt.id} value={apt.id}>
                        {apt.label}
                        {current ? ` (reemplaza a ${current.name})` : " (sin inquilino)"}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
            <input
              name="name"
              placeholder="Nombre del inquilino"
              required
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
            <input
              name="phone"
              placeholder="Teléfono"
              required
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
            <input
              name="email"
              type="email"
              placeholder="Correo"
              required
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
            <input
              name="rnc"
              placeholder="RNC/Cédula (opcional)"
              className="rounded-md border border-slate-700 px-3 py-2 text-sm sm:col-span-2"
            />
            <button
              type="submit"
              className="rounded-md bg-[#D2491C] px-3 py-2 text-sm font-medium text-white hover:bg-[#b83d17] sm:col-span-3"
            >
              Guardar
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {owners.length === 0 ? (
          <p className="text-sm text-slate-400">
            Aún no hay apartamentos ni inquilinos registrados.
          </p>
        ) : (
          owners.map((owner) => (
            <div key={owner.id} className="rounded-lg border border-slate-800 bg-slate-900">
              <h2 className="border-b border-slate-800 p-4 font-semibold">
                {owner.name}
              </h2>
              <div className="divide-y divide-slate-800">
                {owner.apartments.map((apt) => {
                  const current = apt.tenants.find((t) => t.active);
                  const previous = apt.tenants.filter((t) => !t.active);
                  const overdue = current
                    ? monthsOverdue(apt.payments, apt.paymentDueDay, current.moveInDate)
                    : 0;
                  const isLate = overdue > 2;

                  return (
                    <div key={apt.id} className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs uppercase text-slate-400">{apt.label}</p>
                          {current ? (
                            <>
                              <p
                                className={`font-medium ${isLate ? "text-rose-400" : ""}`}
                              >
                                {current.name}
                                {isLate && (
                                  <span className="ml-2 rounded bg-rose-900 px-1.5 py-0.5 text-xs font-semibold text-rose-300">
                                    {overdue} meses atrasado
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-slate-400">
                                {[current.phone, current.email, current.rnc]
                                  .filter(Boolean)
                                  .join(" · ") || "Sin datos de contacto"}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-slate-400">— Sin asignar —</p>
                          )}
                          <p className="mt-1 text-xs text-slate-500">
                            {apt.paymentDueDay
                              ? `Vence el día ${apt.paymentDueDay} de cada mes`
                              : "Sin día de pago configurado"}
                            {apt.lateFeePercent ? ` · Mora: ${apt.lateFeePercent}%` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs">
                          {canManage && current && (
                            <details>
                              <summary className="cursor-pointer font-medium text-slate-300">
                                Editar
                              </summary>
                              <form
                                action={updateTenant}
                                className="mt-2 grid w-56 gap-2"
                              >
                                <input type="hidden" name="id" value={current.id} />
                                <input
                                  name="name"
                                  defaultValue={current.name}
                                  required
                                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-50"
                                />
                                <input
                                  name="phone"
                                  defaultValue={current.phone ?? ""}
                                  placeholder="Teléfono"
                                  required
                                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-50"
                                />
                                <input
                                  name="email"
                                  defaultValue={current.email ?? ""}
                                  placeholder="Correo"
                                  required
                                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-50"
                                />
                                <input
                                  name="rnc"
                                  defaultValue={current.rnc ?? ""}
                                  placeholder="RNC/Cédula"
                                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-50"
                                />
                                <label className="text-xs text-slate-400">
                                  Fin de contrato
                                  <input
                                    name="contractEnd"
                                    type="date"
                                    defaultValue={toDateInputValue(current.contractEnd)}
                                    className="mt-1 w-full rounded-md border border-slate-700 px-2 py-1.5 text-sm"
                                  />
                                </label>
                                <select
                                  name="contractStatus"
                                  defaultValue={current.contractStatus ?? ""}
                                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-50"
                                >
                                  <option value="">Estatus del contrato</option>
                                  {CONTRACT_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="submit"
                                  className="rounded-md bg-[#D2491C] px-2 py-1.5 text-xs font-medium text-white hover:bg-[#b83d17]"
                                >
                                  Guardar cambios
                                </button>
                              </form>
                            </details>
                          )}
                          {canManage && (
                            <details>
                              <summary className="cursor-pointer font-medium text-slate-300">
                                Día de pago / mora / comisión
                              </summary>
                              <form
                                action={updateApartmentTerms}
                                className="mt-2 grid w-48 gap-2"
                              >
                                <input type="hidden" name="id" value={apt.id} />
                                <input
                                  name="paymentDueDay"
                                  type="number"
                                  min="1"
                                  max="31"
                                  defaultValue={apt.paymentDueDay ?? ""}
                                  placeholder="Día de pago"
                                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-50"
                                />
                                <input
                                  name="lateFeePercent"
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="10"
                                  defaultValue={apt.lateFeePercent ?? ""}
                                  placeholder="Mora % (máx. 10)"
                                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-50"
                                />
                                <input
                                  name="managementCommissionPercent"
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="30"
                                  defaultValue={apt.managementCommissionPercent ?? ""}
                                  placeholder="Comisión % (máx. 30)"
                                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-50"
                                />
                                <input
                                  name="managerName"
                                  defaultValue={apt.managerName ?? ""}
                                  placeholder="Encargado/a"
                                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-50"
                                />
                                <button
                                  type="submit"
                                  className="rounded-md bg-[#D2491C] px-2 py-1.5 text-xs font-medium text-white hover:bg-[#b83d17]"
                                >
                                  Guardar
                                </button>
                              </form>
                            </details>
                          )}
                          {canManage && current && (
                            <form action={deactivateTenant}>
                              <input type="hidden" name="id" value={current.id} />
                              <button
                                type="submit"
                                className="font-medium text-rose-400 hover:underline"
                              >
                                Quitar inquilino
                              </button>
                            </form>
                          )}
                        </div>
                      </div>

                      {previous.length > 0 && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs font-medium text-slate-400">
                            Inquilinos anteriores ({previous.length})
                          </summary>
                          <ul className="mt-2 space-y-1 text-xs text-slate-400">
                            {previous.map((t) => (
                              <li key={t.id}>
                                {t.name}
                                {t.moveInDate
                                  ? ` — desde ${formatDate(t.moveInDate)}`
                                  : ""}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

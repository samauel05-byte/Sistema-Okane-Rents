import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney, CURRENCIES, CURRENCY_LABELS, DEFAULT_CURRENCY } from "@/lib/format";
import {
  createApartment,
  createTenant,
  deleteApartment,
  deleteOwner,
} from "@/app/actions";
import { requireUser, accessibleApartmentIds } from "@/lib/auth";

export default async function OwnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const ids = accessibleApartmentIds(user);
  const { id } = await params;
  const owner = await prisma.owner.findUnique({
    where: { id },
    include: {
      apartments: {
        where: ids ? { id: { in: ids } } : undefined,
        include: {
          tenants: { where: { active: true } },
        },
        orderBy: { label: "asc" },
      },
    },
  });

  if (!owner) notFound();
  if (ids && owner.apartments.length === 0) notFound();

  const canDeleteOwner = user.role.manageOwners && user.role.scopeAllApartments;
  const canCreateApartment =
    user.role.manageApartments && user.role.scopeAllApartments;
  const canManageApartments = user.role.manageApartments;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/owners" className="text-sm text-slate-400 hover:underline">
            ← Propietarios
          </Link>
          <h1 className="text-2xl font-semibold">{owner.name}</h1>
          <p className="text-sm text-slate-400">
            {[owner.email, owner.phone].filter(Boolean).join(" · ") || "Sin datos de contacto"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canDeleteOwner && (
            <form action={deleteOwner}>
              <input type="hidden" name="id" value={owner.id} />
              <button
                type="submit"
                className="rounded-md border border-rose-800 px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-950"
              >
                Eliminar propietario
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">Apartamentos</h2>
        {owner.apartments.length === 0 ? (
          <p className="text-sm text-slate-400">Este propietario no tiene apartamentos aún.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {owner.apartments.map((apt) => {
              const tenant = apt.tenants[0];
              return (
                <div
                  key={apt.id}
                  className="rounded-lg border border-slate-800 bg-slate-900 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{apt.label}</p>
                      {apt.address && (
                        <p className="text-xs text-slate-400">{apt.address}</p>
                      )}
                    </div>
                    {canManageApartments && (
                      <form action={deleteApartment}>
                        <input type="hidden" name="id" value={apt.id} />
                        <input type="hidden" name="ownerId" value={owner.id} />
                        <button
                          type="submit"
                          className="text-xs text-rose-400 hover:underline"
                        >
                          Eliminar
                        </button>
                      </form>
                    )}
                  </div>
                  <p className="mt-2 text-sm">
                    Renta:{" "}
                    <span className="font-medium">
                      {formatMoney(apt.rentAmount, apt.currency)}
                    </span>
                  </p>
                  <p className="text-sm">
                    Inquilino:{" "}
                    <span className="font-medium">
                      {tenant ? tenant.name : "— sin asignar —"}
                    </span>
                  </p>
                  <Link
                    href={`/reports/${apt.id}`}
                    className="mt-2 inline-block text-xs font-medium text-[#e2703a] hover:underline"
                  >
                    Ver reporte mensual →
                  </Link>

                  {canManageApartments && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-medium text-slate-300">
                        {tenant ? "Cambiar inquilino" : "Asignar inquilino"}
                      </summary>
                      <form action={createTenant} className="mt-2 grid gap-2">
                        <input type="hidden" name="apartmentId" value={apt.id} />
                        <input
                          name="name"
                          placeholder="Nombre del inquilino"
                          required
                          className="rounded-md border border-slate-700 px-2 py-1.5 text-sm"
                        />
                        <input
                          name="phone"
                          placeholder="Teléfono"
                          required
                          className="rounded-md border border-slate-700 px-2 py-1.5 text-sm"
                        />
                        <input
                          name="email"
                          type="email"
                          placeholder="Correo"
                          required
                          className="rounded-md border border-slate-700 px-2 py-1.5 text-sm"
                        />
                        <input
                          name="rnc"
                          placeholder="RNC/Cédula (opcional)"
                          className="rounded-md border border-slate-700 px-2 py-1.5 text-sm"
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {canCreateApartment && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-3 font-semibold">Agregar apartamento</h2>
          <form action={createApartment} className="grid gap-3 sm:grid-cols-4">
            <input type="hidden" name="ownerId" value={owner.id} />
            <input
              name="label"
              placeholder="Identificador (ej. Apto 2B)"
              required
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
            <input
              name="address"
              placeholder="Dirección (opcional)"
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
            <input
              name="rentAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="Renta mensual"
              required
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
            <select
              name="currency"
              defaultValue={DEFAULT_CURRENCY}
              className="w-full min-w-0 rounded-md border border-slate-700 px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABELS[c]}
                </option>
              ))}
            </select>
            <input
              name="paymentDueDay"
              type="number"
              min="1"
              max="31"
              placeholder="Día de pago (opcional, 1-31)"
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
            <input
              name="lateFeePercent"
              type="number"
              step="0.1"
              min="0"
              max="10"
              placeholder="Mora % (opcional, máx. 10)"
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
            <input
              name="managementCommissionPercent"
              type="number"
              step="0.1"
              min="0"
              max="30"
              placeholder="Comisión de gestión % (opcional, máx. 30)"
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
            <input
              name="managerName"
              placeholder="Encargado/a (opcional)"
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-[#D2491C] px-3 py-2 text-sm font-medium text-white hover:bg-[#b83d17] sm:col-span-4"
            >
              Guardar apartamento
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

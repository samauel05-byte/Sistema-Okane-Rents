import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createOwner } from "@/app/actions";
import { requireUser, accessibleApartmentIds } from "@/lib/auth";

export default async function OwnersPage() {
  const user = await requireUser();
  const ids = accessibleApartmentIds(user);
  const canCreateOwner = user.role.manageOwners && user.role.scopeAllApartments;

  const owners = await prisma.owner.findMany({
    where: ids ? { apartments: { some: { id: { in: ids } } } } : undefined,
    include: {
      apartments: ids ? { where: { id: { in: ids } } } : true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Propietarios</h1>

      <div className="rounded-lg border border-slate-800 bg-slate-900">
        {owners.length === 0 ? (
          <p className="p-4 text-sm text-slate-400">No hay propietarios todavía.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {owners.map((owner) => (
              <li key={owner.id} className="flex items-center justify-between p-4">
                <div>
                  <Link
                    href={`/owners/${owner.id}`}
                    className="font-medium text-slate-50 hover:underline"
                  >
                    {owner.name}
                  </Link>
                  <p className="text-xs text-slate-400">
                    {owner.apartments.length} apartamento(s)
                    {owner.email ? ` · ${owner.email}` : ""}
                    {owner.phone ? ` · ${owner.phone}` : ""}
                  </p>
                </div>
                <Link
                  href={`/owners/${owner.id}`}
                  className="text-sm font-medium text-slate-300 hover:text-slate-50"
                >
                  Administrar →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canCreateOwner && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-3 font-semibold">Agregar propietario</h2>
          <form action={createOwner} className="grid gap-3 sm:grid-cols-3">
            <input
              name="name"
              placeholder="Nombre"
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
              name="phone"
              placeholder="Teléfono"
              required
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
            <input
              name="rnc"
              placeholder="RNC/Cédula (opcional)"
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="sm:col-span-3 rounded-md bg-[#D2491C] px-3 py-2 text-sm font-medium text-white hover:bg-[#b83d17]"
            >
              Guardar propietario
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

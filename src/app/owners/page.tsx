import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createOwner } from "@/app/actions";

export default async function OwnersPage() {
  const owners = await prisma.owner.findMany({
    include: { apartments: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dueños</h1>

      <div className="rounded-lg border border-slate-200 bg-white">
        {owners.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No hay dueños todavía.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {owners.map((owner) => (
              <li key={owner.id} className="flex items-center justify-between p-4">
                <div>
                  <Link
                    href={`/owners/${owner.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {owner.name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {owner.apartments.length} apartamento(s)
                    {owner.email ? ` · ${owner.email}` : ""}
                    {owner.phone ? ` · ${owner.phone}` : ""}
                  </p>
                </div>
                <Link
                  href={`/owners/${owner.id}`}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Administrar →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Agregar dueño</h2>
        <form action={createOwner} className="grid gap-3 sm:grid-cols-3">
          <input
            name="name"
            placeholder="Nombre"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="email"
            type="email"
            placeholder="Correo (opcional)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="phone"
            placeholder="Teléfono (opcional)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="sm:col-span-3 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Guardar dueño
          </button>
        </form>
      </div>
    </div>
  );
}

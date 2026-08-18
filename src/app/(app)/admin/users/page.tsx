import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createUser, setUserActive } from "./actions";
import UserAccessFields from "./UserAccessFields";

export default async function UsersAdminPage() {
  const currentUser = await requireUser();

  const [users, roles, apartments] = await Promise.all([
    prisma.user.findMany({
      include: { role: true, apartmentAccess: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.apartment.findMany({
      include: { owner: true },
      orderBy: [{ owner: { name: "asc" } }, { label: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-900">
        {users.length === 0 ? (
          <p className="p-4 text-sm text-slate-400">No hay usuarios todavía.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-medium">
                    {u.name}{" "}
                    <span className="font-normal text-slate-500">@{u.username}</span>
                    {!u.active && (
                      <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">
                        Inactivo
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">
                    {u.role.name}
                    {!u.role.scopeAllApartments &&
                      ` · ${u.apartmentAccess.length} apartamento(s) asignado(s)`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="text-sm font-medium text-slate-300 hover:text-slate-50"
                  >
                    Editar
                  </Link>
                  {u.id !== currentUser.id && (
                    <form action={setUserActive}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="active" value={(!u.active).toString()} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-slate-300 hover:text-slate-50"
                      >
                        {u.active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-3 font-semibold">Crear usuario</h2>
        {roles.length === 0 ? (
          <p className="text-sm text-slate-400">
            Primero crea un rol en la pestaña{" "}
            <Link href="/admin/roles" className="underline">
              Roles
            </Link>
            .
          </p>
        ) : (
          <form action={createUser} className="grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              placeholder="Nombre completo"
              required
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
            <input
              name="username"
              placeholder="Usuario"
              required
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
            <input
              name="password"
              type="password"
              placeholder="Contraseña (mínimo 6 caracteres)"
              required
              minLength={6}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm sm:col-span-2"
            />
            <div className="grid gap-3 sm:col-span-2">
              <UserAccessFields
                roles={roles}
                apartments={apartments.map((a) => ({
                  id: a.id,
                  label: a.label,
                  ownerName: a.owner.name,
                }))}
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-[#D2491C] px-3 py-2 text-sm font-medium text-white hover:bg-[#b83d17] sm:col-span-2"
            >
              Crear usuario
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

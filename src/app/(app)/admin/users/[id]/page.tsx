import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateUserAccess, resetPassword } from "../actions";
import UserAccessFields from "../UserAccessFields";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user, roles, apartments] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: { role: true, apartmentAccess: true },
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.apartment.findMany({
      include: { owner: true },
      orderBy: [{ owner: { name: "asc" } }, { label: "asc" }],
    }),
  ]);

  if (!user) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="text-sm text-slate-500 hover:underline">
        ← Usuarios
      </Link>
      <h2 className="text-xl font-semibold">
        {user.name} <span className="font-normal text-slate-400">@{user.username}</span>
      </h2>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 font-semibold">Rol y acceso</h3>
        <form action={updateUserAccess} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="userId" value={user.id} />
          <input
            name="name"
            defaultValue={user.name}
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <div className="grid gap-3 sm:col-span-2">
            <UserAccessFields
              roles={roles}
              apartments={apartments.map((a) => ({
                id: a.id,
                label: a.label,
                ownerName: a.owner.name,
              }))}
              defaultRoleId={user.roleId}
              defaultApartmentIds={user.apartmentAccess.map((a) => a.apartmentId)}
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 sm:col-span-2"
          >
            Guardar cambios
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 font-semibold">Restablecer contraseña</h3>
        <form action={resetPassword} className="flex flex-wrap gap-3">
          <input type="hidden" name="userId" value={user.id} />
          <input
            name="password"
            type="password"
            placeholder="Nueva contraseña (mínimo 6 caracteres)"
            required
            minLength={6}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100"
          >
            Actualizar contraseña
          </button>
        </form>
      </div>
    </div>
  );
}

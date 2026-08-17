import { prisma } from "@/lib/prisma";
import { createRole, updateRole, deleteRole } from "./actions";
import RoleForm from "./RoleForm";

export default async function RolesAdminPage() {
  const roles = await prisma.role.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Los roles definen qué puede hacer cada usuario y si ve todos los
        apartamentos o solo los que se le asignen. Puedes crear tantos
        perfiles como necesites.
      </p>

      <div className="space-y-4">
        {roles.map((role) => (
          <details
            key={role.id}
            className="rounded-lg border border-slate-200 bg-white"
          >
            <summary className="flex cursor-pointer items-center justify-between p-4">
              <div>
                <span className="font-medium">{role.name}</span>
                <span className="ml-2 text-xs text-slate-400">
                  {role._count.users} usuario(s)
                </span>
                {role.description && (
                  <p className="text-xs text-slate-500">{role.description}</p>
                )}
              </div>
            </summary>
            <div className="border-t border-slate-100 p-4">
              <RoleForm role={role} action={updateRole} submitLabel="Guardar cambios" />
              {role._count.users === 0 && (
                <form action={deleteRole} className="mt-3">
                  <input type="hidden" name="id" value={role.id} />
                  <button
                    type="submit"
                    className="text-sm font-medium text-rose-600 hover:underline"
                  >
                    Eliminar rol
                  </button>
                </form>
              )}
            </div>
          </details>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Crear rol</h2>
        <RoleForm action={createRole} submitLabel="Crear rol" />
      </div>
    </div>
  );
}

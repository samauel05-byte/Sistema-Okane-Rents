import Link from "next/link";
import { requireUser, requirePagePermission } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  requirePagePermission(user, "manageUsers");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Administración</h1>
        <nav className="mt-3 flex gap-4 border-b border-slate-200 text-sm font-medium text-slate-600">
          <Link href="/admin/users" className="border-b-2 border-transparent px-1 pb-2 hover:text-slate-900">
            Usuarios
          </Link>
          <Link href="/admin/roles" className="border-b-2 border-transparent px-1 pb-2 hover:text-slate-900">
            Roles
          </Link>
          <Link href="/admin/business" className="border-b-2 border-transparent px-1 pb-2 hover:text-slate-900">
            Negocio
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}

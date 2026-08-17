import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import Logo from "@/app/Logo";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const navItems = [
    { href: "/", label: "Inicio" },
    { href: "/owners", label: "Dueños" },
    { href: "/payments", label: "Cobros" },
    { href: "/expenses", label: "Gastos" },
    { href: "/invoices", label: "Facturas" },
    ...(user.role.manageUsers
      ? [{ href: "/admin/users", label: "Usuarios" }]
      : []),
  ];

  return (
    <>
      <header className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="-mx-2 flex flex-wrap gap-1 text-sm font-medium text-slate-600 sm:gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded px-2 py-1 hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="hidden sm:inline">
              {user.name} · <span className="text-slate-400">{user.role.name}</span>
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded px-2 py-1 font-medium hover:bg-slate-100 hover:text-slate-900"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}

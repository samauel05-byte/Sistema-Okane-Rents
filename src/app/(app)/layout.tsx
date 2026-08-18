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
    { href: "/tenants", label: "Inquilinos" },
    { href: "/payments", label: "Cobros" },
    { href: "/expenses", label: "Gastos" },
    { href: "/invoices", label: "Facturas" },
    ...(user.role.manageUsers
      ? [{ href: "/admin/users", label: "Usuarios" }]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <aside className="hidden shrink-0 flex-col border-r border-slate-200 bg-white sm:flex sm:w-56 print:hidden">
        <div className="border-b border-slate-100 px-4 py-4">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3 text-sm font-medium text-slate-600">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-2 hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-4 text-sm text-slate-600">
          <p className="mb-2">
            {user.name} · <span className="text-slate-400">{user.role.name}</span>
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded px-2 py-1.5 text-left font-medium hover:bg-slate-100 hover:text-slate-900"
            >
              Salir
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white sm:hidden print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
            <Link href="/">
              <Logo />
            </Link>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>{user.name}</span>
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
          <nav className="-mx-2 flex flex-wrap gap-1 border-t border-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
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
        </header>

        <main className="mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import Logo from "@/app/Logo";
import SidebarNav from "./SidebarNav";
import {
  IconGrid,
  IconUsers,
  IconUserCheck,
  IconCreditCard,
  IconReceipt,
  IconFileText,
  IconSettings,
} from "@/components/icons";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const iconClass = "h-[18px] w-[18px] shrink-0";
  const navGroups = [
    {
      title: "Principal",
      items: [{ href: "/", label: "Inicio", icon: <IconGrid className={iconClass} /> }],
    },
    {
      title: "Gestión",
      items: [
        { href: "/owners", label: "Propietarios", icon: <IconUsers className={iconClass} /> },
        { href: "/tenants", label: "Inquilinos", icon: <IconUserCheck className={iconClass} /> },
        { href: "/payments", label: "Cobros", icon: <IconCreditCard className={iconClass} /> },
        { href: "/expenses", label: "Eventualidades", icon: <IconReceipt className={iconClass} /> },
        { href: "/invoices", label: "Facturas", icon: <IconFileText className={iconClass} /> },
      ],
    },
    ...(user.role.manageUsers
      ? [
          {
            title: "Administración",
            items: [
              { href: "/admin/users", label: "Usuarios", icon: <IconSettings className={iconClass} /> },
            ],
          },
        ]
      : []),
  ];
  const flatNavItems = navGroups.flatMap((g) => g.items);

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <aside className="hidden shrink-0 flex-col bg-slate-900 sm:flex sm:w-60 print:hidden">
        <div className="border-b border-white/10 px-4 py-4">
          <Link href="/">
            <Logo dark />
          </Link>
        </div>
        <SidebarNav groups={navGroups} />
        <div className="border-t border-white/10 p-4 text-sm text-slate-300">
          <p className="mb-2 truncate">
            {user.name} · <span className="text-slate-500">{user.role.name}</span>
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded px-2 py-1.5 text-left font-medium hover:bg-slate-800 hover:text-white"
            >
              Salir
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-800 bg-slate-900 sm:hidden print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
            <Link href="/">
              <Logo dark />
            </Link>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span>{user.name}</span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded px-2 py-1 font-medium hover:bg-slate-800 hover:text-white"
                >
                  Salir
                </button>
              </form>
            </div>
          </div>
          <nav className="grid grid-cols-2 gap-2 border-t border-slate-800 px-4 py-3 text-sm font-medium text-slate-300">
            {flatNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-3 py-2.5 hover:bg-slate-800 hover:text-white"
              >
                {item.icon}
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

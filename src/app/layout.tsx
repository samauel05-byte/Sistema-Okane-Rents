import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Okane · Cobros y Reportes",
  description: "Gestión de cobros a inquilinos y reportes mensuales a dueños",
};

const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/owners", label: "Dueños" },
  { href: "/payments", label: "Cobros" },
  { href: "/expenses", label: "Gastos" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white print:hidden">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-semibold text-slate-900">
              Okane
            </Link>
            <nav className="flex gap-4 text-sm font-medium text-slate-600">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded px-2 py-1 hover:bg-slate-100 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}

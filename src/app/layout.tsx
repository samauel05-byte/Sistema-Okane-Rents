import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Okane · Cobros y Reportes",
  description: "Gestión de cobros a inquilinos y reportes mensuales a propietarios",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50">
        {children}
      </body>
    </html>
  );
}

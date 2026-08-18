import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatMoneyByCurrency, netByCurrency, monthLabel } from "@/lib/format";
import { requireUser, accessibleApartmentIds } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireUser();
  const ids = accessibleApartmentIds(user);
  const now = new Date();
  const periodMonth = now.getMonth() + 1;
  const periodYear = now.getFullYear();

  const owners = await prisma.owner.findMany({
    where: ids ? { apartments: { some: { id: { in: ids } } } } : undefined,
    include: {
      apartments: {
        where: ids ? { id: { in: ids } } : undefined,
        include: {
          payments: { where: { periodMonth, periodYear } },
        },
      },
      expenses: {
        where: {
          periodMonth,
          periodYear,
          ...(ids ? { OR: [{ apartmentId: { in: ids } }, { apartmentId: null }] } : {}),
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inicio</h1>
          <p className="text-sm text-slate-500">
            Resumen de {monthLabel(periodMonth, periodYear)}
          </p>
        </div>
        <Link
          href="/owners"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Gestionar dueños
        </Link>
      </div>

      {owners.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Aún no hay dueños registrados.{" "}
          <Link href="/owners" className="font-medium text-slate-900 underline">
            Agrega el primero
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {owners.map((owner) => {
            const payments = owner.apartments.flatMap((apt) => apt.payments);
            const netGroups = netByCurrency(payments, owner.expenses);
            return (
              <div
                key={owner.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{owner.name}</h2>
                  <span className="text-xs text-slate-500">
                    {owner.apartments.length} apto(s)
                  </span>
                </div>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Cobrado</dt>
                    <dd>{formatMoneyByCurrency(payments)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Gastos por su cuenta</dt>
                    <dd className="text-rose-600">
                      {owner.expenses.length > 0
                        ? `- ${formatMoneyByCurrency(owner.expenses)}`
                        : formatMoney(0)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1 font-semibold">
                    <dt>Neto a pagarle</dt>
                    <dd className="text-right">
                      {netGroups.length === 0
                        ? formatMoney(0)
                        : netGroups.map((g) => (
                            <span key={g.currency} className="block">
                              {formatMoney(g.amount, g.currency)}
                            </span>
                          ))}
                    </dd>
                  </div>
                </dl>
                <Link
                  href={`/reports/${owner.id}?month=${periodMonth}&year=${periodYear}`}
                  className="mt-3 inline-block text-sm font-medium text-slate-900 underline"
                >
                  Ver reporte mensual →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

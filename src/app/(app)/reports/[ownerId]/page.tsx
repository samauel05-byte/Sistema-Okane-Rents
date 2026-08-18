import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  formatDate,
  formatMoney,
  formatMoneyByCurrency,
  netByCurrency,
  monthLabel,
} from "@/lib/format";
import { requireUser, accessibleApartmentIds } from "@/lib/auth";
import PrintButton from "@/components/PrintButton";

function shiftMonth(month: number, year: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export default async function OwnerReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const user = await requireUser();
  const ids = accessibleApartmentIds(user);
  const { ownerId } = await params;
  const sp = await searchParams;
  const now = new Date();
  const periodMonth = Number(sp?.month) || now.getMonth() + 1;
  const periodYear = Number(sp?.year) || now.getFullYear();

  const owner = await prisma.owner.findUnique({
    where: { id: ownerId },
    include: {
      apartments: {
        where: ids ? { id: { in: ids } } : undefined,
        include: {
          tenants: { where: { active: true } },
          payments: { where: { periodMonth, periodYear } },
        },
        orderBy: { label: "asc" },
      },
      expenses: {
        where: {
          periodMonth,
          periodYear,
          ...(ids ? { OR: [{ apartmentId: { in: ids } }, { apartmentId: null }] } : {}),
        },
        include: { apartment: true },
        orderBy: { incurredOn: "asc" },
      },
    },
  });

  if (!owner) notFound();
  if (ids && owner.apartments.length === 0) notFound();

  const allPayments = owner.apartments.flatMap((apt) => apt.payments);

  // A late fee (% of rent) applies to apartments left unpaid this period.
  const lateFees = owner.apartments.flatMap((apt) => {
    const collected = apt.payments.reduce((s, p) => s + p.amount, 0);
    if (collected > 0 || !apt.lateFeePercent) return [];
    return [{ amount: (apt.rentAmount * apt.lateFeePercent) / 100, currency: apt.currency }];
  });

  const netGroups = netByCurrency([...allPayments, ...lateFees], owner.expenses);

  const prev = shiftMonth(periodMonth, periodYear, -1);
  const next = shiftMonth(periodMonth, periodYear, 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 no-print sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/owners/${owner.id}`}
          className="text-sm text-slate-500 hover:underline"
        >
          ← {owner.name}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/reports/${owner.id}?month=${prev.month}&year=${prev.year}`}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100"
          >
            ← Anterior
          </Link>
          <Link
            href={`/reports/${owner.id}?month=${next.month}&year=${next.year}`}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100"
          >
            Siguiente →
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Reporte mensual</h1>
            <p className="text-sm text-slate-500">
              {monthLabel(periodMonth, periodYear)}
            </p>
            {ids && (
              <p className="mt-1 text-xs text-slate-400 no-print">
                Mostrando solo los apartamentos asignados a tu usuario.
              </p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="font-medium">{owner.name}</p>
            <p className="text-sm text-slate-500">
              {[owner.email, owner.phone].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <h2 className="mb-2 font-semibold">Cobros por apartamento</h2>
        <div className="mb-6 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Apartamento</th>
                <th className="py-2">Inquilino</th>
                <th className="py-2 text-right">Renta mensual</th>
                <th className="py-2 text-right">Cobrado en el mes</th>
                <th className="py-2 text-right">Mora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {owner.apartments.map((apt) => {
                const collected = apt.payments.reduce((s, p) => s + p.amount, 0);
                const tenant = apt.tenants[0];
                const lateFee =
                  collected === 0 && apt.lateFeePercent
                    ? (apt.rentAmount * apt.lateFeePercent) / 100
                    : 0;
                return (
                  <tr key={apt.id}>
                    <td className="py-2">{apt.label}</td>
                    <td className="py-2">{tenant?.name ?? "— sin asignar —"}</td>
                    <td className="py-2 text-right">
                      {formatMoney(apt.rentAmount, apt.currency)}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {collected > 0 ? (
                        formatMoney(collected, apt.currency)
                      ) : (
                        <span className="text-rose-500">Sin cobrar</span>
                      )}
                    </td>
                    <td className="py-2 text-right text-rose-600">
                      {lateFee > 0
                        ? `+${formatMoney(lateFee, apt.currency)} (${apt.lateFeePercent}%)`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 font-semibold">
                <td className="py-2" colSpan={3}>
                  Total cobrado
                </td>
                <td className="py-2 text-right">{formatMoneyByCurrency(allPayments)}</td>
                <td className="py-2 text-right text-rose-600">
                  {lateFees.length > 0 ? `+${formatMoneyByCurrency(lateFees)}` : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <h2 className="mb-2 font-semibold">
          Gastos pagados en representación del dueño
        </h2>
        {owner.expenses.length === 0 ? (
          <p className="mb-6 text-sm text-slate-500">
            No hubo gastos este mes.
          </p>
        ) : (
          <div className="mb-6 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Apartamento</th>
                  <th className="py-2">Descripción</th>
                  <th className="py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {owner.expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2">{formatDate(e.incurredOn)}</td>
                    <td className="py-2">{e.apartment?.label ?? "General"}</td>
                    <td className="py-2">{e.description}</td>
                    <td className="py-2 text-right text-rose-600">
                      -{formatMoney(e.amount, e.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 font-semibold">
                  <td className="py-2" colSpan={3}>
                    Total gastos
                  </td>
                  <td className="py-2 text-right text-rose-600">
                    -{formatMoneyByCurrency(owner.expenses)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-1 rounded-md bg-slate-900 px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <span className="font-medium">Monto neto a pagarle al dueño</span>
          <span className="text-right text-lg font-semibold">
            {netGroups.length === 0
              ? formatMoney(0)
              : netGroups.map((g) => (
                  <span key={g.currency} className="block">
                    {formatMoney(g.amount, g.currency)}
                  </span>
                ))}
          </span>
        </div>
      </div>
    </div>
  );
}

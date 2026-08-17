import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney, monthLabel } from "@/lib/format";
import PrintButton from "../PrintButton";

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
  const { ownerId } = await params;
  const sp = await searchParams;
  const now = new Date();
  const periodMonth = Number(sp?.month) || now.getMonth() + 1;
  const periodYear = Number(sp?.year) || now.getFullYear();

  const owner = await prisma.owner.findUnique({
    where: { id: ownerId },
    include: {
      apartments: {
        include: {
          tenants: { where: { active: true } },
          payments: { where: { periodMonth, periodYear } },
        },
        orderBy: { label: "asc" },
      },
      expenses: {
        where: { periodMonth, periodYear },
        include: { apartment: true },
        orderBy: { incurredOn: "asc" },
      },
    },
  });

  if (!owner) notFound();

  const totalCollected = owner.apartments.reduce(
    (sum, apt) => sum + apt.payments.reduce((s, p) => s + p.amount, 0),
    0
  );
  const totalExpenses = owner.expenses.reduce((sum, e) => sum + e.amount, 0);
  const netToOwner = totalCollected - totalExpenses;

  const prev = shiftMonth(periodMonth, periodYear, -1);
  const next = shiftMonth(periodMonth, periodYear, 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <Link
          href={`/owners/${owner.id}`}
          className="text-sm text-slate-500 hover:underline"
        >
          ← {owner.name}
        </Link>
        <div className="flex items-center gap-3">
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

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-6 flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl font-semibold">Reporte mensual</h1>
            <p className="text-sm text-slate-500">
              {monthLabel(periodMonth, periodYear)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium">{owner.name}</p>
            <p className="text-sm text-slate-500">
              {[owner.email, owner.phone].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <h2 className="mb-2 font-semibold">Cobros por apartamento</h2>
        <table className="mb-6 w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Apartamento</th>
              <th className="py-2">Inquilino</th>
              <th className="py-2 text-right">Renta mensual</th>
              <th className="py-2 text-right">Cobrado en el mes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {owner.apartments.map((apt) => {
              const collected = apt.payments.reduce((s, p) => s + p.amount, 0);
              const tenant = apt.tenants[0];
              return (
                <tr key={apt.id}>
                  <td className="py-2">{apt.label}</td>
                  <td className="py-2">{tenant?.name ?? "— sin asignar —"}</td>
                  <td className="py-2 text-right">{formatMoney(apt.rentAmount)}</td>
                  <td className="py-2 text-right font-medium">
                    {collected > 0 ? (
                      formatMoney(collected)
                    ) : (
                      <span className="text-rose-500">Sin cobrar</span>
                    )}
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
              <td className="py-2 text-right">{formatMoney(totalCollected)}</td>
            </tr>
          </tfoot>
        </table>

        <h2 className="mb-2 font-semibold">
          Gastos pagados en representación del dueño
        </h2>
        {owner.expenses.length === 0 ? (
          <p className="mb-6 text-sm text-slate-500">
            No hubo gastos este mes.
          </p>
        ) : (
          <table className="mb-6 w-full text-sm">
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
                    -{formatMoney(e.amount)}
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
                  -{formatMoney(totalExpenses)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}

        <div className="flex items-center justify-between rounded-md bg-slate-900 px-4 py-3 text-white">
          <span className="font-medium">Monto neto a pagarle al dueño</span>
          <span className="text-lg font-semibold">{formatMoney(netToOwner)}</span>
        </div>
      </div>
    </div>
  );
}

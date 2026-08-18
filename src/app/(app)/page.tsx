import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  formatMoney,
  formatMoneyByCurrency,
  netByCurrency,
  monthLabel,
  DEFAULT_CURRENCY,
  MONTH_NAMES,
} from "@/lib/format";
import { monthsOverdue } from "@/lib/rent";
import { requireUser, accessibleApartmentIds } from "@/lib/auth";
import MonthlyBarChart from "@/components/MonthlyBarChart";

function lastMonths(count: number, refMonth: number, refYear: number) {
  const months: { month: number; year: number }[] = [];
  let m = refMonth;
  let y = refYear;
  for (let i = 0; i < count; i++) {
    months.unshift({ month: m, year: y });
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return months;
}

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
          tenants: { where: { active: true } },
          payments: {
            select: { amount: true, currency: true, periodMonth: true, periodYear: true },
          },
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

  const apartments = owners.flatMap((owner) =>
    owner.apartments.map((apt) => ({ ...apt, ownerName: owner.name, ownerId: owner.id }))
  );

  const thisMonthPayments = apartments.flatMap((apt) =>
    apt.payments.filter((p) => p.periodMonth === periodMonth && p.periodYear === periodYear)
  );
  const allExpenses = owners.flatMap((o) => o.expenses);
  const netGroups = netByCurrency(thisMonthPayments, allExpenses);

  const chartMonths = lastMonths(6, periodMonth, periodYear);
  const chartMonthFilter = chartMonths.map(({ month, year }) => ({
    periodMonth: month,
    periodYear: year,
  }));

  const chartPayments = await prisma.payment.findMany({
    where: {
      currency: DEFAULT_CURRENCY,
      OR: chartMonthFilter,
      ...(ids ? { apartmentId: { in: ids } } : {}),
    },
    select: { amount: true, periodMonth: true, periodYear: true },
  });

  // Expected monthly rent (occupied apartments, DOP only) — used to show
  // what's still pending to collect each month rather than expenses.
  const expectedMonthlyRentDOP = apartments
    .filter((apt) => apt.currency === DEFAULT_CURRENCY && apt.tenants.length > 0)
    .reduce((s, apt) => s + apt.rentAmount, 0);

  const chartData = chartMonths.map(({ month, year }) => {
    const collected = chartPayments
      .filter((p) => p.periodMonth === month && p.periodYear === year)
      .reduce((s, p) => s + p.amount, 0);
    return {
      label: `${MONTH_NAMES[month - 1].slice(0, 3)} ${String(year).slice(2)}`,
      collected,
      pending: Math.max(0, expectedMonthlyRentDOP - collected),
    };
  });

  const vacantApartments = apartments.filter((apt) => apt.tenants.length === 0);

  const lateTenants = apartments
    .filter((apt) => apt.tenants[0])
    .map((apt) => {
      const tenant = apt.tenants[0];
      const overdue = monthsOverdue(apt.payments, apt.paymentDueDay, tenant.moveInDate);
      const lateFee = apt.lateFeePercent ? (apt.rentAmount * apt.lateFeePercent) / 100 : 0;
      return { apt, tenant, overdue, lateFee };
    })
    .filter((t) => t.overdue > 2)
    .sort((a, b) => b.overdue - a.overdue);

  const lateFeeTotals = lateTenants
    .filter((t) => t.lateFee > 0)
    .map((t) => ({ amount: t.lateFee, currency: t.apt.currency }));

  const stats = [
    { label: "Cobrado este mes", value: formatMoneyByCurrency(thisMonthPayments) },
    {
      label: "Eventualidades este mes",
      value: allExpenses.length > 0 ? formatMoneyByCurrency(allExpenses) : formatMoney(0),
    },
    {
      label: "Neto a pagar",
      value:
        netGroups.length === 0
          ? formatMoney(0)
          : netGroups.map((g) => formatMoney(g.amount, g.currency)).join(", "),
    },
    { label: "Apartamentos", value: String(apartments.length) },
    { label: "Disponibles", value: String(vacantApartments.length) },
    {
      label: "Inquilinos en mora",
      value: `${lateTenants.length} · ${
        lateFeeTotals.length > 0 ? formatMoneyByCurrency(lateFeeTotals) : formatMoney(0)
      }`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inicio</h1>
          <p className="text-sm text-slate-400">
            Resumen de {monthLabel(periodMonth, periodYear)}
          </p>
        </div>
        <Link
          href="/owners"
          className="rounded-md bg-[#D2491C] px-3 py-2 text-sm font-medium text-white hover:bg-[#b83d17]"
        >
          Gestionar propietarios
        </Link>
      </div>

      {owners.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900 p-8 text-center text-slate-400">
          Aún no hay propietarios registrados.{" "}
          <Link href="/owners" className="font-medium text-slate-50 underline">
            Agrega el primero
          </Link>
          .
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-slate-800 bg-slate-900 p-3 shadow-sm"
              >
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="mt-1 text-lg font-semibold">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">
              Cobrado vs. pendiente por cobrar — últimos 6 meses (RD$)
            </h2>
            <MonthlyBarChart data={chartData} />
          </div>

          {lateTenants.length > 0 && (
            <div className="rounded-lg border border-rose-800 bg-rose-950 p-4">
              <h2 className="mb-2 font-semibold text-rose-300">
                Inquilinos atrasados (más de 2 meses)
              </h2>
              <ul className="space-y-1 text-sm text-rose-300">
                {lateTenants.map(({ apt, tenant, overdue, lateFee }) => (
                  <li key={apt.id} className="flex items-center justify-between gap-2">
                    <span>
                      {tenant.name} — {apt.ownerName} · {apt.label}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {lateFee > 0 && (
                        <span className="rounded bg-rose-900 px-1.5 py-0.5 text-xs font-semibold">
                          Mora: {formatMoney(lateFee, apt.currency)}
                        </span>
                      )}
                      <span className="rounded bg-rose-900 px-1.5 py-0.5 text-xs font-semibold">
                        {overdue} meses
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/tenants"
                className="mt-2 inline-block text-sm font-medium text-rose-300 underline"
              >
                Ver en Inquilinos →
              </Link>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {owners.map((owner) => {
              const payments = owner.apartments.flatMap((apt) =>
                apt.payments.filter(
                  (p) => p.periodMonth === periodMonth && p.periodYear === periodYear
                )
              );
              const ownerNetGroups = netByCurrency(payments, owner.expenses);
              return (
                <div
                  key={owner.id}
                  className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">{owner.name}</h2>
                    <span className="text-xs text-slate-400">
                      {owner.apartments.length} apto(s)
                    </span>
                  </div>
                  <dl className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Cobrado</dt>
                      <dd>{formatMoneyByCurrency(payments)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Eventualidades por su cuenta</dt>
                      <dd className="text-rose-400">
                        {owner.expenses.length > 0
                          ? `- ${formatMoneyByCurrency(owner.expenses)}`
                          : formatMoney(0)}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1 font-semibold">
                      <dt>Neto a pagarle</dt>
                      <dd className="text-right">
                        {ownerNetGroups.length === 0
                          ? formatMoney(0)
                          : ownerNetGroups.map((g) => (
                              <span key={g.currency} className="block">
                                {formatMoney(g.amount, g.currency)}
                              </span>
                            ))}
                      </dd>
                    </div>
                  </dl>
                  <Link
                    href={`/owners/${owner.id}`}
                    className="mt-3 inline-block text-sm font-medium text-slate-50 underline"
                  >
                    Ver apartamentos y reportes →
                  </Link>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

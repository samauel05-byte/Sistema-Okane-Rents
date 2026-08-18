import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney, monthLabel } from "@/lib/format";
import { deletePayment } from "@/app/actions";
import { requireUser, accessibleApartmentIds } from "@/lib/auth";
import PaymentForm from "./PaymentForm";

export default async function PaymentsPage() {
  const user = await requireUser();
  const ids = accessibleApartmentIds(user);

  const apartments = await prisma.apartment.findMany({
    where: ids ? { id: { in: ids } } : undefined,
    include: {
      owner: true,
      tenants: { where: { active: true } },
    },
    orderBy: [{ owner: { name: "asc" } }, { label: "asc" }],
  });

  const payments = await prisma.payment.findMany({
    where: ids ? { apartmentId: { in: ids } } : undefined,
    include: { tenant: true, apartment: { include: { owner: true } } },
    orderBy: { paidOn: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cobros a inquilinos</h1>

      {user.role.managePayments && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-3 font-semibold">Registrar cobro</h2>
          <PaymentForm
            apartments={apartments.map((apt) => ({
              id: apt.id,
              label: apt.label,
              ownerName: apt.owner.name,
              rentAmount: apt.rentAmount,
              currency: apt.currency,
              tenantId: apt.tenants[0]?.id ?? null,
              tenantName: apt.tenants[0]?.name ?? null,
            }))}
          />
        </div>
      )}

      <div className="rounded-lg border border-slate-800 bg-slate-900">
        <h2 className="border-b border-slate-800 p-4 font-semibold">
          Cobros recientes
        </h2>
        {payments.length === 0 ? (
          <p className="p-4 text-sm text-slate-400">Aún no hay cobros registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Propietario</th>
                  <th className="p-3">Apartamento</th>
                  <th className="p-3">Inquilino</th>
                  <th className="p-3">Periodo</th>
                  <th className="p-3">Método</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3">{formatDate(p.paidOn)}</td>
                    <td className="p-3">{p.apartment.owner.name}</td>
                    <td className="p-3">{p.apartment.label}</td>
                    <td className="p-3">{p.tenant.name}</td>
                    <td className="p-3">{monthLabel(p.periodMonth, p.periodYear)}</td>
                    <td className="p-3">{p.method ?? "—"}</td>
                    <td className="p-3 text-right font-medium">
                      {formatMoney(p.amount, p.currency)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-3">
                        {p.invoiceId && (
                          <Link
                            href={`/invoices/${p.invoiceId}`}
                            className="text-xs font-medium text-slate-300 hover:underline"
                          >
                            Ver recibo
                          </Link>
                        )}
                        {user.role.managePayments && (
                          <form action={deletePayment}>
                            <input type="hidden" name="id" value={p.id} />
                            <button
                              type="submit"
                              className="text-xs text-rose-400 hover:underline"
                            >
                              Eliminar
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

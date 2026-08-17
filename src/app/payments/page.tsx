import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney, monthLabel } from "@/lib/format";
import { deletePayment } from "@/app/actions";
import PaymentForm from "./PaymentForm";

export default async function PaymentsPage() {
  const apartments = await prisma.apartment.findMany({
    include: {
      owner: true,
      tenants: { where: { active: true } },
    },
    orderBy: [{ owner: { name: "asc" } }, { label: "asc" }],
  });

  const payments = await prisma.payment.findMany({
    include: { tenant: true, apartment: { include: { owner: true } } },
    orderBy: { paidOn: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cobros a inquilinos</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Registrar cobro</h2>
        <PaymentForm
          apartments={apartments.map((apt) => ({
            id: apt.id,
            label: apt.label,
            ownerName: apt.owner.name,
            rentAmount: apt.rentAmount,
            tenantId: apt.tenants[0]?.id ?? null,
            tenantName: apt.tenants[0]?.name ?? null,
          }))}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <h2 className="border-b border-slate-100 p-4 font-semibold">
          Cobros recientes
        </h2>
        {payments.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aún no hay cobros registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Dueño</th>
                  <th className="p-3">Apartamento</th>
                  <th className="p-3">Inquilino</th>
                  <th className="p-3">Periodo</th>
                  <th className="p-3">Método</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3">{formatDate(p.paidOn)}</td>
                    <td className="p-3">{p.apartment.owner.name}</td>
                    <td className="p-3">{p.apartment.label}</td>
                    <td className="p-3">{p.tenant.name}</td>
                    <td className="p-3">{monthLabel(p.periodMonth, p.periodYear)}</td>
                    <td className="p-3">{p.method ?? "—"}</td>
                    <td className="p-3 text-right font-medium">
                      {formatMoney(p.amount)}
                    </td>
                    <td className="p-3 text-right">
                      <form action={deletePayment}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="text-xs text-rose-500 hover:underline"
                        >
                          Eliminar
                        </button>
                      </form>
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

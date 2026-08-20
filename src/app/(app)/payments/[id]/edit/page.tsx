import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MONTH_NAMES, CURRENCY_LABELS, isCurrency } from "@/lib/format";
import { updatePayment } from "@/app/actions";
import { requireUser, requirePagePermission, requireApartmentAccess } from "@/lib/auth";

export default async function EditPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  requirePagePermission(user, "managePayments");

  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { tenant: true, apartment: { include: { owner: true } } },
  });
  if (!payment) notFound();
  requireApartmentAccess(user, payment.apartmentId);

  return (
    <div className="max-w-lg space-y-6">
      <Link href="/payments" className="text-sm text-slate-400 hover:underline">
        ← Cobros
      </Link>
      <h1 className="text-2xl font-semibold">Editar cobro</h1>
      <p className="text-sm text-slate-400">
        {payment.apartment.owner.name} — {payment.apartment.label} ·{" "}
        {payment.tenant.name}
      </p>

      <form
        action={updatePayment}
        className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4 sm:grid-cols-2"
      >
        <input type="hidden" name="id" value={payment.id} />
        <div>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={payment.amount}
            required
            placeholder="Monto"
            className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            Moneda: {isCurrency(payment.currency) ? CURRENCY_LABELS[payment.currency] : payment.currency}{" "}
            (definida por el apartamento)
          </p>
        </div>
        <input
          name="method"
          defaultValue={payment.method ?? ""}
          placeholder="Método (efectivo, transferencia...)"
          className="rounded-md border border-slate-700 px-3 py-2 text-sm"
        />
        <select
          name="periodMonth"
          defaultValue={payment.periodMonth}
          className="w-full min-w-0 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50"
        >
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <input
          name="periodYear"
          type="number"
          defaultValue={payment.periodYear}
          className="rounded-md border border-slate-700 px-3 py-2 text-sm"
        />
        <input
          name="paidOn"
          type="date"
          defaultValue={payment.paidOn.toISOString().slice(0, 10)}
          className="rounded-md border border-slate-700 px-3 py-2 text-sm"
        />
        <input
          name="notes"
          defaultValue={payment.notes ?? ""}
          placeholder="Notas (opcional)"
          className="rounded-md border border-slate-700 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-[#D2491C] px-3 py-2 text-sm font-medium text-white hover:bg-[#b83d17] sm:col-span-2"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}

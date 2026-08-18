import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import { deleteInvoice } from "@/app/actions";
import { requireUser, accessibleApartmentIds } from "@/lib/auth";
import InvoiceForm from "./InvoiceForm";

export default async function InvoicesPage() {
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

  const owners = ids
    ? Array.from(new Map(apartments.map((a) => [a.owner.id, a.owner])).values())
    : await prisma.owner.findMany({ orderBy: { name: "asc" } });
  const ownerIds = owners.map((o) => o.id);

  const invoices = await prisma.invoice.findMany({
    where: ids
      ? {
          OR: [
            { apartmentId: { in: ids } },
            { apartmentId: null, ownerId: { in: ownerIds } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Facturas y recibos</h1>

      {user.role.manageInvoices && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-3 font-semibold">Generar factura / recibo</h2>
          <InvoiceForm
            apartments={apartments.map((apt) => ({
              id: apt.id,
              label: apt.label,
              ownerName: apt.owner.name,
              rentAmount: apt.rentAmount,
              currency: apt.currency,
              tenantId: apt.tenants[0]?.id ?? null,
              tenantName: apt.tenants[0]?.name ?? null,
            }))}
            owners={owners.map((o) => ({ id: o.id, name: o.name }))}
          />
        </div>
      )}

      <div className="rounded-lg border border-slate-800 bg-slate-900">
        <h2 className="border-b border-slate-800 p-4 font-semibold">
          Emitidas recientemente
        </h2>
        {invoices.length === 0 ? (
          <p className="p-4 text-sm text-slate-400">
            Aún no has generado ninguna factura o recibo.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">No.</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Concepto</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="p-3">{formatDate(inv.issuedOn)}</td>
                    <td className="p-3">
                      {inv.type === "TENANT" ? "Recibo" : "Factura"}
                    </td>
                    <td className="p-3">
                      {inv.type === "TENANT" ? "R-" : "F-"}
                      {String(inv.number).padStart(4, "0")}
                    </td>
                    <td className="p-3">{inv.clientName}</td>
                    <td className="p-3">{inv.concept}</td>
                    <td className="p-3 text-right font-medium">
                      {formatMoney(inv.amount, inv.currency)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="text-xs font-medium text-slate-300 hover:underline"
                        >
                          Ver / imprimir
                        </Link>
                        {user.role.manageInvoices && (
                          <form action={deleteInvoice}>
                            <input type="hidden" name="id" value={inv.id} />
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

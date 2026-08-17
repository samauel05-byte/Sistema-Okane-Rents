import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney, monthLabel } from "@/lib/format";
import { getBusinessSettings } from "@/lib/business";
import { requireUser, canAccessApartment } from "@/lib/auth";
import PrintButton from "@/components/PrintButton";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) notFound();

  if (invoice.apartmentId) {
    if (!canAccessApartment(user, invoice.apartmentId)) notFound();
  } else if (!user.role.scopeAllApartments) {
    const count = invoice.ownerId
      ? await prisma.apartment.count({
          where: { ownerId: invoice.ownerId, id: { in: user.apartmentIds } },
        })
      : 0;
    if (count === 0) notFound();
  }

  const business = await getBusinessSettings();
  const docLabel = invoice.type === "TENANT" ? "Recibo de pago" : "Factura";
  const docNumber = `${invoice.type === "TENANT" ? "R" : "F"}-${String(
    invoice.number
  ).padStart(4, "0")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 no-print sm:flex-row sm:items-center sm:justify-between">
        <Link href="/invoices" className="text-sm text-slate-500 hover:underline">
          ← Facturas y recibos
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {business.businessName ?? "Nombre del negocio no configurado"}
            </p>
            {business.businessRnc && (
              <p className="text-xs text-slate-500">RNC: {business.businessRnc}</p>
            )}
            {business.address && (
              <p className="text-xs text-slate-500">{business.address}</p>
            )}
            {(business.phone || business.email) && (
              <p className="text-xs text-slate-500">
                {[business.phone, business.email].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <div className="sm:text-right">
            <h1 className="text-xl font-semibold">{docLabel}</h1>
            <p className="text-sm text-slate-500">No. {docNumber}</p>
            {invoice.ncf && <p className="text-sm text-slate-500">NCF: {invoice.ncf}</p>}
            <p className="text-sm text-slate-500">{formatDate(invoice.issuedOn)}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs uppercase text-slate-500">Cliente</p>
          <p className="font-medium">{invoice.clientName}</p>
          {invoice.clientRnc && (
            <p className="text-sm text-slate-500">RNC/Cédula: {invoice.clientRnc}</p>
          )}
        </div>

        <table className="mb-6 w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="border-b border-slate-200 py-2">Concepto</th>
              {(invoice.periodMonth && invoice.periodYear) && (
                <th className="border-b border-slate-200 py-2">Periodo</th>
              )}
              <th className="border-b border-slate-200 py-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-3">{invoice.concept}</td>
              {(invoice.periodMonth && invoice.periodYear) && (
                <td className="py-3">
                  {monthLabel(invoice.periodMonth, invoice.periodYear)}
                </td>
              )}
              <td className="py-3 text-right">{formatMoney(invoice.amount)}</td>
            </tr>
          </tbody>
        </table>

        {invoice.notes && (
          <p className="mb-6 text-sm text-slate-500">Notas: {invoice.notes}</p>
        )}

        <div className="flex items-center justify-between rounded-md bg-slate-900 px-4 py-3 text-white">
          <span className="font-medium">Total</span>
          <span className="text-lg font-semibold">{formatMoney(invoice.amount)}</span>
        </div>
      </div>
    </div>
  );
}

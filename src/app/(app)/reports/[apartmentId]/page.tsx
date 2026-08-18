import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney, monthLabel } from "@/lib/format";
import { PAYOUT_STATUSES, PAYOUT_STATUS_LABELS } from "@/lib/reportStatus";
import { requireUser, canAccessApartment } from "@/lib/auth";
import { updateReportStatus } from "@/app/actions";
import PrintButton from "@/components/PrintButton";

function shiftMonth(month: number, year: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

const labelCell = "bg-[#F5F1EE] px-3 py-2 text-sm font-semibold text-slate-900";
const valueCell = "px-3 py-2 text-sm text-[#6B6B6B]";

export default async function ApartmentReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ apartmentId: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const user = await requireUser();
  const { apartmentId } = await params;
  const sp = await searchParams;
  const now = new Date();
  const periodMonth = Number(sp?.month) || now.getMonth() + 1;
  const periodYear = Number(sp?.year) || now.getFullYear();

  if (!canAccessApartment(user, apartmentId)) notFound();

  const apartment = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    include: {
      owner: true,
      tenants: { where: { active: true } },
      payments: { where: { periodMonth, periodYear } },
      expenses: { where: { periodMonth, periodYear }, orderBy: { incurredOn: "asc" } },
    },
  });

  if (!apartment) notFound();

  const tenant = apartment.tenants[0] ?? null;

  const reportStatus = await prisma.reportStatus.findUnique({
    where: {
      apartmentId_periodMonth_periodYear: { apartmentId, periodMonth, periodYear },
    },
  });

  const rentCollected = apartment.payments.reduce((s, p) => s + p.amount, 0);
  const lateFee =
    rentCollected === 0 && apartment.lateFeePercent
      ? (apartment.rentAmount * apartment.lateFeePercent) / 100
      : 0;
  const totalIncome = rentCollected + lateFee;
  const commissionPercent = apartment.managementCommissionPercent ?? 0;
  const commissionAmount = (totalIncome * commissionPercent) / 100;
  const maintenanceCost = apartment.expenses.reduce((s, e) => s + e.amount, 0);
  const netAmount = totalIncome - commissionAmount - maintenanceCost;

  const prev = shiftMonth(periodMonth, periodYear, -1);
  const next = shiftMonth(periodMonth, periodYear, 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 no-print sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/owners/${apartment.ownerId}`}
          className="text-sm text-slate-500 hover:underline"
        >
          ← {apartment.owner.name}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/reports/${apartment.id}?month=${prev.month}&year=${prev.year}`}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100"
          >
            ← Anterior
          </Link>
          <Link
            href={`/reports/${apartment.id}?month=${next.month}&year=${next.year}`}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100"
          >
            Siguiente →
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h1 className="text-xl font-bold text-slate-900">Reporte de Propietario</h1>
          <p className="text-sm font-medium text-[#C74626]">Gestión de Renta Larga</p>
        </div>

        {/* 1. DATOS GENERALES */}
        <h2 className="mb-2 font-bold text-[#C74626]">1. DATOS GENERALES</h2>
        <div className="mb-6 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 sm:grid-cols-4">
          <div className={labelCell}>Propietario:</div>
          <div className={`${valueCell} bg-white`}>{apartment.owner.name}</div>
          <div className={labelCell}>Propiedad:</div>
          <div className={`${valueCell} bg-white`}>{apartment.label}</div>

          <div className={labelCell}>Dirección:</div>
          <div className={`${valueCell} bg-white`}>{apartment.address || "—"}</div>
          <div className={labelCell}>Período del reporte:</div>
          <div className={`${valueCell} bg-white`}>{monthLabel(periodMonth, periodYear)}</div>

          <div className={labelCell}>Fecha de emisión:</div>
          <div className={`${valueCell} bg-white`}>{formatDate(now)}</div>
          <div className={labelCell}>Gestor asignado:</div>
          <div className={`${valueCell} bg-white`}>{apartment.managerName || "—"}</div>
        </div>

        {/* 2. DATOS DEL ARRENDAMIENTO */}
        <h2 className="mb-2 font-bold text-[#C74626]">2. DATOS DEL ARRENDAMIENTO</h2>
        <div className="mb-6 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 sm:grid-cols-4">
          <div className={labelCell}>Inquilino:</div>
          <div className={`${valueCell} bg-white`}>{tenant?.name || "— sin asignar —"}</div>
          <div className={labelCell}>Teléfono / email:</div>
          <div className={`${valueCell} bg-white`}>
            {[tenant?.phone, tenant?.email].filter(Boolean).join(" · ") || "—"}
          </div>

          <div className={labelCell}>Inicio de contrato:</div>
          <div className={`${valueCell} bg-white`}>
            {tenant?.moveInDate ? formatDate(tenant.moveInDate) : "—"}
          </div>
          <div className={labelCell}>Fin de contrato:</div>
          <div className={`${valueCell} bg-white`}>
            {tenant?.contractEnd ? formatDate(tenant.contractEnd) : "—"}
          </div>

          <div className={labelCell}>Renta mensual pactada:</div>
          <div className={`${valueCell} bg-white`}>
            {formatMoney(apartment.rentAmount, apartment.currency)}
          </div>
          <div className={labelCell}>Estado del contrato:</div>
          <div className={`${valueCell} bg-white`}>{tenant?.contractStatus || "—"}</div>
        </div>

        {/* 3. RESUMEN FINANCIERO */}
        <h2 className="mb-2 font-bold text-[#C74626]">3. RESUMEN FINANCIERO DEL PERÍODO</h2>
        <div className="mb-6 overflow-hidden rounded-md border border-slate-200">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-3 py-2">Renta cobrada al inquilino</td>
                <td className="px-3 py-2 text-right text-[#6B6B6B]">
                  {formatMoney(rentCollected, apartment.currency)}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2">Cargos adicionales (mora, servicios, otros)</td>
                <td className="px-3 py-2 text-right text-[#6B6B6B]">
                  {formatMoney(lateFee, apartment.currency)}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2">Total ingresos del período</td>
                <td className="px-3 py-2 text-right text-[#6B6B6B]">
                  {formatMoney(totalIncome, apartment.currency)}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2">Comisión Okane Rents ({commissionPercent}%)</td>
                <td className="px-3 py-2 text-right text-[#6B6B6B]">
                  − {formatMoney(commissionAmount, apartment.currency)}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2">Gastos de mantenimiento / reparaciones</td>
                <td className="px-3 py-2 text-right text-[#6B6B6B]">
                  − {formatMoney(maintenanceCost, apartment.currency)}
                </td>
              </tr>
              <tr className="bg-[#F5F1EE] font-bold text-[#C74626]">
                <td className="px-3 py-2">MONTO NETO A REMITIR AL PROPIETARIO</td>
                <td className="px-3 py-2 text-right">
                  {formatMoney(netAmount, apartment.currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. ESTATUS DE PAGO AL PROPIETARIO */}
        <h2 className="mb-2 font-bold text-[#C74626]">4. ESTATUS DE PAGO AL PROPIETARIO</h2>
        <div className="mb-2 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 sm:grid-cols-4">
          <div className={labelCell}>Estatus del pago:</div>
          <div className={`${valueCell} bg-white`}>
            {PAYOUT_STATUS_LABELS[
              (reportStatus?.payoutStatus as keyof typeof PAYOUT_STATUS_LABELS) ?? "PENDIENTE"
            ]}
          </div>
          <div className={labelCell}>Fecha de remisión:</div>
          <div className={`${valueCell} bg-white`}>
            {reportStatus?.paidOn ? formatDate(reportStatus.paidOn) : "—"}
          </div>

          <div className={labelCell}>Método de pago:</div>
          <div className={`${valueCell} bg-white`}>{reportStatus?.paymentMethod || "—"}</div>
          <div className={labelCell}>Cuenta destino:</div>
          <div className={`${valueCell} bg-white`}>
            {reportStatus?.destinationAccount || "—"}
          </div>
        </div>

        {user.role.manageApartments && (
          <details className="mb-6 no-print">
            <summary className="cursor-pointer text-xs font-medium text-slate-500">
              Actualizar estatus de pago
            </summary>
            <form
              action={updateReportStatus}
              className="mt-2 grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-2"
            >
              <input type="hidden" name="apartmentId" value={apartment.id} />
              <input type="hidden" name="periodMonth" value={periodMonth} />
              <input type="hidden" name="periodYear" value={periodYear} />
              <select
                name="payoutStatus"
                defaultValue={reportStatus?.payoutStatus ?? "PENDIENTE"}
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              >
                {PAYOUT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PAYOUT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <input
                name="paidOn"
                type="date"
                defaultValue={
                  reportStatus?.paidOn
                    ? reportStatus.paidOn.toISOString().slice(0, 10)
                    : ""
                }
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
              <input
                name="paymentMethod"
                defaultValue={reportStatus?.paymentMethod ?? ""}
                placeholder="Método de pago"
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
              <input
                name="destinationAccount"
                defaultValue={reportStatus?.destinationAccount ?? ""}
                placeholder="Cuenta destino"
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
              <input type="hidden" name="notes" value={reportStatus?.notes ?? ""} />
              <button
                type="submit"
                className="rounded-md bg-[#D2491C] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#b83d17] sm:col-span-2"
              >
                Guardar
              </button>
            </form>
          </details>
        )}

        {/* 5. MANTENIMIENTO E INCIDENCIAS */}
        <h2 className="mb-2 font-bold text-[#C74626]">5. MANTENIMIENTO E INCIDENCIAS</h2>
        <div className="mb-6 overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="bg-[#1A1A1A] text-left text-xs font-bold text-white">
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Descripción</th>
                <th className="px-3 py-2">Responsable</th>
                <th className="px-3 py-2 text-right">Costo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apartment.expenses.length === 0 ? (
                <tr>
                  <td className="px-3 py-2 text-[#6B6B6B]" colSpan={4}>
                    Sin incidencias registradas este período.
                  </td>
                </tr>
              ) : (
                apartment.expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="px-3 py-2 text-[#6B6B6B]">{formatDate(e.incurredOn)}</td>
                    <td className="px-3 py-2 text-[#6B6B6B]">{e.description}</td>
                    <td className="px-3 py-2 text-[#6B6B6B]">{e.responsible || "—"}</td>
                    <td className="px-3 py-2 text-right text-[#6B6B6B]">
                      {formatMoney(e.amount, e.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 6. OBSERVACIONES */}
        <h2 className="mb-2 font-bold text-[#C74626]">6. OBSERVACIONES Y PRÓXIMOS PASOS</h2>
        <p className="mb-2 whitespace-pre-wrap text-sm text-[#6B6B6B]">
          {reportStatus?.notes || "Sin observaciones."}
        </p>
        {user.role.manageApartments && (
          <details className="mb-6 no-print">
            <summary className="cursor-pointer text-xs font-medium text-slate-500">
              Editar observaciones
            </summary>
            <form
              action={updateReportStatus}
              className="mt-2 grid gap-2 rounded-md border border-slate-200 p-3"
            >
              <input type="hidden" name="apartmentId" value={apartment.id} />
              <input type="hidden" name="periodMonth" value={periodMonth} />
              <input type="hidden" name="periodYear" value={periodYear} />
              <input
                type="hidden"
                name="payoutStatus"
                value={reportStatus?.payoutStatus ?? "PENDIENTE"}
              />
              <input
                type="hidden"
                name="paidOn"
                value={
                  reportStatus?.paidOn
                    ? reportStatus.paidOn.toISOString().slice(0, 10)
                    : ""
                }
              />
              <input
                type="hidden"
                name="paymentMethod"
                value={reportStatus?.paymentMethod ?? ""}
              />
              <input
                type="hidden"
                name="destinationAccount"
                value={reportStatus?.destinationAccount ?? ""}
              />
              <textarea
                name="notes"
                defaultValue={reportStatus?.notes ?? ""}
                rows={3}
                placeholder="Renovación de contrato, novedades del inquilino, recomendaciones al propietario, etc."
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
              <button
                type="submit"
                className="rounded-md bg-[#D2491C] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#b83d17]"
              >
                Guardar
              </button>
            </form>
          </details>
        )}

        <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-[#C74626]">
          Okane Rents — Respuesta y presencia local en Punta Cana
        </p>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import {
  MONTH_NAMES,
  formatDate,
  formatMoney,
  monthLabel,
  CURRENCIES,
  CURRENCY_LABELS,
  DEFAULT_CURRENCY,
} from "@/lib/format";
import { createExpense, deleteExpense } from "@/app/actions";
import { requireUser, accessibleApartmentIds } from "@/lib/auth";

export default async function ExpensesPage() {
  const user = await requireUser();
  const ids = accessibleApartmentIds(user);

  const owners = await prisma.owner.findMany({
    where: ids ? { apartments: { some: { id: { in: ids } } } } : undefined,
    include: {
      apartments: {
        where: ids ? { id: { in: ids } } : undefined,
        orderBy: { label: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
  const accessibleOwnerIds = owners.map((o) => o.id);

  const expenses = await prisma.expense.findMany({
    where: ids
      ? {
          OR: [
            { apartmentId: { in: ids } },
            { apartmentId: null, ownerId: { in: accessibleOwnerIds } },
          ],
        }
      : undefined,
    include: { owner: true, apartment: true },
    orderBy: { incurredOn: "desc" },
    take: 30,
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Eventualidades por cuenta del propietario</h1>
        <p className="text-sm text-slate-400">
          Reparaciones u otros costos pagados en representación del propietario. Se
          descuentan del monto a pagarle en el reporte mensual.
        </p>
      </div>

      {user.role.manageExpenses && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-3 font-semibold">Registrar eventualidad</h2>
          <form action={createExpense} className="grid gap-3 sm:grid-cols-3">
            <select
              name="target"
              required
              className="w-full min-w-0 rounded-md border border-slate-700 px-3 py-2 text-sm sm:col-span-2"
            >
              <option value="">Selecciona apartamento o propietario</option>
              {owners.map((owner) => (
                <optgroup key={owner.id} label={owner.name}>
                  <option value={`owner:${owner.id}`}>
                    {owner.name} — eventualidad general (sin apartamento específico)
                  </option>
                  {owner.apartments.map((apt) => (
                    <option key={apt.id} value={`apt:${apt.id}`}>
                      {owner.name} — {apt.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="Monto"
              required
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
            <select
              name="currency"
              defaultValue={DEFAULT_CURRENCY}
              className="w-full min-w-0 rounded-md border border-slate-700 px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABELS[c]}
                </option>
              ))}
            </select>

            <input
              name="description"
              placeholder="Descripción (ej. reparación de filtración)"
              required
              className="rounded-md border border-slate-700 px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              name="category"
              placeholder="Categoría (opcional, ej. plomería)"
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />

            <select
              name="periodMonth"
              defaultValue={now.getMonth() + 1}
              className="w-full min-w-0 rounded-md border border-slate-700 px-3 py-2 text-sm"
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
              defaultValue={now.getFullYear()}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />
            <input
              name="incurredOn"
              type="date"
              defaultValue={now.toISOString().slice(0, 10)}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            />

            <button
              type="submit"
              className="rounded-md bg-[#D2491C] px-3 py-2 text-sm font-medium text-white hover:bg-[#b83d17] sm:col-span-3"
            >
              Registrar eventualidad
            </button>
          </form>
        </div>
      )}

      <div className="rounded-lg border border-slate-800 bg-slate-900">
        <h2 className="border-b border-slate-800 p-4 font-semibold">
          Eventualidades recientes
        </h2>
        {expenses.length === 0 ? (
          <p className="p-4 text-sm text-slate-400">Aún no hay eventualidades registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Propietario</th>
                  <th className="p-3">Apartamento</th>
                  <th className="p-3">Descripción</th>
                  <th className="p-3">Periodo</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="p-3">{formatDate(e.incurredOn)}</td>
                    <td className="p-3">{e.owner.name}</td>
                    <td className="p-3">{e.apartment?.label ?? "General"}</td>
                    <td className="p-3">{e.description}</td>
                    <td className="p-3">{monthLabel(e.periodMonth, e.periodYear)}</td>
                    <td className="p-3 text-right font-medium text-rose-400">
                      {formatMoney(e.amount, e.currency)}
                    </td>
                    <td className="p-3 text-right">
                      {user.role.manageExpenses && (
                        <form action={deleteExpense}>
                          <input type="hidden" name="id" value={e.id} />
                          <button
                            type="submit"
                            className="text-xs text-rose-400 hover:underline"
                          >
                            Eliminar
                          </button>
                        </form>
                      )}
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

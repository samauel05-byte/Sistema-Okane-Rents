import { prisma } from "@/lib/prisma";
import { MONTH_NAMES, formatDate, formatMoney, monthLabel } from "@/lib/format";
import { createExpense, deleteExpense } from "@/app/actions";

export default async function ExpensesPage() {
  const owners = await prisma.owner.findMany({
    include: { apartments: { orderBy: { label: "asc" } } },
    orderBy: { name: "asc" },
  });

  const expenses = await prisma.expense.findMany({
    include: { owner: true, apartment: true },
    orderBy: { incurredOn: "desc" },
    take: 30,
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Gastos por cuenta del dueño</h1>
        <p className="text-sm text-slate-500">
          Reparaciones u otros costos pagados en representación del dueño. Se
          descuentan del monto a pagarle en el reporte mensual.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Registrar gasto</h2>
        <form action={createExpense} className="grid gap-3 sm:grid-cols-3">
          <select
            name="target"
            required
            className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          >
            <option value="">Selecciona apartamento o dueño</option>
            {owners.map((owner) => (
              <optgroup key={owner.id} label={owner.name}>
                <option value={`owner:${owner.id}`}>
                  {owner.name} — gasto general (sin apartamento específico)
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
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />

          <input
            name="description"
            placeholder="Descripción (ej. reparación de filtración)"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="category"
            placeholder="Categoría (opcional, ej. plomería)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />

          <select
            name="periodMonth"
            defaultValue={now.getMonth() + 1}
            className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 text-sm"
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
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="incurredOn"
            type="date"
            defaultValue={now.toISOString().slice(0, 10)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />

          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 sm:col-span-3"
          >
            Registrar gasto
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <h2 className="border-b border-slate-100 p-4 font-semibold">
          Gastos recientes
        </h2>
        {expenses.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Aún no hay gastos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Dueño</th>
                  <th className="p-3">Apartamento</th>
                  <th className="p-3">Descripción</th>
                  <th className="p-3">Periodo</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="p-3">{formatDate(e.incurredOn)}</td>
                    <td className="p-3">{e.owner.name}</td>
                    <td className="p-3">{e.apartment?.label ?? "General"}</td>
                    <td className="p-3">{e.description}</td>
                    <td className="p-3">{monthLabel(e.periodMonth, e.periodYear)}</td>
                    <td className="p-3 text-right font-medium text-rose-600">
                      {formatMoney(e.amount)}
                    </td>
                    <td className="p-3 text-right">
                      <form action={deleteExpense}>
                        <input type="hidden" name="id" value={e.id} />
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

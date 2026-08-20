import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MONTH_NAMES, CURRENCIES, CURRENCY_LABELS } from "@/lib/format";
import { updateExpense } from "@/app/actions";
import { requireUser, requirePagePermission, requireApartmentAccess } from "@/lib/auth";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  requirePagePermission(user, "manageExpenses");

  const { id } = await params;
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { owner: true, apartment: true },
  });
  if (!expense) notFound();

  if (expense.apartmentId) {
    requireApartmentAccess(user, expense.apartmentId);
  } else if (!user.role.scopeAllApartments) {
    const accessibleCount = await prisma.apartment.count({
      where: { ownerId: expense.ownerId, id: { in: user.apartmentIds } },
    });
    if (accessibleCount === 0) notFound();
  }

  return (
    <div className="max-w-lg space-y-6">
      <Link href="/expenses" className="text-sm text-slate-400 hover:underline">
        ← Eventualidades
      </Link>
      <h1 className="text-2xl font-semibold">Editar eventualidad</h1>
      <p className="text-sm text-slate-400">
        {expense.owner.name} — {expense.apartment?.label ?? "General"}
      </p>

      <form
        action={updateExpense}
        className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4 sm:grid-cols-2"
      >
        <input type="hidden" name="id" value={expense.id} />
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={expense.amount}
          required
          placeholder="Monto"
          className="rounded-md border border-slate-700 px-3 py-2 text-sm"
        />
        <select
          name="currency"
          defaultValue={expense.currency}
          className="w-full min-w-0 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {CURRENCY_LABELS[c]}
            </option>
          ))}
        </select>
        <input
          name="description"
          defaultValue={expense.description}
          required
          placeholder="Descripción"
          className="rounded-md border border-slate-700 px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          name="category"
          defaultValue={expense.category ?? ""}
          placeholder="Categoría (opcional)"
          className="rounded-md border border-slate-700 px-3 py-2 text-sm"
        />
        <input
          name="responsible"
          defaultValue={expense.responsible ?? ""}
          placeholder="Responsable (opcional)"
          className="rounded-md border border-slate-700 px-3 py-2 text-sm"
        />
        <select
          name="periodMonth"
          defaultValue={expense.periodMonth}
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
          defaultValue={expense.periodYear}
          className="rounded-md border border-slate-700 px-3 py-2 text-sm"
        />
        <input
          name="incurredOn"
          type="date"
          defaultValue={expense.incurredOn.toISOString().slice(0, 10)}
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

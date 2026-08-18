/** How many consecutive months of rent are unpaid up through the most
 * recently-due period, walking back from today until a paid month is found
 * (or the tenant's move-in date, or a 24-month safety cap). */
export function monthsOverdue(
  payments: { periodMonth: number; periodYear: number }[],
  paymentDueDay: number | null,
  moveInDate: Date | null,
  today: Date = new Date()
): number {
  const dueDay = paymentDueDay ?? 1;
  let month = today.getMonth() + 1;
  let year = today.getFullYear();
  // This month's rent isn't due yet, so the last due period is last month.
  if (today.getDate() < dueDay) {
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  const paid = new Set(payments.map((p) => `${p.periodYear}-${p.periodMonth}`));
  const moveIn = moveInDate ? new Date(moveInDate.getFullYear(), moveInDate.getMonth(), 1) : null;

  let overdue = 0;
  for (let i = 0; i < 24; i++) {
    if (moveIn && new Date(year, month - 1, 1) < moveIn) break;
    if (paid.has(`${year}-${month}`)) break;
    overdue++;
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return overdue;
}

"use client";

import { useMemo, useState } from "react";
import { createPayment } from "@/app/actions";
import { MONTH_NAMES } from "@/lib/format";

type ApartmentOption = {
  id: string;
  label: string;
  ownerName: string;
  rentAmount: number;
  tenantId: string | null;
  tenantName: string | null;
};

const now = new Date();

export default function PaymentForm({
  apartments,
}: {
  apartments: ApartmentOption[];
}) {
  const [apartmentId, setApartmentId] = useState("");
  const selected = useMemo(
    () => apartments.find((a) => a.id === apartmentId) ?? null,
    [apartments, apartmentId]
  );
  const [amount, setAmount] = useState("");

  return (
    <form action={createPayment} className="grid gap-3 sm:grid-cols-3">
      <select
        name="apartmentId"
        required
        value={apartmentId}
        onChange={(e) => {
          const apt = apartments.find((a) => a.id === e.target.value);
          setApartmentId(e.target.value);
          setAmount(apt ? String(apt.rentAmount) : "");
        }}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
      >
        <option value="">Selecciona apartamento / inquilino</option>
        {apartments.map((apt) => (
          <option key={apt.id} value={apt.id} disabled={!apt.tenantId}>
            {apt.ownerName} — {apt.label}
            {apt.tenantName ? ` (${apt.tenantName})` : " (sin inquilino)"}
          </option>
        ))}
      </select>

      <input type="hidden" name="tenantId" value={selected?.tenantId ?? ""} />

      <input
        name="amount"
        type="number"
        step="0.01"
        min="0"
        placeholder="Monto"
        required
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      <select
        name="periodMonth"
        defaultValue={now.getMonth() + 1}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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
        name="paidOn"
        type="date"
        defaultValue={now.toISOString().slice(0, 10)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      <input
        name="method"
        placeholder="Método (efectivo, transferencia...)"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
      />
      <input
        name="notes"
        placeholder="Notas (opcional)"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      <button
        type="submit"
        disabled={!selected?.tenantId}
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-3"
      >
        Registrar cobro
      </button>
    </form>
  );
}

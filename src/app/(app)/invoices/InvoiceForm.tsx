"use client";

import { useMemo, useState } from "react";
import { createInvoice } from "@/app/actions";
import { MONTH_NAMES, CURRENCIES, CURRENCY_LABELS, DEFAULT_CURRENCY } from "@/lib/format";

type ApartmentOption = {
  id: string;
  label: string;
  ownerName: string;
  rentAmount: number;
  currency: string;
  tenantId: string | null;
  tenantName: string | null;
};

type OwnerOption = { id: string; name: string };

const now = new Date();

export default function InvoiceForm({
  apartments,
  owners,
}: {
  apartments: ApartmentOption[];
  owners: OwnerOption[];
}) {
  const [type, setType] = useState<"TENANT" | "OWNER">("TENANT");
  const [apartmentId, setApartmentId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");

  const selectedApartment = useMemo(
    () => apartments.find((a) => a.id === apartmentId) ?? null,
    [apartments, apartmentId]
  );

  return (
    <form action={createInvoice} className="grid gap-3 sm:grid-cols-3">
      <div className="flex flex-wrap gap-4 text-sm sm:col-span-3">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="type"
            value="TENANT"
            checked={type === "TENANT"}
            onChange={() => setType("TENANT")}
          />
          Recibo a inquilino (pago de renta)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="type"
            value="OWNER"
            checked={type === "OWNER"}
            onChange={() => setType("OWNER")}
          />
          Factura a propietario (gestión)
        </label>
      </div>

      {type === "TENANT" ? (
        <select
          name="apartmentId"
          required
          value={apartmentId}
          onChange={(e) => {
            const apt = apartments.find((a) => a.id === e.target.value) ?? null;
            setApartmentId(e.target.value);
            if (apt) {
              setAmount(String(apt.rentAmount));
              setConcept(
                `Pago de renta correspondiente a ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()} — ${apt.label}`
              );
            }
          }}
          className="w-full min-w-0 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 sm:col-span-3"
        >
          <option value="">Selecciona apartamento / inquilino</option>
          {apartments.map((apt) => (
            <option key={apt.id} value={apt.id} disabled={!apt.tenantId}>
              {apt.ownerName} — {apt.label} ({apt.currency})
              {apt.tenantName ? ` (${apt.tenantName})` : " (sin inquilino)"}
            </option>
          ))}
        </select>
      ) : (
        <select
          name="ownerId"
          required
          value={ownerId}
          onChange={(e) => {
            const owner = owners.find((o) => o.id === e.target.value);
            setOwnerId(e.target.value);
            if (owner) {
              setConcept(
                `Servicio de administración de propiedad — ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`
              );
            }
          }}
          className="w-full min-w-0 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 sm:col-span-3"
        >
          <option value="">Selecciona propietario</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      )}

      <input
        name="concept"
        placeholder="Concepto"
        required
        value={concept}
        onChange={(e) => setConcept(e.target.value)}
        className="rounded-md border border-slate-700 px-3 py-2 text-sm sm:col-span-3"
      />

      <div className="flex items-center gap-2">
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="Monto"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-slate-700 px-3 py-2 text-sm"
        />
        {type === "TENANT" ? (
          <span className="shrink-0 text-xs text-slate-400">
            {selectedApartment?.currency ?? DEFAULT_CURRENCY}
          </span>
        ) : (
          <select
            name="currency"
            defaultValue={DEFAULT_CURRENCY}
            className="w-full min-w-0 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {CURRENCY_LABELS[c]}
              </option>
            ))}
          </select>
        )}
      </div>
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
        name="issuedOn"
        type="date"
        defaultValue={now.toISOString().slice(0, 10)}
        className="rounded-md border border-slate-700 px-3 py-2 text-sm"
      />
      <input
        name="ncf"
        placeholder="NCF (opcional)"
        className="rounded-md border border-slate-700 px-3 py-2 text-sm"
      />
      <input
        name="clientRnc"
        placeholder="RNC/Cédula del cliente (opcional)"
        className="rounded-md border border-slate-700 px-3 py-2 text-sm"
      />

      <input
        name="notes"
        placeholder="Notas (opcional)"
        className="rounded-md border border-slate-700 px-3 py-2 text-sm sm:col-span-3"
      />

      <button
        type="submit"
        disabled={type === "TENANT" ? !selectedApartment?.tenantId : !ownerId}
        className="rounded-md bg-[#D2491C] px-3 py-2 text-sm font-medium text-white hover:bg-[#b83d17] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-3"
      >
        Generar
      </button>
    </form>
  );
}

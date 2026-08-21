"use client";

import { useActionState } from "react";
import { sendReportEmail, type SendReportEmailState } from "@/app/actions";

const initialState: SendReportEmailState = {};

export default function SendReportEmailForm({
  apartmentId,
  periodMonth,
  periodYear,
  ownerEmail,
}: {
  apartmentId: string;
  periodMonth: number;
  periodYear: number;
  ownerEmail: string | null;
}) {
  const [state, formAction, pending] = useActionState(sendReportEmail, initialState);

  if (!ownerEmail) {
    return (
      <p className="no-print text-xs text-slate-500">
        El propietario no tiene un correo configurado — no se puede enviar el reporte.
      </p>
    );
  }

  return (
    <form action={formAction} className="no-print flex flex-wrap items-center gap-2">
      <input type="hidden" name="apartmentId" value={apartmentId} />
      <input type="hidden" name="periodMonth" value={periodMonth} />
      <input type="hidden" name="periodYear" value={periodYear} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
      >
        {pending ? "Enviando..." : `Enviar por correo a ${ownerEmail}`}
      </button>
      {state.error && <span className="text-sm text-rose-600">{state.error}</span>}
      {state.success && <span className="text-sm text-emerald-600">{state.success}</span>}
    </form>
  );
}

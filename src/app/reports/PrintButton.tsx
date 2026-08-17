"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
    >
      Imprimir / Guardar PDF
    </button>
  );
}

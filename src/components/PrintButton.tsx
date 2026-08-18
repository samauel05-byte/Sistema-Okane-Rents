"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-md bg-[#D2491C] px-3 py-2 text-sm font-medium text-white hover:bg-[#b83d17]"
    >
      Imprimir / Guardar PDF
    </button>
  );
}

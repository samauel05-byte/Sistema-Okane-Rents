import { getBusinessSettings } from "@/lib/business";
import { updateBusinessSettings } from "./actions";

export default async function BusinessAdminPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Estos datos aparecen como emisor en cada recibo y factura que
        generes desde la sección de Facturas.
      </p>

      <form
        action={updateBusinessSettings}
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <input
          name="businessName"
          placeholder="Nombre del negocio"
          defaultValue={settings.businessName ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="businessRnc"
          placeholder="RNC"
          defaultValue={settings.businessRnc ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="address"
          placeholder="Dirección (opcional)"
          defaultValue={settings.address ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          name="phone"
          placeholder="Teléfono (opcional)"
          defaultValue={settings.phone ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="email"
          type="email"
          placeholder="Correo (opcional)"
          defaultValue={settings.email ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 sm:col-span-2"
        >
          Guardar datos del negocio
        </button>
      </form>
    </div>
  );
}

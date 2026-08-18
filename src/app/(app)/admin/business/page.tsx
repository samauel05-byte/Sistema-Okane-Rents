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
        encType="multipart/form-data"
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Logo (aparece al imprimir facturas y recibos)
          </label>
          {settings.logoDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoDataUrl}
              alt="Logo actual"
              className="mb-2 h-14 w-auto rounded border border-slate-200 bg-white p-1"
            />
          )}
          <input
            name="logo"
            type="file"
            accept="image/*"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
          />
          {settings.logoDataUrl && (
            <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="removeLogo" />
              Quitar el logo actual
            </label>
          )}
        </div>

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

import { getBusinessSettings } from "@/lib/business";
import { updateBusinessSettings } from "./actions";

export default async function BusinessAdminPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Estos datos aparecen como emisor en cada recibo y factura que
        generes desde la sección de Facturas. El logo también se muestra en
        la barra superior de la web, y el favicon en la pestaña del
        navegador.
      </p>

      <form
        action={updateBusinessSettings}
        encType="multipart/form-data"
        className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4 sm:grid-cols-2"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">
            Logo (facturas y barra superior)
          </label>
          {settings.logoDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoDataUrl}
              alt="Logo actual"
              className="mb-2 h-14 w-auto rounded border border-slate-800 bg-slate-900 p-1"
            />
          )}
          <input
            name="logo"
            type="file"
            accept="image/*"
            className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-[#D2491C] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
          />
          {settings.logoDataUrl && (
            <label className="mt-2 flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="removeLogo" />
              Quitar el logo actual
            </label>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">
            Favicon (ícono de la pestaña del navegador)
          </label>
          {settings.faviconDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.faviconDataUrl}
              alt="Favicon actual"
              className="mb-2 h-14 w-14 rounded border border-slate-800 bg-slate-900 p-1"
            />
          )}
          <input
            name="favicon"
            type="file"
            accept="image/*"
            className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-[#D2491C] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
          />
          {settings.faviconDataUrl && (
            <label className="mt-2 flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="removeFavicon" />
              Quitar el favicon actual
            </label>
          )}
          {!settings.faviconDataUrl && settings.logoDataUrl && (
            <p className="mt-2 text-xs text-slate-500">
              Si no subes uno, se usa el logo de arriba como favicon.
            </p>
          )}
        </div>

        <input
          name="businessName"
          placeholder="Nombre del negocio"
          defaultValue={settings.businessName ?? ""}
          className="rounded-md border border-slate-700 px-3 py-2 text-sm"
        />
        <input
          name="businessRnc"
          placeholder="RNC"
          defaultValue={settings.businessRnc ?? ""}
          className="rounded-md border border-slate-700 px-3 py-2 text-sm"
        />
        <input
          name="address"
          placeholder="Dirección (opcional)"
          defaultValue={settings.address ?? ""}
          className="rounded-md border border-slate-700 px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          name="phone"
          placeholder="Teléfono (opcional)"
          defaultValue={settings.phone ?? ""}
          className="rounded-md border border-slate-700 px-3 py-2 text-sm"
        />
        <input
          name="email"
          type="email"
          placeholder="Correo (opcional)"
          defaultValue={settings.email ?? ""}
          className="rounded-md border border-slate-700 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-[#D2491C] px-3 py-2 text-sm font-medium text-white hover:bg-[#b83d17] sm:col-span-2"
        >
          Guardar datos del negocio
        </button>
      </form>
    </div>
  );
}

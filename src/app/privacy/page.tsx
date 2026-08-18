import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad · Okane Rents",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Link href="/login" className="text-lg font-semibold tracking-tight text-white">
        Okane <span className="text-[#D2491C]">Rents</span>
      </Link>
      <h1 className="mt-6 text-2xl font-semibold">Política de Privacidad</h1>
      <p className="mt-1 text-sm text-slate-400">Última actualización: agosto de 2026</p>

      <div className="mt-6 space-y-4 text-sm text-slate-300">
        <p>
          Okane Rents recopila y almacena la información necesaria para operar
          este sistema de gestión de propiedades: datos de propietarios,
          inquilinos, cobros, eventualidades y reportes mensuales.
        </p>
        <section>
          <h2 className="font-semibold text-slate-100">Qué información se guarda</h2>
          <p className="mt-1">
            Nombres, teléfonos, correos electrónicos, RNC/cédula, montos de renta
            y pagos, y demás datos operativos relacionados con la administración
            de las propiedades.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-100">Uso de la información</h2>
          <p className="mt-1">
            Los datos se usan exclusivamente para la operación de Okane Rents:
            generar cobros, facturas, recibos y reportes mensuales a
            propietarios. No se comparten con terceros ajenos a la operación del
            negocio.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-100">Comunicaciones</h2>
          <p className="mt-1">
            Los usuarios del sistema pueden recibir correos periódicos con
            actualizaciones relacionadas con el uso de la plataforma.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-100">Contacto</h2>
          <p className="mt-1">
            Para consultas sobre el manejo de tus datos, contacta a la
            administración de Okane Rents.
          </p>
        </section>
      </div>

      <Link href="/login" className="mt-8 inline-block text-sm text-slate-400 hover:underline">
        ← Volver a iniciar sesión
      </Link>
    </div>
  );
}

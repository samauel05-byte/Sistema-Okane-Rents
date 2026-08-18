import Link from "next/link";

export const metadata = {
  title: "Términos de Servicio · Okane Rents",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Link href="/login" className="text-lg font-semibold tracking-tight text-white">
        Okane <span className="text-[#D2491C]">Rents</span>
      </Link>
      <h1 className="mt-6 text-2xl font-semibold">Términos de Servicio</h1>
      <p className="mt-1 text-sm text-slate-400">Última actualización: agosto de 2026</p>

      <div className="mt-6 space-y-4 text-sm text-slate-300">
        <p>
          Este sistema es una herramienta interna de Okane Rents para la gestión de
          cobros de renta a inquilinos y la generación de reportes mensuales para
          propietarios en Punta Cana, República Dominicana. El acceso está
          restringido a personal autorizado de Okane Rents.
        </p>
        <section>
          <h2 className="font-semibold text-slate-100">Uso del sistema</h2>
          <p className="mt-1">
            Cada usuario es responsable de mantener la confidencialidad de sus
            credenciales de acceso y de toda actividad realizada bajo su cuenta.
            El sistema debe usarse únicamente para las funciones de gestión de
            propiedades para las que fue autorizado.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-100">Datos registrados</h2>
          <p className="mt-1">
            La información registrada (propietarios, inquilinos, cobros,
            eventualidades y reportes) pertenece a Okane Rents y se usa
            exclusivamente para la operación del negocio.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-slate-100">Cambios</h2>
          <p className="mt-1">
            Estos términos pueden actualizarse a medida que el sistema evoluciona.
          </p>
        </section>
      </div>

      <Link href="/login" className="mt-8 inline-block text-sm text-slate-400 hover:underline">
        ← Volver a iniciar sesión
      </Link>
    </div>
  );
}

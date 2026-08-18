import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Logo from "@/app/Logo";
import LoginForm from "./LoginForm";
import SetupForm from "./SetupForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const userCount = await prisma.user.count();
  const isFirstRun = userCount === 0;

  return (
    <div className="mx-auto flex min-h-[85vh] w-full max-w-sm flex-1 flex-col justify-center px-4">
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo dark />
        <p className="mt-2 text-sm text-slate-400">
          {isFirstRun
            ? "Primera vez aquí — crea la cuenta de administrador"
            : "Inicia sesión para continuar"}
        </p>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        {isFirstRun ? <SetupForm /> : <LoginForm />}
      </div>
      <p className="mt-4 text-center text-xs text-slate-500">
        Al continuar, aceptas los{" "}
        <Link href="/terms" className="underline hover:text-slate-300">
          Términos de Servicio
        </Link>{" "}
        y la{" "}
        <Link href="/privacy" className="underline hover:text-slate-300">
          Política de Privacidad
        </Link>{" "}
        de Okane Rents, y a recibir correos periódicos con actualizaciones.
      </p>
      <p className="mt-2 text-center text-xs text-slate-600">
        © Copyright {new Date().getFullYear()} Okane Rents - Todos los Derechos Reservados
      </p>
    </div>
  );
}

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
        <Logo />
        <p className="mt-2 text-sm text-slate-500">
          {isFirstRun
            ? "Primera vez aquí — crea la cuenta de administrador"
            : "Inicia sesión para continuar"}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {isFirstRun ? <SetupForm /> : <LoginForm />}
      </div>
    </div>
  );
}

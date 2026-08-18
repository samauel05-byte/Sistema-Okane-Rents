"use client";

import { useActionState } from "react";
import { setupAdmin, type FormState } from "./actions";

const initialState: FormState = {};

export default function SetupForm() {
  const [state, formAction, pending] = useActionState(setupAdmin, initialState);

  return (
    <form action={formAction} className="grid gap-3">
      {state.error && (
        <p className="rounded-md bg-rose-950 px-3 py-2 text-sm text-rose-400">
          {state.error}
        </p>
      )}
      <input
        name="name"
        placeholder="Tu nombre"
        required
        autoFocus
        className="rounded-md border border-slate-700 px-3 py-2 text-sm"
      />
      <input
        name="username"
        placeholder="Usuario"
        required
        className="rounded-md border border-slate-700 px-3 py-2 text-sm"
      />
      <input
        name="password"
        type="password"
        placeholder="Contraseña (mínimo 6 caracteres)"
        required
        minLength={6}
        className="rounded-md border border-slate-700 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[#D2491C] px-3 py-2 text-sm font-medium text-white hover:bg-[#b83d17] disabled:opacity-50"
      >
        {pending ? "Creando..." : "Crear cuenta de administrador"}
      </button>
    </form>
  );
}

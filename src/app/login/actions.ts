"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";

export type FormState = { error?: string };

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function login(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const username = str(formData, "username");
  const password = str(formData, "password");

  if (!username || !password) {
    return { error: "Completa usuario y contraseña." };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.active) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function setupAdmin(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    return { error: "Ya existe una configuración inicial." };
  }

  const name = str(formData, "name");
  const username = str(formData, "username");
  const password = str(formData, "password");

  if (!name || !username || !password) {
    return { error: "Completa todos los campos." };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    return { error: "Ese usuario ya existe." };
  }

  let adminRole = await prisma.role.findUnique({ where: { name: "Administrador" } });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: "Administrador",
        description: "Acceso total al sistema, incluyendo administración de usuarios.",
        scopeAllApartments: true,
        manageUsers: true,
        manageOwners: true,
        manageApartments: true,
        managePayments: true,
        manageExpenses: true,
        manageInvoices: true,
        viewReports: true,
      },
    });
  }

  const gestorExists = await prisma.role.findUnique({ where: { name: "Gestor" } });
  if (!gestorExists) {
    await prisma.role.create({
      data: {
        name: "Gestor",
        description:
          "Registra cobros y eventualidades solo de los apartamentos que se le asignen.",
        scopeAllApartments: false,
        manageUsers: false,
        manageOwners: false,
        manageApartments: false,
        managePayments: true,
        manageExpenses: true,
        manageInvoices: true,
        viewReports: true,
      },
    });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username, passwordHash, name, roleId: adminRole.id },
  });

  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

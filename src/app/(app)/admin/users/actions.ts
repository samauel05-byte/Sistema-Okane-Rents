"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission, hashPassword } from "@/lib/auth";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function apartmentIdsFrom(formData: FormData) {
  return formData.getAll("apartmentIds").map(String);
}

export async function createUser(formData: FormData) {
  const admin = await requireUser();
  requirePermission(admin, "manageUsers");

  const username = str(formData, "username");
  const name = str(formData, "name");
  const password = str(formData, "password");
  const roleId = str(formData, "roleId");
  if (!username || !name || !password || !roleId) return;
  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    throw new Error("Ese usuario ya existe.");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username, name, passwordHash, roleId },
  });

  const apartmentIds = apartmentIdsFrom(formData);
  if (apartmentIds.length > 0) {
    await prisma.userApartmentAccess.createMany({
      data: apartmentIds.map((apartmentId) => ({ userId: user.id, apartmentId })),
    });
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUserAccess(formData: FormData) {
  const admin = await requireUser();
  requirePermission(admin, "manageUsers");

  const userId = str(formData, "userId");
  const name = str(formData, "name");
  const roleId = str(formData, "roleId");
  if (!userId || !name || !roleId) return;

  await prisma.user.update({ where: { id: userId }, data: { name, roleId } });

  const apartmentIds = apartmentIdsFrom(formData);
  await prisma.userApartmentAccess.deleteMany({ where: { userId } });
  if (apartmentIds.length > 0) {
    await prisma.userApartmentAccess.createMany({
      data: apartmentIds.map((apartmentId) => ({ userId, apartmentId })),
    });
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function resetPassword(formData: FormData) {
  const admin = await requireUser();
  requirePermission(admin, "manageUsers");

  const userId = str(formData, "userId");
  const password = str(formData, "password");
  if (!userId || !password) return;
  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  revalidatePath(`/admin/users/${userId}`);
}

export async function setUserActive(formData: FormData) {
  const admin = await requireUser();
  requirePermission(admin, "manageUsers");

  const userId = str(formData, "userId");
  const active = str(formData, "active") === "true";
  if (!userId) return;

  if (userId === admin.id && !active) {
    throw new Error("No puedes desactivar tu propia cuenta.");
  }

  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function permissionFields(formData: FormData) {
  return Object.fromEntries(
    PERMISSIONS.map((p) => [p, bool(formData, p)])
  ) as Record<(typeof PERMISSIONS)[number], boolean>;
}

export async function createRole(formData: FormData) {
  const admin = await requireUser();
  requirePermission(admin, "manageUsers");

  const name = str(formData, "name");
  if (!name) return;

  const existing = await prisma.role.findUnique({ where: { name } });
  if (existing) {
    throw new Error("Ya existe un rol con ese nombre.");
  }

  await prisma.role.create({
    data: {
      name,
      description: str(formData, "description") || null,
      scopeAllApartments: bool(formData, "scopeAllApartments"),
      ...permissionFields(formData),
    },
  });

  revalidatePath("/admin/roles");
}

export async function updateRole(formData: FormData) {
  const admin = await requireUser();
  requirePermission(admin, "manageUsers");

  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!id || !name) return;

  await prisma.role.update({
    where: { id },
    data: {
      name,
      description: str(formData, "description") || null,
      scopeAllApartments: bool(formData, "scopeAllApartments"),
      ...permissionFields(formData),
    },
  });

  revalidatePath("/admin/roles");
}

export async function deleteRole(formData: FormData) {
  const admin = await requireUser();
  requirePermission(admin, "manageUsers");

  const id = str(formData, "id");
  if (!id) return;

  const usersWithRole = await prisma.user.count({ where: { roleId: id } });
  if (usersWithRole > 0) {
    throw new Error("No puedes eliminar un rol que tiene usuarios asignados.");
  }

  await prisma.role.delete({ where: { id } });
  revalidatePath("/admin/roles");
}

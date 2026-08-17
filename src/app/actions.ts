"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  requireUser,
  requirePermission,
  requireApartmentAccess,
  type CurrentUser,
} from "@/lib/auth";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function num(formData: FormData, key: string) {
  const v = str(formData, key);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Creating brand-new owners/apartments is out of the "assigned apartments"
 * model, so it's reserved for roles with unrestricted (global) scope. */
function requireGlobalScope(user: CurrentUser) {
  if (!user.role.scopeAllApartments) {
    throw new Error(
      "Tu acceso está limitado a apartamentos específicos; no puedes crear dueños ni apartamentos nuevos."
    );
  }
}

export async function createOwner(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageOwners");
  requireGlobalScope(user);

  const name = str(formData, "name");
  if (!name) return;
  const owner = await prisma.owner.create({
    data: {
      name,
      email: str(formData, "email") || null,
      phone: str(formData, "phone") || null,
    },
  });
  revalidatePath("/owners");
  redirect(`/owners/${owner.id}`);
}

export async function deleteOwner(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageOwners");
  requireGlobalScope(user);

  const id = str(formData, "id");
  await prisma.owner.delete({ where: { id } });
  revalidatePath("/owners");
  redirect("/owners");
}

export async function createApartment(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageApartments");
  requireGlobalScope(user);

  const ownerId = str(formData, "ownerId");
  const label = str(formData, "label");
  const rentAmount = num(formData, "rentAmount");
  if (!ownerId || !label) return;
  await prisma.apartment.create({
    data: {
      ownerId,
      label,
      address: str(formData, "address") || null,
      rentAmount,
    },
  });
  revalidatePath(`/owners/${ownerId}`);
}

export async function deleteApartment(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageApartments");

  const id = str(formData, "id");
  const ownerId = str(formData, "ownerId");
  requireApartmentAccess(user, id);

  await prisma.apartment.delete({ where: { id } });
  revalidatePath(`/owners/${ownerId}`);
}

export async function createTenant(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageApartments");

  const apartmentId = str(formData, "apartmentId");
  const ownerId = str(formData, "ownerId");
  const name = str(formData, "name");
  if (!apartmentId || !name) return;
  requireApartmentAccess(user, apartmentId);

  // Only one active tenant per apartment at a time.
  await prisma.tenant.updateMany({
    where: { apartmentId, active: true },
    data: { active: false },
  });

  await prisma.tenant.create({
    data: {
      apartmentId,
      name,
      email: str(formData, "email") || null,
      phone: str(formData, "phone") || null,
      moveInDate: new Date(),
    },
  });
  revalidatePath(`/owners/${ownerId}`);
}

export async function createPayment(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "managePayments");

  const tenantId = str(formData, "tenantId");
  const apartmentId = str(formData, "apartmentId");
  const amount = num(formData, "amount");
  const periodMonth = num(formData, "periodMonth");
  const periodYear = num(formData, "periodYear");
  if (!tenantId || !apartmentId || !amount || !periodMonth || !periodYear) {
    return;
  }
  requireApartmentAccess(user, apartmentId);

  await prisma.payment.create({
    data: {
      tenantId,
      apartmentId,
      amount,
      periodMonth,
      periodYear,
      method: str(formData, "method") || null,
      notes: str(formData, "notes") || null,
      paidOn: str(formData, "paidOn") ? new Date(str(formData, "paidOn")) : new Date(),
    },
  });
  revalidatePath("/payments");
  revalidatePath("/");
}

export async function deletePayment(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "managePayments");

  const id = str(formData, "id");
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) return;
  requireApartmentAccess(user, payment.apartmentId);

  await prisma.payment.delete({ where: { id } });
  revalidatePath("/payments");
  revalidatePath("/");
}

/** For expenses not tied to one apartment: the user must manage at least
 * one apartment for that owner (or have unrestricted scope). */
async function requireOwnerAccess(user: CurrentUser, ownerId: string) {
  if (user.role.scopeAllApartments) return;
  const count = await prisma.apartment.count({
    where: { ownerId, id: { in: user.apartmentIds } },
  });
  if (count === 0) {
    throw new Error("No tienes acceso a ningún apartamento de este dueño.");
  }
}

export async function createExpense(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageExpenses");

  const target = str(formData, "target"); // "apt:<id>" or "owner:<id>"
  const description = str(formData, "description");
  const amount = num(formData, "amount");
  const periodMonth = num(formData, "periodMonth");
  const periodYear = num(formData, "periodYear");
  if (!target || !description || !amount || !periodMonth || !periodYear) {
    return;
  }

  let ownerId: string;
  let apartmentId: string | null = null;

  if (target.startsWith("apt:")) {
    const apartmentIdVal = target.slice(4);
    const apartment = await prisma.apartment.findUnique({
      where: { id: apartmentIdVal },
    });
    if (!apartment) return;
    requireApartmentAccess(user, apartment.id);
    ownerId = apartment.ownerId;
    apartmentId = apartment.id;
  } else if (target.startsWith("owner:")) {
    ownerId = target.slice(6);
    await requireOwnerAccess(user, ownerId);
  } else {
    return;
  }

  await prisma.expense.create({
    data: {
      ownerId,
      apartmentId,
      description,
      amount,
      periodMonth,
      periodYear,
      category: str(formData, "category") || null,
      incurredOn: str(formData, "incurredOn")
        ? new Date(str(formData, "incurredOn"))
        : new Date(),
    },
  });
  revalidatePath("/expenses");
  revalidatePath("/");
}

export async function deleteExpense(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageExpenses");

  const id = str(formData, "id");
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return;

  if (expense.apartmentId) {
    requireApartmentAccess(user, expense.apartmentId);
  } else {
    await requireOwnerAccess(user, expense.ownerId);
  }

  await prisma.expense.delete({ where: { id } });
  revalidatePath("/expenses");
  revalidatePath("/");
}

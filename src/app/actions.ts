"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function num(formData: FormData, key: string) {
  const v = str(formData, key);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function createOwner(formData: FormData) {
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
  const id = str(formData, "id");
  await prisma.owner.delete({ where: { id } });
  revalidatePath("/owners");
  redirect("/owners");
}

export async function createApartment(formData: FormData) {
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
  const id = str(formData, "id");
  const ownerId = str(formData, "ownerId");
  await prisma.apartment.delete({ where: { id } });
  revalidatePath(`/owners/${ownerId}`);
}

export async function createTenant(formData: FormData) {
  const apartmentId = str(formData, "apartmentId");
  const ownerId = str(formData, "ownerId");
  const name = str(formData, "name");
  if (!apartmentId || !name) return;

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
  const tenantId = str(formData, "tenantId");
  const apartmentId = str(formData, "apartmentId");
  const amount = num(formData, "amount");
  const periodMonth = num(formData, "periodMonth");
  const periodYear = num(formData, "periodYear");
  if (!tenantId || !apartmentId || !amount || !periodMonth || !periodYear) {
    return;
  }
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
  const id = str(formData, "id");
  await prisma.payment.delete({ where: { id } });
  revalidatePath("/payments");
  revalidatePath("/");
}

export async function createExpense(formData: FormData) {
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
    ownerId = apartment.ownerId;
    apartmentId = apartment.id;
  } else if (target.startsWith("owner:")) {
    ownerId = target.slice(6);
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
  const id = str(formData, "id");
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/expenses");
  revalidatePath("/");
}

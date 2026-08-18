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
import { nextInvoiceNumber } from "@/lib/business";
import { DEFAULT_CURRENCY, isCurrency } from "@/lib/format";

function currency(formData: FormData, key: string) {
  const v = str(formData, key);
  return isCurrency(v) ? v : DEFAULT_CURRENCY;
}

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function num(formData: FormData, key: string) {
  const v = str(formData, key);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Parses an optional numeric field: empty/invalid input means "not set". */
function optionalNum(formData: FormData, key: string) {
  const v = str(formData, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function paymentDueDay(formData: FormData) {
  const n = optionalNum(formData, "paymentDueDay");
  if (n === null) return null;
  const day = Math.round(n);
  return day >= 1 && day <= 31 ? day : null;
}

const MAX_LATE_FEE_PERCENT = 10;

function lateFeePercent(formData: FormData) {
  const n = optionalNum(formData, "lateFeePercent");
  if (n === null) return null;
  return Math.min(MAX_LATE_FEE_PERCENT, Math.max(0, n));
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
      rnc: str(formData, "rnc") || null,
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
      currency: currency(formData, "currency"),
      paymentDueDay: paymentDueDay(formData),
      lateFeePercent: lateFeePercent(formData),
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

export async function updateApartmentTerms(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageApartments");

  const id = str(formData, "id");
  if (!id) return;
  requireApartmentAccess(user, id);

  const apartment = await prisma.apartment.update({
    where: { id },
    data: {
      paymentDueDay: paymentDueDay(formData),
      lateFeePercent: lateFeePercent(formData),
    },
  });
  revalidatePath("/tenants");
  revalidatePath(`/owners/${apartment.ownerId}`);
}

export async function createTenant(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageApartments");

  const apartmentId = str(formData, "apartmentId");
  const name = str(formData, "name");
  if (!apartmentId || !name) return;
  requireApartmentAccess(user, apartmentId);

  const apartment = await prisma.apartment.findUnique({ where: { id: apartmentId } });
  if (!apartment) return;

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
      rnc: str(formData, "rnc") || null,
      moveInDate: new Date(),
    },
  });
  revalidatePath(`/owners/${apartment.ownerId}`);
  revalidatePath("/tenants");
}

export async function updateTenant(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageApartments");

  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!id || !name) return;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { apartment: true },
  });
  if (!tenant) return;
  requireApartmentAccess(user, tenant.apartmentId);

  await prisma.tenant.update({
    where: { id },
    data: {
      name,
      email: str(formData, "email") || null,
      phone: str(formData, "phone") || null,
      rnc: str(formData, "rnc") || null,
    },
  });
  revalidatePath("/tenants");
  revalidatePath(`/owners/${tenant.apartment.ownerId}`);
}

export async function deactivateTenant(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageApartments");

  const id = str(formData, "id");
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { apartment: true },
  });
  if (!tenant) return;
  requireApartmentAccess(user, tenant.apartmentId);

  await prisma.tenant.update({ where: { id }, data: { active: false } });
  revalidatePath("/tenants");
  revalidatePath(`/owners/${tenant.apartment.ownerId}`);
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

  const apartment = await prisma.apartment.findUnique({ where: { id: apartmentId } });
  if (!apartment) return;

  await prisma.payment.create({
    data: {
      tenantId,
      apartmentId,
      amount,
      currency: apartment.currency,
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
      currency: currency(formData, "currency"),
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

export async function createInvoice(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageInvoices");

  const type = str(formData, "type") === "OWNER" ? "OWNER" : "TENANT";
  const amount = num(formData, "amount");
  const concept = str(formData, "concept");
  if (!amount || !concept) return;

  const ncf = str(formData, "ncf") || null;
  const notes = str(formData, "notes") || null;
  const issuedOn = str(formData, "issuedOn")
    ? new Date(str(formData, "issuedOn"))
    : new Date();
  const periodMonth = str(formData, "periodMonth") ? num(formData, "periodMonth") : null;
  const periodYear = str(formData, "periodYear") ? num(formData, "periodYear") : null;
  const clientRncInput = str(formData, "clientRnc") || null;

  if (type === "TENANT") {
    const apartmentId = str(formData, "apartmentId");
    if (!apartmentId) return;
    requireApartmentAccess(user, apartmentId);

    const apartment = await prisma.apartment.findUnique({
      where: { id: apartmentId },
      include: { tenants: { where: { active: true } } },
    });
    const tenant = apartment?.tenants[0];
    if (!apartment || !tenant) return;

    const number = await nextInvoiceNumber("TENANT");
    await prisma.invoice.create({
      data: {
        type: "TENANT",
        number,
        ncf,
        issuedOn,
        concept,
        amount,
        currency: apartment.currency,
        clientName: tenant.name,
        clientRnc: clientRncInput ?? tenant.rnc,
        notes,
        periodMonth,
        periodYear,
        ownerId: apartment.ownerId,
        apartmentId: apartment.id,
        tenantId: tenant.id,
      },
    });
  } else {
    const ownerId = str(formData, "ownerId");
    if (!ownerId) return;
    const apartmentId = str(formData, "apartmentId") || null;

    if (apartmentId) {
      requireApartmentAccess(user, apartmentId);
    } else {
      await requireOwnerAccess(user, ownerId);
    }

    const owner = await prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner) return;

    const number = await nextInvoiceNumber("OWNER");
    await prisma.invoice.create({
      data: {
        type: "OWNER",
        number,
        ncf,
        issuedOn,
        concept,
        amount,
        currency: currency(formData, "currency"),
        clientName: owner.name,
        clientRnc: clientRncInput ?? owner.rnc,
        notes,
        periodMonth,
        periodYear,
        ownerId: owner.id,
        apartmentId,
      },
    });
  }

  revalidatePath("/invoices");
}

export async function deleteInvoice(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageInvoices");

  const id = str(formData, "id");
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return;

  if (invoice.apartmentId) {
    requireApartmentAccess(user, invoice.apartmentId);
  } else if (invoice.ownerId) {
    await requireOwnerAccess(user, invoice.ownerId);
  }

  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/invoices");
}

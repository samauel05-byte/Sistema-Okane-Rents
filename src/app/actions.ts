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
import { DEFAULT_CURRENCY, isCurrency, MONTH_NAMES } from "@/lib/format";
import { CONTRACT_STATUSES, PAYOUT_STATUSES } from "@/lib/reportStatus";

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

const MAX_COMMISSION_PERCENT = 30;

function commissionPercent(formData: FormData) {
  const n = optionalNum(formData, "managementCommissionPercent");
  if (n === null) return null;
  return Math.min(MAX_COMMISSION_PERCENT, Math.max(0, n));
}

function contractStatus(formData: FormData) {
  const v = str(formData, "contractStatus");
  return (CONTRACT_STATUSES as readonly string[]).includes(v) ? v : null;
}

function optionalDate(formData: FormData, key: string) {
  const v = str(formData, key);
  return v ? new Date(v) : null;
}

/** Creating brand-new owners/apartments is out of the "assigned apartments"
 * model, so it's reserved for roles with unrestricted (global) scope. */
function requireGlobalScope(user: CurrentUser) {
  if (!user.role.scopeAllApartments) {
    throw new Error(
      "Tu acceso está limitado a apartamentos específicos; no puedes crear propietarios ni apartamentos nuevos."
    );
  }
}

export async function createOwner(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageOwners");
  requireGlobalScope(user);

  const name = str(formData, "name");
  const email = str(formData, "email");
  const phone = str(formData, "phone");
  if (!name || !email || !phone) return;
  const owner = await prisma.owner.create({
    data: {
      name,
      email,
      phone,
      rnc: str(formData, "rnc") || null,
    },
  });
  revalidatePath("/owners");
  redirect(`/owners/${owner.id}`);
}

export async function updateOwner(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageOwners");

  const id = str(formData, "id");
  const name = str(formData, "name");
  const email = str(formData, "email");
  const phone = str(formData, "phone");
  if (!id || !name || !email || !phone) return;

  await prisma.owner.update({
    where: { id },
    data: { name, email, phone, rnc: str(formData, "rnc") || null },
  });
  revalidatePath(`/owners/${id}`);
  revalidatePath("/owners");
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
      managementCommissionPercent: commissionPercent(formData),
      managerName: str(formData, "managerName") || null,
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

export async function updateApartment(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageApartments");

  const id = str(formData, "id");
  const label = str(formData, "label");
  const rentAmount = num(formData, "rentAmount");
  if (!id || !label || !rentAmount) return;
  requireApartmentAccess(user, id);

  const apartment = await prisma.apartment.update({
    where: { id },
    data: {
      label,
      address: str(formData, "address") || null,
      rentAmount,
      currency: currency(formData, "currency"),
    },
  });
  revalidatePath("/tenants");
  revalidatePath(`/reports/${apartment.id}`);
  revalidatePath(`/owners/${apartment.ownerId}`);
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
      managementCommissionPercent: commissionPercent(formData),
      managerName: str(formData, "managerName") || null,
    },
  });
  revalidatePath("/tenants");
  revalidatePath(`/reports/${apartment.id}`);
  revalidatePath(`/owners/${apartment.ownerId}`);
}

/** Adds years/months of contract duration to a start date, if either was given. */
function contractEndFromDuration(moveInDate: Date, formData: FormData) {
  const years = optionalNum(formData, "contractYears") ?? 0;
  const months = optionalNum(formData, "contractMonths") ?? 0;
  if (years <= 0 && months <= 0) return null;
  const end = new Date(moveInDate);
  end.setMonth(end.getMonth() + years * 12 + months);
  return end;
}

export async function createTenant(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageApartments");

  const apartmentId = str(formData, "apartmentId");
  const name = str(formData, "name");
  const email = str(formData, "email");
  const phone = str(formData, "phone");
  if (!apartmentId || !name || !email || !phone) return;
  requireApartmentAccess(user, apartmentId);

  const apartment = await prisma.apartment.findUnique({ where: { id: apartmentId } });
  if (!apartment) return;

  // Only one active tenant per apartment at a time.
  await prisma.tenant.updateMany({
    where: { apartmentId, active: true },
    data: { active: false },
  });

  const moveInDate = optionalDate(formData, "moveInDate") ?? new Date();

  await prisma.tenant.create({
    data: {
      apartmentId,
      name,
      email,
      phone,
      rnc: str(formData, "rnc") || null,
      moveInDate,
      contractEnd: contractEndFromDuration(moveInDate, formData),
    },
  });

  const newPaymentDueDay = paymentDueDay(formData);
  if (newPaymentDueDay !== null) {
    await prisma.apartment.update({
      where: { id: apartmentId },
      data: { paymentDueDay: newPaymentDueDay },
    });
  }

  revalidatePath(`/owners/${apartment.ownerId}`);
  revalidatePath("/tenants");
  revalidatePath(`/reports/${apartmentId}`);
}

export async function updateTenant(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageApartments");

  const id = str(formData, "id");
  const name = str(formData, "name");
  const email = str(formData, "email");
  const phone = str(formData, "phone");
  if (!id || !name || !email || !phone) return;

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
      email,
      phone,
      rnc: str(formData, "rnc") || null,
      contractEnd: optionalDate(formData, "contractEnd"),
      contractStatus: contractStatus(formData),
    },
  });
  revalidatePath("/tenants");
  revalidatePath(`/reports/${tenant.apartmentId}`);
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
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!apartment || !tenant) return;

  const paidOn = str(formData, "paidOn") ? new Date(str(formData, "paidOn")) : new Date();

  // Auto-generate the tenant's receipt for this payment.
  const invoiceNumber = await nextInvoiceNumber("TENANT");
  const invoice = await prisma.invoice.create({
    data: {
      type: "TENANT",
      number: invoiceNumber,
      issuedOn: paidOn,
      concept: `Pago de renta correspondiente a ${MONTH_NAMES[periodMonth - 1]} ${periodYear} — ${apartment.label}`,
      amount,
      currency: apartment.currency,
      clientName: tenant.name,
      clientRnc: tenant.rnc,
      periodMonth,
      periodYear,
      ownerId: apartment.ownerId,
      apartmentId: apartment.id,
      tenantId: tenant.id,
    },
  });

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
      paidOn,
      invoiceId: invoice.id,
    },
  });
  revalidatePath("/payments");
  revalidatePath("/invoices");
  revalidatePath("/");
}

export async function updatePayment(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "managePayments");

  const id = str(formData, "id");
  const amount = num(formData, "amount");
  const periodMonth = num(formData, "periodMonth");
  const periodYear = num(formData, "periodYear");
  if (!id || !amount || !periodMonth || !periodYear) return;

  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) return;
  requireApartmentAccess(user, payment.apartmentId);

  const paidOn = str(formData, "paidOn") ? new Date(str(formData, "paidOn")) : payment.paidOn;

  await prisma.payment.update({
    where: { id },
    data: {
      amount,
      periodMonth,
      periodYear,
      method: str(formData, "method") || null,
      notes: str(formData, "notes") || null,
      paidOn,
    },
  });

  // Keep the auto-generated receipt in sync with the corrected amount/period.
  if (payment.invoiceId) {
    const apartment = await prisma.apartment.findUnique({ where: { id: payment.apartmentId } });
    await prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        amount,
        issuedOn: paidOn,
        periodMonth,
        periodYear,
        concept: apartment
          ? `Pago de renta correspondiente a ${MONTH_NAMES[periodMonth - 1]} ${periodYear} — ${apartment.label}`
          : undefined,
      },
    });
  }

  revalidatePath("/payments");
  revalidatePath("/invoices");
  revalidatePath("/");
  redirect("/payments");
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
    throw new Error("No tienes acceso a ningún apartamento de este propietario.");
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
      responsible: str(formData, "responsible") || null,
      incurredOn: str(formData, "incurredOn")
        ? new Date(str(formData, "incurredOn"))
        : new Date(),
    },
  });
  revalidatePath("/expenses");
  if (apartmentId) revalidatePath(`/reports/${apartmentId}`);
  revalidatePath("/");
}

export async function updateExpense(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageExpenses");

  const id = str(formData, "id");
  const description = str(formData, "description");
  const amount = num(formData, "amount");
  const periodMonth = num(formData, "periodMonth");
  const periodYear = num(formData, "periodYear");
  if (!id || !description || !amount || !periodMonth || !periodYear) return;

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return;
  if (expense.apartmentId) {
    requireApartmentAccess(user, expense.apartmentId);
  } else {
    await requireOwnerAccess(user, expense.ownerId);
  }

  await prisma.expense.update({
    where: { id },
    data: {
      description,
      amount,
      currency: currency(formData, "currency"),
      periodMonth,
      periodYear,
      category: str(formData, "category") || null,
      responsible: str(formData, "responsible") || null,
      incurredOn: str(formData, "incurredOn")
        ? new Date(str(formData, "incurredOn"))
        : expense.incurredOn,
    },
  });
  revalidatePath("/expenses");
  if (expense.apartmentId) revalidatePath(`/reports/${expense.apartmentId}`);
  revalidatePath("/");
  redirect("/expenses");
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

export async function updateReportStatus(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageApartments");

  const apartmentId = str(formData, "apartmentId");
  const periodMonth = num(formData, "periodMonth");
  const periodYear = num(formData, "periodYear");
  if (!apartmentId || !periodMonth || !periodYear) return;
  requireApartmentAccess(user, apartmentId);

  const payoutStatusInput = str(formData, "payoutStatus");
  const payoutStatus = (PAYOUT_STATUSES as readonly string[]).includes(payoutStatusInput)
    ? payoutStatusInput
    : "PENDIENTE";

  const data = {
    payoutStatus,
    paidOn: optionalDate(formData, "paidOn"),
    paymentMethod: str(formData, "paymentMethod") || null,
    destinationAccount: str(formData, "destinationAccount") || null,
    notes: str(formData, "notes") || null,
  };

  await prisma.reportStatus.upsert({
    where: {
      apartmentId_periodMonth_periodYear: { apartmentId, periodMonth, periodYear },
    },
    create: { apartmentId, periodMonth, periodYear, ...data },
    update: data,
  });
  revalidatePath(`/reports/${apartmentId}`);
}

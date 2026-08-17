"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission } from "@/lib/auth";

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function updateBusinessSettings(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageUsers");

  const data = {
    businessName: str(formData, "businessName") || null,
    businessRnc: str(formData, "businessRnc") || null,
    address: str(formData, "address") || null,
    phone: str(formData, "phone") || null,
    email: str(formData, "email") || null,
  };

  await prisma.businessSettings.upsert({
    where: { id: "singleton" },
    create: data,
    update: data,
  });

  revalidatePath("/admin/business");
  revalidatePath("/invoices");
}

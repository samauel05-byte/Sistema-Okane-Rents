"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission } from "@/lib/auth";

const MAX_LOGO_BYTES = 3 * 1024 * 1024; // 3MB

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function updateBusinessSettings(formData: FormData) {
  const user = await requireUser();
  requirePermission(user, "manageUsers");

  const data: {
    businessName: string | null;
    businessRnc: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    logoDataUrl?: string | null;
  } = {
    businessName: str(formData, "businessName") || null,
    businessRnc: str(formData, "businessRnc") || null,
    address: str(formData, "address") || null,
    phone: str(formData, "phone") || null,
    email: str(formData, "email") || null,
  };

  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (logo.size > MAX_LOGO_BYTES) {
      throw new Error("El logo es demasiado grande (máximo 3MB).");
    }
    const bytes = Buffer.from(await logo.arrayBuffer());
    data.logoDataUrl = `data:${logo.type};base64,${bytes.toString("base64")}`;
  } else if (str(formData, "removeLogo") === "on") {
    data.logoDataUrl = null;
  }

  await prisma.businessSettings.upsert({
    where: { id: "singleton" },
    create: data,
    update: data,
  });

  revalidatePath("/admin/business");
  revalidatePath("/invoices");
}

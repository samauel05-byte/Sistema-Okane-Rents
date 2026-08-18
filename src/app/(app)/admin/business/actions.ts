"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requirePermission } from "@/lib/auth";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3MB

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Reads an optional image field from the form: a new upload replaces the
 * stored data URL, a checked "remove*" checkbox clears it, otherwise the
 * existing value is left untouched (field omitted from the returned data). */
async function imageField(
  formData: FormData,
  fileKey: string,
  removeKey: string,
  label: string
): Promise<string | null | undefined> {
  const file = formData.get(fileKey);
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(`${label} es demasiado grande (máximo 3MB).`);
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    return `data:${file.type};base64,${bytes.toString("base64")}`;
  }
  if (str(formData, removeKey) === "on") return null;
  return undefined;
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
    faviconDataUrl?: string | null;
  } = {
    businessName: str(formData, "businessName") || null,
    businessRnc: str(formData, "businessRnc") || null,
    address: str(formData, "address") || null,
    phone: str(formData, "phone") || null,
    email: str(formData, "email") || null,
  };

  const logoDataUrl = await imageField(formData, "logo", "removeLogo", "El logo");
  if (logoDataUrl !== undefined) data.logoDataUrl = logoDataUrl;

  const faviconDataUrl = await imageField(formData, "favicon", "removeFavicon", "El favicon");
  if (faviconDataUrl !== undefined) data.faviconDataUrl = faviconDataUrl;

  await prisma.businessSettings.upsert({
    where: { id: "singleton" },
    create: data,
    update: data,
  });

  revalidatePath("/admin/business");
  revalidatePath("/invoices");
  revalidatePath("/", "layout");
}

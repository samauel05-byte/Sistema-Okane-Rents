import { prisma } from "@/lib/prisma";

export async function getBusinessSettings() {
  return prisma.businessSettings.upsert({
    where: { id: "singleton" },
    create: {},
    update: {},
  });
}

/** Atomically reserves and returns the next consecutive number for the
 * given invoice type, incrementing the counter in BusinessSettings. */
export async function nextInvoiceNumber(type: "TENANT" | "OWNER") {
  await getBusinessSettings();
  if (type === "TENANT") {
    const updated = await prisma.businessSettings.update({
      where: { id: "singleton" },
      data: { nextReceiptNumber: { increment: 1 } },
    });
    return updated.nextReceiptNumber - 1;
  }
  const updated = await prisma.businessSettings.update({
    where: { id: "singleton" },
    data: { nextInvoiceNumber: { increment: 1 } },
  });
  return updated.nextInvoiceNumber - 1;
}

import { prisma } from "../src/lib/prisma";

async function main() {
  const owner = await prisma.owner.findFirst({ where: { name: "Roberto Fernández" } });
  if (!owner) throw new Error("Owner not found — create it in the UI first");

  const aptData = [
    { label: "Apto 3", rentAmount: 13500 },
    { label: "Apto 4", rentAmount: 16000 },
    { label: "Apto 5", rentAmount: 12000 },
  ];

  for (const a of aptData) {
    const existing = await prisma.apartment.findFirst({
      where: { ownerId: owner.id, label: a.label },
    });
    if (!existing) {
      await prisma.apartment.create({
        data: { ownerId: owner.id, label: a.label, rentAmount: a.rentAmount },
      });
    }
  }

  const apartments = await prisma.apartment.findMany({
    where: { ownerId: owner.id },
    orderBy: { label: "asc" },
  });

  const tenantNames = [
    "Apto 1",
    "Apto 2",
    "Apto 3",
    "Apto 4",
    "Apto 5",
  ];
  const names = ["Carlos Peña", "María Gómez", "Luis Ortiz", "Ana Reyes", "Julio Vargas"];

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  for (let i = 0; i < apartments.length; i++) {
    const apt = apartments[i];
    let tenant = await prisma.tenant.findFirst({
      where: { apartmentId: apt.id, active: true },
    });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          apartmentId: apt.id,
          name: names[i] ?? `Inquilino ${i + 1}`,
          moveInDate: new Date(year, 0, 1),
        },
      });
    }

    // Every apartment paid this month except Apto 4 (still pending).
    if (apt.label !== "Apto 4") {
      const existingPayment = await prisma.payment.findFirst({
        where: { apartmentId: apt.id, periodMonth: month, periodYear: year },
      });
      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            tenantId: tenant.id,
            apartmentId: apt.id,
            amount: apt.rentAmount,
            periodMonth: month,
            periodYear: year,
            method: "Transferencia",
          },
        });
      }
    }
  }

  const apto1 = apartments.find((a) => a.label === "Apto 1")!;
  const existingExpense = await prisma.expense.findFirst({
    where: { apartmentId: apto1.id, periodMonth: month, periodYear: year },
  });
  if (!existingExpense) {
    await prisma.expense.create({
      data: {
        ownerId: owner.id,
        apartmentId: apto1.id,
        description: "Reparación de filtración en tubería del baño",
        amount: 4500,
        category: "Plomería",
        periodMonth: month,
        periodYear: year,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

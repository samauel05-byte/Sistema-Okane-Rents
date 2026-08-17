# Sistema Okane Rents

Sistema web para llevar los cobros de renta a inquilinos y generar el reporte
mensual de cuánto se le debe pagar a cada dueño (renta cobrada menos gastos
pagados en su representación, como reparaciones).

## Modelo

- **Dueño** → tiene uno o más **apartamentos**.
- **Apartamento** → tiene un **inquilino** activo y una renta mensual.
- **Cobro** → pago de renta registrado para un inquilino en un mes específico.
- **Gasto** → costo pagado en representación del dueño (reparaciones, etc.),
  asociado a un apartamento o de forma general al dueño. Se descuenta del
  reporte mensual.

El **reporte mensual** de un dueño muestra, por apartamento, la renta cobrada
en el mes, resta los gastos pagados en su nombre, y calcula el monto neto a
pagarle.

## Desarrollo local

```bash
npm install
npx prisma migrate dev
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

La base de datos es SQLite local (`prisma/dev.db`, no se sube al repo).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite

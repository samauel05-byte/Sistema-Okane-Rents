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
cp .env.example .env   # y coloca tu DATABASE_URL de Prisma Postgres
npx prisma migrate dev
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La primera vez te pedirá
crear la cuenta de administrador.

La primera vez que corras la app con una base de datos nueva, no habrá
usuarios: la pantalla de login te deja crear la cuenta de administrador. Esto
también crea automáticamente los roles "Administrador" y "Gestor".

## Login y permisos

- **Administrador**: acceso total, incluyendo crear usuarios y roles desde
  `/admin/users` y `/admin/roles`.
- **Roles personalizados**: un administrador puede crear roles nuevos con
  permisos específicos (cobros, gastos, apartamentos, reportes) y decidir si
  ese rol ve todos los apartamentos o solo los que se le asignen por usuario.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + Prisma Postgres

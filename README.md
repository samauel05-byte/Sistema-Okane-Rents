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

Desde **Facturas** se puede generar un **recibo de pago** para un inquilino
(por una renta cobrada) o una **factura de gestión** para un dueño (por el
servicio de administración), ambos con numeración consecutiva, NCF/RNC
opcionales y listos para imprimir/guardar como PDF. Los datos del negocio que
aparecen como emisor se configuran en `/admin/business`.

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

## Despliegue

En Vercel, el build de producción (`scripts/build.sh`) corre
`prisma migrate deploy` automáticamente antes de compilar, así que cualquier
migración nueva se aplica sola al desplegar a producción — no hace falta
correrla a mano. Los builds de preview no tocan la base de datos.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + Prisma Postgres

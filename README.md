# Sistema Okane Rents

Sistema web para llevar los cobros de renta a inquilinos y generar el reporte
mensual de cuánto se le debe pagar a cada propietario (renta cobrada, menos
comisión de gestión y eventualidades pagadas en su representación).

## Modelo

- **Propietario** → tiene uno o más **apartamentos**.
- **Apartamento** → tiene un **inquilino** activo, una renta mensual (en
  RD$, US$ o €), un día de pago, un porcentaje de mora, un porcentaje de
  comisión de gestión y un gestor asignado.
- **Inquilino** → nombre, contacto y RNC/cédula obligatorios; fecha de
  inicio de contrato, fin de contrato y estado del contrato (Vigente / En
  renovación / Por vencer). Solo puede haber un inquilino activo por
  apartamento a la vez; los anteriores quedan en el historial.
- **Cobro** → pago de renta registrado para un inquilino en un mes
  específico. Al registrarlo se genera automáticamente un recibo para el
  inquilino.
- **Eventualidad** → costo pagado en representación del propietario
  (reparaciones, etc.), asociado a un apartamento o de forma general al
  propietario, con un responsable opcional. Se descuenta del reporte
  mensual del apartamento correspondiente.
- **Mora** → si un inquilino se atrasa más de 2 meses, se marca en rojo en
  Inquilinos; el porcentaje de mora (máx. 10%) se define por apartamento y
  se suma al reporte mensual cuando no hay cobro en el período.

### Reporte mensual (por apartamento)

Cada apartamento tiene su propio reporte mensual (`/reports/{apartamentId}`),
con el mismo formato que se le envía al propietario: datos generales, datos
del arrendamiento, resumen financiero (renta cobrada, mora, comisión de
gestión, gastos de mantenimiento y monto neto a remitir), estatus de pago al
propietario (pendiente/remitido, con método y cuenta destino), mantenimiento
e incidencias, y observaciones. Queda en tema claro para que se vea bien al
imprimir o guardar como PDF.

### Facturas y recibos

Desde **Facturas** se puede generar un **recibo de pago** para un inquilino
(por una renta cobrada) o una **factura de gestión** para un propietario
(por el servicio de administración), ambos con numeración consecutiva,
NCF/RNC opcionales y listos para imprimir/guardar como PDF. Los datos del
negocio que aparecen como emisor, así como el logo y el favicon, se
configuran en `/admin/business`.

## Sesión

Por seguridad, la sesión se cierra automáticamente tras 5 minutos sin
actividad (mouse, teclado, touch o scroll). Las sesiones normales duran 30
días si el sistema sigue en uso.

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
  permisos específicos (cobros, eventualidades, apartamentos, reportes) y
  decidir si ese rol ve todos los apartamentos o solo los que se le asignen
  por usuario.

## Despliegue

En Vercel, el build de producción (`scripts/build.sh`) corre
`prisma migrate deploy` automáticamente antes de compilar, así que cualquier
migración nueva se aplica sola al desplegar a producción — no hace falta
correrla a mano. Los builds de preview no tocan la base de datos.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS (tema oscuro)
- Prisma + Prisma Postgres

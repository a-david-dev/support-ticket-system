# Sistema de Tickets / Soporte Tecnico

Proyecto full-stack para el portafolio de Ariel David Hernandez Padilla. Conecta experiencia real de soporte tecnico con desarrollo web: usuarios levantan tickets, tecnicos dan seguimiento y administradores revisan carga operativa.

## Capturas

### Login

![Login](public/screenshots/login.png)

### Dashboard

![Dashboard](public/screenshots/dashboard.png)

### Detalle y gestion de ticket

![Detalle de ticket](public/screenshots/ticket-detail.png)

## Stack

- Next.js App Router + TypeScript
- PostgreSQL + Prisma
- Server Actions para formularios internos
- API REST para consumo externo
- Auth propia con cookie HTTP-only y password hash con bcrypt
- Zod para validaciones
- Tailwind CSS
- Docker Compose para base de datos local

## Funcionalidades

- Registro e inicio de sesion
- Roles `USER`, `TECHNICIAN` y `ADMIN`
- CRUD de tickets: crear, listar, editar, eliminar y consultar detalle
- Estados: abierto, en proceso, resuelto y cerrado
- Prioridades: baja, media y alta
- Comentarios por ticket
- Historial de actividad
- Asignacion de tecnico
- Dashboard con metricas
- Filtros por busqueda, estado y prioridad
- Paginacion
- Modo claro / oscuro persistente
- API REST protegida por sesion
- Seed con usuarios demo

## Credenciales demo

Todas usan la contrasena `Demo1234!`.

| Rol | Correo |
| --- | --- |
| Admin | `admin@demo.com` |
| Tecnico | `tecnico@demo.com` |
| Usuario | `usuario@demo.com` |

## Ejecutar localmente

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

Abre `http://localhost:3000`. Si el puerto esta ocupado, Next.js usara otro puerto disponible.

## Variables de entorno

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/support_tickets?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
```

Para deploy usa una base PostgreSQL administrada, por ejemplo Neon, Supabase, Railway o Render, y reemplaza `DATABASE_URL` por la cadena publica del proveedor.

## API REST

La API usa la misma cookie de sesion que la app web. Primero inicia sesion y luego consume los endpoints desde el navegador, Postman o un cliente HTTP que conserve cookies.

### `GET /api/tickets`

Lista tickets visibles para el usuario autenticado.

Query params opcionales:

- `q`: busqueda por titulo, descripcion o categoria
- `status`: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`
- `priority`: `LOW`, `MEDIUM`, `HIGH`
- `page`: pagina
- `pageSize`: elementos por pagina, maximo 50

Ejemplo:

```bash
curl "http://localhost:3000/api/tickets?status=OPEN&page=1&pageSize=10"
```

### `POST /api/tickets`

Crea un ticket.

```bash
curl -X POST "http://localhost:3000/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "No enciende el monitor",
    "description": "El equipo arranca pero el monitor no muestra imagen.",
    "category": "Hardware",
    "priority": "HIGH"
  }'
```

### `GET /api/tickets/:id`

Devuelve detalle, comentarios e historial de un ticket visible para el usuario.

### `PATCH /api/tickets/:id`

Actualiza datos principales del ticket.

```bash
curl -X PATCH "http://localhost:3000/api/tickets/TICKET_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "No enciende el monitor",
    "description": "Se revisa cable HDMI y fuente de energia.",
    "category": "Hardware",
    "priority": "HIGH",
    "status": "IN_PROGRESS",
    "assignedToId": ""
  }'
```

### `DELETE /api/tickets/:id`

Elimina un ticket. Permitido para admin o para el usuario creador del ticket.

## Deploy

1. Crea una base PostgreSQL administrada.
2. Configura `DATABASE_URL` y `AUTH_SECRET` en el proveedor de hosting.
3. Ejecuta migraciones contra la base remota.
4. Despliega la app.

Comandos sugeridos:

```bash
npm run db:migrate -- --name init
npm run build
```

En Vercel, el proyecto se puede desplegar como preview siempre que existan las variables de entorno remotas.

## Como explicarlo en entrevista

Este proyecto resuelve un problema cercano a soporte tecnico: organizar incidencias, priorizarlas, asignarlas y documentar seguimiento. A nivel tecnico demuestra:

- Modelado relacional con usuarios, tickets, comentarios e historial.
- Permisos por rol para usuario, tecnico y admin.
- Validacion compartida con Zod.
- Formularios internos con Server Actions.
- API REST para demostrar backend tradicional.
- Consultas con filtros, busqueda y paginacion.
- UI operativa con dashboard y detalle editable.
- Preparacion para deploy con Docker, Prisma y variables de entorno.

Una forma breve de presentarlo:

> "Construí un sistema de tickets full-stack inspirado en mi experiencia de soporte tecnico. Permite que usuarios creen incidencias, que tecnicos las asignen y actualicen, y que administradores revisen metricas. Use Next.js, TypeScript, Prisma y PostgreSQL, con auth por cookie HTTP-only, validaciones Zod, Server Actions para la UI y endpoints REST para exponer el backend."

## Backlog realista

- SLA por prioridad y vencimiento automatico.
- Adjuntos por ticket.
- Notificaciones por correo.
- Exportacion CSV.
- Tests unitarios de permisos.
- Pruebas e2e del flujo login-ticket-comentario.
- CI con migraciones y build.

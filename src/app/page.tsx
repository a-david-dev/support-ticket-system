import Link from "next/link";
import { Priority, TicketStatus } from "@prisma/client";
import { BarChart3, CheckCircle2, Clock3, LifeBuoy, LogOut, PlusCircle, Search, ShieldCheck } from "lucide-react";
import { createTicketAction, logoutAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { canManageQueue, visibleTicketWhere } from "@/lib/permissions";
import { getPrisma } from "@/lib/prisma";
import { priorityLabels, priorityStyles, statusLabels, statusStyles } from "@/lib/ticket-labels";

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof BarChart3 }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        <Icon className="text-emerald-700" size={20} />
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex min-w-20 items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium leading-none ring-1 ${className}`}>{children}</span>;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: TicketStatus; priority?: Priority; q?: string; page?: string; error?: string; deleted?: string }>;
}) {
  const user = await requireUser();
  const prisma = getPrisma();
  const params = await searchParams;
  const page = Math.max(Number(params.page ?? 1), 1);
  const pageSize = 8;

  const where = {
    AND: [
      visibleTicketWhere(user),
      params.status ? { status: params.status } : {},
      params.priority ? { priority: params.priority } : {},
      params.q
        ? {
            OR: [
              { title: { contains: params.q, mode: "insensitive" as const } },
              { description: { contains: params.q, mode: "insensitive" as const } },
              { category: { contains: params.q, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };

  const [tickets, total, metrics, technicians] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: { createdBy: true, assignedTo: true },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ticket.count({ where }),
    prisma.ticket.groupBy({ by: ["status"], _count: true, where: visibleTicketWhere(user) }),
    prisma.user.findMany({
      where: { role: { in: ["TECHNICIAN", "ADMIN"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  const metric = (status: TicketStatus) => metrics.find((item) => item.status === status)?._count ?? 0;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <main className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-md bg-emerald-700 text-white">
              <LifeBuoy size={23} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Mesa de Ayuda TI</h1>
              <p className="text-sm text-zinc-500">
                {user.name} · {user.role === "ADMIN" ? "Administrador" : user.role === "TECHNICIAN" ? "Tecnico" : "Usuario"}
              </p>
            </div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium hover:bg-zinc-50">
              <LogOut size={16} />
              Salir
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          {params.error === "ticket" ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              No se pudo crear el ticket. Usa titulo de al menos 3 caracteres, descripcion de al menos 5 y categoria de al menos 2.
            </div>
          ) : null}
          {params.deleted ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              Ticket eliminado correctamente.
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Abiertos" value={metric("OPEN")} icon={LifeBuoy} />
            <StatCard label="En proceso" value={metric("IN_PROGRESS")} icon={Clock3} />
            <StatCard label="Resueltos" value={metric("RESOLVED")} icon={CheckCircle2} />
            <StatCard label="Total visible" value={total} icon={BarChart3} />
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <form className="grid gap-3 border-b border-zinc-200 p-4 md:grid-cols-[1fr_150px_150px_auto]">
              <label className="relative">
                <Search className="absolute left-3 top-3 text-zinc-400" size={17} />
                <input
                  name="q"
                  defaultValue={params.q}
                  placeholder="Buscar por titulo, categoria o descripcion"
                  className="h-11 w-full rounded-md border border-zinc-300 pl-9 pr-3 text-sm"
                />
              </label>
              <select name="status" aria-label="Filtrar por estado" defaultValue={params.status ?? ""} className="h-11 rounded-md border border-zinc-300 px-3 text-sm">
                <option value="">Todos los estados</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select name="priority" aria-label="Filtrar por prioridad" defaultValue={params.priority ?? ""} className="h-11 rounded-md border border-zinc-300 px-3 text-sm">
                <option value="">Todas las prioridades</option>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button type="submit" className="h-11 rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white">Filtrar</button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Ticket</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Prioridad</th>
                    <th className="px-4 py-3">Solicitante</th>
                    <th className="px-4 py-3">Tecnico</th>
                    <th className="px-4 py-3">Actualizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-4">
                        <Link href={`/tickets/${ticket.id}`} className="font-semibold text-zinc-900 hover:text-emerald-800">
                          {ticket.title}
                        </Link>
                        <p className="mt-1 text-xs text-zinc-500">{ticket.category}</p>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={statusStyles[ticket.status]}>{statusLabels[ticket.status]}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={priorityStyles[ticket.priority]}>{priorityLabels[ticket.priority]}</Badge>
                      </td>
                      <td className="px-4 py-4 text-zinc-600">{ticket.createdBy.name}</td>
                      <td className="px-4 py-4 text-zinc-600">{ticket.assignedTo?.name ?? "Sin asignar"}</td>
                      <td className="px-4 py-4 font-mono text-xs text-zinc-500">{ticket.updatedAt.toLocaleDateString("es-MX")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-sm text-zinc-500">
              <span>
                Pagina {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Link className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50" href={`/?page=${Math.max(page - 1, 1)}`}>
                  Anterior
                </Link>
                <Link className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50" href={`/?page=${Math.min(page + 1, totalPages)}`}>
                  Siguiente
                </Link>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <PlusCircle size={19} className="text-emerald-700" />
              <h2 className="font-semibold">Nuevo ticket</h2>
            </div>
            <form action={createTicketAction} className="space-y-4">
              <input name="title" minLength={3} placeholder="Ej. No enciende mi monitor" className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm" required />
              <textarea name="description" minLength={5} placeholder="Describe el problema, pasos intentados y urgencia." rows={5} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required />
              <div className="grid grid-cols-2 gap-3">
                <input name="category" minLength={2} placeholder="Categoria" className="h-11 rounded-md border border-zinc-300 px-3 text-sm" required />
                <select name="priority" aria-label="Prioridad del ticket" defaultValue="MEDIUM" className="h-11 rounded-md border border-zinc-300 px-3 text-sm">
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                </select>
              </div>
              <button type="submit" className="h-11 w-full rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">
                Crear ticket
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck size={19} className="text-emerald-700" />
              <h2 className="font-semibold">Equipo disponible</h2>
            </div>
            <div className="space-y-3">
              {technicians.map((tech) => (
                <div key={tech.id} className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-sm">
                  <span>{tech.name}</span>
                  <span className="text-xs text-zinc-500">{tech.role === "ADMIN" ? "Admin" : "Tecnico"}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-zinc-500">
              {canManageQueue(user)
                ? "Tu rol puede asignar tecnicos y actualizar la cola completa."
                : "Como usuario puedes crear tickets, comentar y seguir tus solicitudes."}
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}

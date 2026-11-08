import Link from "next/link";
import { Priority, TicketStatus } from "@prisma/client";
import { BarChart3, CheckCircle2, ChevronDown, Clock3, Columns3, LifeBuoy, LogOut, Search } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { NewTicketPanel } from "@/app/new-ticket-panel";
import { AssigneeCombobox } from "@/app/assignee-combobox";
import { requireUser } from "@/lib/auth";
import { canManageQueue, visibleTicketWhere } from "@/lib/permissions";
import { getPrisma } from "@/lib/prisma";
import { priorityLabels, priorityStyles, statusLabels, statusStyles } from "@/lib/ticket-labels";

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof BarChart3 }) {
  return (
    <div className="flex min-w-40 flex-1 items-center gap-2 border-b-2 border-emerald-600 px-3 py-1.5">
      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700">
        <Icon size={15} />
      </span>
      <p className="whitespace-nowrap text-xs font-medium text-zinc-500">{label}</p>
      <p className="ml-auto text-lg font-semibold tabular-nums text-zinc-900">{value}</p>
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
  const canAssign = canManageQueue(user);
  const page = Math.max(Number(params.page ?? 1), 1);
  const pageSize = 8;

  const where = {
    AND: [
      visibleTicketWhere(user),
      // Los tickets cerrados se ocultan por defecto; solo aparecen si se filtra por ese estado.
      params.status ? { status: params.status } : { status: { not: TicketStatus.CLOSED } },
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

  const [tickets, total, metrics, assignableUsers] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: { createdBy: true, assignedTo: true },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ticket.count({ where }),
    prisma.ticket.groupBy({ by: ["status"], _count: true, where: visibleTicketWhere(user) }),
    canAssign
      ? prisma.user.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const metric = (status: TicketStatus) => metrics.find((item) => item.status === status)?._count ?? 0;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  // Construye el href de la vista (Activos / Cerrados) conservando los filtros activos.
  const viewHref = (status?: string) => {
    const search = new URLSearchParams();
    if (status) search.set("status", status);
    if (params.priority) search.set("priority", params.priority);
    if (params.q) search.set("q", params.q);
    const query = search.toString();
    return query ? `/?${query}` : "/";
  };

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
              <p className="text-sm text-zinc-500">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/board" className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium hover:bg-zinc-50">
              <Columns3 size={16} />
              Tablero
            </Link>
            <NewTicketPanel assignableUsers={assignableUsers} canAssign={canAssign} />
            <form action={logoutAction}>
              <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium hover:bg-zinc-50">
                <LogOut size={16} />
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-6">
        <section className="min-w-0 space-y-6">
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
          <section aria-label="Resumen de tickets" className="flex gap-3 overflow-x-auto">
            <StatCard label="Abiertos" value={metric("OPEN")} icon={LifeBuoy} />
            <StatCard label="En proceso" value={metric("IN_PROGRESS")} icon={Clock3} />
            <StatCard label="Resueltos" value={metric("RESOLVED")} icon={CheckCircle2} />
            <StatCard label="Total visible" value={total} icon={BarChart3} />
          </section>

          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <form className="flex flex-wrap items-center gap-2 border-b border-zinc-200 p-3">
              <div role="group" aria-label="Vista de tickets" className="flex shrink-0 rounded-full bg-zinc-100 p-1 ring-1 ring-zinc-200">
                <Link
                  href={viewHref()}
                  aria-current={params.status ? undefined : "true"}
                  className={`inline-flex h-8 items-center rounded-full px-4 text-sm font-medium transition hover:bg-zinc-200 ${params.status ? "text-zinc-600" : "bg-zinc-900 text-white"}`}
                >
                  Activos
                </Link>
                <Link
                  href={viewHref(TicketStatus.CLOSED)}
                  aria-current={params.status === TicketStatus.CLOSED ? "true" : undefined}
                  className={`inline-flex h-8 items-center rounded-full px-4 text-sm font-medium transition hover:bg-zinc-200 ${params.status === TicketStatus.CLOSED ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
                >
                  Cerrados
                </Link>
              </div>
              <label className="relative w-full shrink-0 sm:w-80">
                <Search className="absolute left-3 top-3 text-zinc-400" size={17} />
                <input
                  name="q"
                  defaultValue={params.q}
                  placeholder="Buscar tickets"
                  className="h-11 w-full rounded-md border border-zinc-300 pl-9 pr-3 text-sm"
                />
              </label>
              <div className="relative">
                <select key={params.status ?? ""} name="status" aria-label="Filtrar por estado" defaultValue={params.status ?? ""} className="h-10 w-44 appearance-none rounded-full bg-zinc-100 pl-4 pr-10 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 outline-none transition hover:bg-zinc-200 focus:ring-2 focus:ring-emerald-600">
                  <option value="">Estado · Todos</option>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      Estado · {label}
                    </option>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              </div>
              <div className="relative">
                <select key={params.priority ?? ""} name="priority" aria-label="Filtrar por prioridad" defaultValue={params.priority ?? ""} className="h-10 w-44 appearance-none rounded-full bg-zinc-100 pl-4 pr-10 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 outline-none transition hover:bg-zinc-200 focus:ring-2 focus:ring-emerald-600">
                  <option value="">Prioridad · Todas</option>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      Prioridad · {label}
                    </option>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              </div>
              <button type="submit" aria-label="Aplicar filtros" className="ml-auto grid size-10 place-items-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-700">
                <Search size={17} />
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Ticket</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Prioridad</th>
                    <th className="px-4 py-3">Solicitante</th>
                    <th className="px-4 py-3">Responsable</th>
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
                      <td className="px-4 py-4 text-zinc-600">
                        {canAssign ? <AssigneeCombobox ticketId={ticket.id} initialAssigneeId={ticket.assignedToId} users={assignableUsers} /> : ticket.assignedTo?.name ?? "Sin asignar"}
                      </td>
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

      </div>
    </main>
  );
}

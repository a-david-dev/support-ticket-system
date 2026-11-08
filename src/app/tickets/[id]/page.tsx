import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TicketStatus } from "@prisma/client";
import { ArrowLeft, MessageSquare, Send, Settings2, Timeline } from "lucide-react";
import { addCommentAction, deleteTicketAction, updateTicketAction } from "@/app/actions";
import { DeleteTicketForm } from "@/app/tickets/[id]/delete-ticket-form";
import { requireUser } from "@/lib/auth";
import { canDeleteTicket, canEditAssignee, canUpdateTicket } from "@/lib/permissions";
import { getPrisma } from "@/lib/prisma";
import { priorityLabels, priorityStyles, statusLabels, statusStyles } from "@/lib/ticket-labels";

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex min-w-20 items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium leading-none ring-1 ${className}`}>{children}</span>;
}

export default async function TicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const prisma = getPrisma();

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      createdBy: true,
      assignedTo: true,
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      activity: { include: { actor: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!ticket) notFound();
  if (!canUpdateTicket(user, ticket)) redirect("/");

  const technicians = await prisma.user.findMany({
    where: { role: { in: ["TECHNICIAN", "ADMIN"] } },
    orderBy: { name: "asc" },
  });

  const updateTicket = updateTicketAction.bind(null, ticket.id);
  const addComment = addCommentAction.bind(null, ticket.id);
  const deleteTicket = deleteTicketAction.bind(null, ticket.id);

  return (
    <main className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800">
          <ArrowLeft size={16} />
          Volver al dashboard
        </Link>

        {query.saved ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Cambios guardados correctamente.
          </div>
        ) : null}
        {query.error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {query.error === "delete"
              ? "No tienes permisos para eliminar este ticket."
              : "Revisa los campos: titulo minimo 3 caracteres, descripcion minima 5 y categoria minima 2."}
          </div>
        ) : null}

        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge className={statusStyles[ticket.status]}>{statusLabels[ticket.status]}</Badge>
                <Badge className={priorityStyles[ticket.priority]}>{priorityLabels[ticket.priority]}</Badge>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200">
                  {ticket.category}
                </span>
              </div>
              <h1 className="max-w-3xl text-2xl font-semibold">{ticket.title}</h1>
              <p className="mt-3 max-w-3xl leading-7 text-zinc-600">{ticket.description}</p>
            </div>
            <div className="rounded-md bg-zinc-50 p-4 text-sm text-zinc-600 md:min-w-64">
              <p>
                <span className="font-medium text-zinc-900">Solicitante:</span> {ticket.createdBy.name}
              </p>
              <p className="mt-2">
                <span className="font-medium text-zinc-900">Tecnico:</span> {ticket.assignedTo?.name ?? "Sin asignar"}
              </p>
              <p className="mt-2 font-mono text-xs">Creado: {ticket.createdAt.toLocaleString("es-MX")}</p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-6">
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquare size={19} className="text-emerald-700" />
                <h2 className="font-semibold">Comentarios</h2>
              </div>
              <div className="space-y-4">
                {ticket.comments.length === 0 ? (
                  <p className="rounded-md bg-zinc-50 p-4 text-sm text-zinc-500">Aun no hay comentarios.</p>
                ) : (
                  ticket.comments.map((comment) => (
                    <article key={comment.id} className="rounded-md border border-zinc-200 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{comment.author.name}</span>
                        <span className="font-mono text-xs text-zinc-500">{comment.createdAt.toLocaleString("es-MX")}</span>
                      </div>
                      <p className="leading-6 text-zinc-600">{comment.body}</p>
                    </article>
                  ))
                )}
              </div>

              <form action={addComment} className="mt-5 space-y-3">
                <textarea name="body" rows={4} placeholder="Agregar seguimiento, diagnostico o solucion aplicada..." className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required />
                <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">
                  <Send size={16} />
                  Comentar
                </button>
              </form>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Settings2 size={19} className="text-emerald-700" />
                <h2 className="font-semibold">Gestionar ticket</h2>
              </div>
              <form action={updateTicket} className="space-y-4">
                <label className="block text-sm font-medium">
                  Titulo
                  <input name="title" defaultValue={ticket.title} minLength={3} className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm" required />
                </label>
                <label className="block text-sm font-medium">
                  Descripcion
                  <textarea name="description" defaultValue={ticket.description} minLength={5} rows={4} className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required />
                </label>
                <label className="block text-sm font-medium">
                  Categoria
                  <input name="category" defaultValue={ticket.category} minLength={2} className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm" required />
                </label>
                <label className="block text-sm font-medium">
                  Estado
                  <select name="status" defaultValue={ticket.status} className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm">
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium">
                  Prioridad
                  <select name="priority" defaultValue={ticket.priority} className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm">
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium">
                  Tecnico asignado
                  <select
                    name="assignedToId"
                    defaultValue={ticket.assignedToId ?? ""}
                    disabled={!canEditAssignee(user, ticket)}
                    className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm disabled:bg-zinc-100"
                  >
                    <option value="">Sin asignar</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                </label>
                {ticket.status === TicketStatus.CLOSED ? (
                  <p className="text-xs text-zinc-500">El responsable no puede cambiarse porque el ticket esta cerrado.</p>
                ) : null}
                <button type="submit" className="h-10 w-full rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white">
                  Guardar cambios
                </button>
              </form>
              {canDeleteTicket(user, ticket) ? (
                <DeleteTicketForm action={deleteTicket} />
              ) : null}
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Timeline size={19} className="text-emerald-700" />
                <h2 className="font-semibold">Historial</h2>
              </div>
              <div className="space-y-4">
                {ticket.activity.map((item) => (
                  <div key={item.id} className="border-l-2 border-emerald-700 pl-3">
                    <p className="text-sm font-medium">{item.message}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.actor.name} · {item.createdAt.toLocaleString("es-MX")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

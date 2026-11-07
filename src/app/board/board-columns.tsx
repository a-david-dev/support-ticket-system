"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Priority, TicketStatus } from "@prisma/client";
import { GripVertical, LoaderCircle } from "lucide-react";
import { updateTicketStatusAction } from "@/app/actions";
import { priorityLabels, priorityStyles, statusLabels } from "@/lib/ticket-labels";

type BoardTicket = {
  id: string;
  title: string;
  category: string;
  priority: Priority;
  status: TicketStatus;
  requester: string;
  canUpdate: boolean;
};

const boardStatuses: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export function BoardColumns({ initialTickets }: { initialTickets: BoardTicket[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [isPending, startTransition] = useTransition();

  function moveTicket(ticketId: string, status: TicketStatus) {
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!ticket || !ticket.canUpdate || ticket.status === status) return;

    setTickets((items) => items.map((item) => (item.id === ticketId ? { ...item, status } : item)));
    startTransition(async () => {
      await updateTicketStatusAction(ticketId, status);
    });
  }

  return (
    <div className="grid min-w-[960px] grid-cols-4 gap-4">
      {boardStatuses.map((status) => {
        const columnTickets = tickets.filter((ticket) => ticket.status === status);

        return (
          <section
            key={status}
            aria-label={statusLabels[status]}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              moveTicket(event.dataTransfer.getData("text/plain"), status);
            }}
            className="min-h-96 rounded-xl bg-zinc-100/80 p-3"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-zinc-800">{statusLabels[status]}</h2>
              <span className="grid size-6 place-items-center rounded-full bg-white text-xs font-semibold text-zinc-500">{columnTickets.length}</span>
            </div>

            <div className="space-y-3">
              {columnTickets.map((ticket) => (
                <article
                  key={ticket.id}
                  draggable={ticket.canUpdate}
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", ticket.id)}
                  className={`rounded-lg border border-zinc-200 bg-white p-3 shadow-sm ${ticket.canUpdate ? "cursor-grab active:cursor-grabbing" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {ticket.canUpdate ? <GripVertical aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-zinc-400" /> : null}
                    <Link href={`/tickets/${ticket.id}`} className="min-w-0 flex-1 text-sm font-semibold leading-5 text-zinc-900 hover:text-emerald-700">
                      {ticket.title}
                    </Link>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">{ticket.category} · {ticket.requester}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${priorityStyles[ticket.priority]}`}>{priorityLabels[ticket.priority]}</span>
                    {ticket.canUpdate ? (
                      <label className="sr-only" htmlFor={`ticket-status-${ticket.id}`}>Cambiar estado de {ticket.title}</label>
                    ) : null}
                    {ticket.canUpdate ? (
                      <select
                        id={`ticket-status-${ticket.id}`}
                        value={ticket.status}
                        onChange={(event) => moveTicket(ticket.id, event.target.value as TicketStatus)}
                        className="h-8 max-w-28 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-600"
                      >
                        {boardStatuses.map((option) => (
                          <option key={option} value={option}>{statusLabels[option]}</option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                </article>
              ))}
              {columnTickets.length === 0 ? <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-5 text-center text-xs text-zinc-500">Sin tickets</p> : null}
            </div>
          </section>
        );
      })}
      {isPending ? <span className="fixed bottom-5 right-5 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-lg"><LoaderCircle size={16} className="animate-spin" /> Guardando estado</span> : null}
    </div>
  );
}

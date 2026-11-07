import Link from "next/link";
import { LayoutDashboard, LifeBuoy, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { NewTicketPanel } from "@/app/new-ticket-panel";
import { BoardColumns } from "@/app/board/board-columns";
import { requireUser } from "@/lib/auth";
import { canUpdateTicket, visibleTicketWhere } from "@/lib/permissions";
import { getPrisma } from "@/lib/prisma";

export default async function BoardPage() {
  const user = await requireUser();
  const prisma = getPrisma();
  const tickets = await prisma.ticket.findMany({
    where: visibleTicketWhere(user),
    include: { createdBy: { select: { name: true } } },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <main className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-md bg-emerald-700 text-white"><LifeBuoy size={23} /></div>
            <div>
              <h1 className="text-xl font-semibold">Mesa de Ayuda TI</h1>
              <p className="text-sm text-zinc-500">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium hover:bg-zinc-50">
              <LayoutDashboard size={16} />
              Tabla
            </Link>
            <NewTicketPanel />
            <form action={logoutAction}>
              <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium hover:bg-zinc-50"><LogOut size={16} /> Salir</button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-emerald-700">Vista de trabajo</p>
            <h2 className="text-2xl font-semibold tracking-tight">Tablero de tickets</h2>
          </div>
          <p className="text-sm text-zinc-500">Arrastra una tarjeta para actualizar su estado.</p>
        </div>
        <div className="overflow-x-auto pb-3">
          <BoardColumns initialTickets={tickets.map((ticket) => ({
            id: ticket.id,
            title: ticket.title,
            category: ticket.category,
            priority: ticket.priority,
            status: ticket.status,
            requester: ticket.createdBy.name,
            canUpdate: canUpdateTicket(user, ticket),
          }))} />
        </div>
      </div>
    </main>
  );
}

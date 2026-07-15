import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { canDeleteTicket, canManageQueue, canUpdateTicket } from "@/lib/permissions";
import { getPrisma } from "@/lib/prisma";
import { updateTicketSchema } from "@/lib/ticket-schemas";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const prisma = getPrisma();
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      comments: { include: { author: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "asc" } },
      activity: { include: { actor: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canUpdateTicket(user, ticket)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ data: ticket });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const prisma = getPrisma();
  const ticket = await prisma.ticket.findUnique({ where: { id } });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canUpdateTicket(user, ticket)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = updateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const canAssign = canManageQueue(user);
  const assignedToId = parsed.data.assignedToId || null;
  const updated = await prisma.ticket.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      priority: parsed.data.priority,
      status: parsed.data.status,
      assignedToId: canAssign ? assignedToId : ticket.assignedToId,
      activity: {
        create: {
          actorId: user.id,
          type: "STATUS_CHANGED",
          message: "Ticket actualizado desde API REST.",
        },
      },
    },
    include: { createdBy: { select: { id: true, name: true, email: true } }, assignedTo: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const prisma = getPrisma();
  const ticket = await prisma.ticket.findUnique({ where: { id } });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canDeleteTicket(user, ticket)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.ticket.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}

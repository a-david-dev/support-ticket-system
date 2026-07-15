import { NextRequest, NextResponse } from "next/server";
import { Priority, TicketStatus } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import { visibleTicketWhere } from "@/lib/permissions";
import { getPrisma } from "@/lib/prisma";
import { ticketSchema } from "@/lib/ticket-schemas";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? 10), 1), 50);
  const status = searchParams.get("status") as TicketStatus | null;
  const priority = searchParams.get("priority") as Priority | null;
  const q = searchParams.get("q");

  const where = {
    AND: [
      visibleTicketWhere(user),
      status ? { status } : {},
      priority ? { priority } : {},
      q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { description: { contains: q, mode: "insensitive" as const } },
              { category: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: { createdBy: { select: { id: true, name: true, email: true } }, assignedTo: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ticket.count({ where }),
  ]);

  return NextResponse.json({ data: tickets, meta: { page, pageSize, total } });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = ticketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const prisma = getPrisma();
  const ticket = await prisma.ticket.create({
    data: {
      ...parsed.data,
      createdById: user.id,
      activity: {
        create: {
          actorId: user.id,
          type: "CREATED",
          message: "Ticket creado desde API REST.",
        },
      },
    },
    include: { createdBy: { select: { id: true, name: true, email: true } }, assignedTo: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ data: ticket }, { status: 201 });
}

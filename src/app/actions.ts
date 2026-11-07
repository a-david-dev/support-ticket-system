"use server";

import { Prisma, Role, TicketStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, requireUser, validateCredentials } from "@/lib/auth";
import { canDeleteTicket, canManageQueue, canUpdateTicket } from "@/lib/permissions";
import { getPrisma } from "@/lib/prisma";
import { ticketSchema, updateTicketSchema } from "@/lib/ticket-schemas";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
});

const boardStatusSchema = z.nativeEnum(TicketStatus);

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const user = await validateCredentials(email, password);

  if (!user) redirect("/login?error=invalid");

  await createSession(user);
  redirect("/");
}

export async function registerAction(formData: FormData) {
  const prisma = getPrisma();
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/register?error=invalid");

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  let user;

  try {
    user = await prisma.user.create({
      data: {
        ...parsed.data,
        passwordHash,
        role: Role.USER,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect("/register?error=exists");
    }

    throw error;
  }

  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role });
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function createTicketAction(formData: FormData) {
  const user = await requireUser();
  const prisma = getPrisma();
  const parsed = ticketSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/?error=ticket");

  const ticket = await prisma.ticket.create({
    data: {
      ...parsed.data,
      createdById: user.id,
      activity: {
        create: {
          actorId: user.id,
          type: "CREATED",
          message: "Ticket creado por el usuario.",
        },
      },
    },
  });

  revalidatePath("/");
  redirect(`/tickets/${ticket.id}`);
}

export async function updateTicketAction(ticketId: string, formData: FormData) {
  const user = await requireUser();
  const prisma = getPrisma();
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || !canUpdateTicket(user, ticket)) redirect("/");

  const parsed = updateTicketSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/tickets/${ticketId}?error=invalid`);

  const nextStatus = parsed.data.status;
  const nextPriority = parsed.data.priority;
  const assignedToId = parsed.data.assignedToId || null;
  const canAssign = canManageQueue(user);

  const updates: string[] = [];
  if (parsed.data.title !== ticket.title) updates.push("Titulo actualizado.");
  if (parsed.data.description !== ticket.description) updates.push("Descripcion actualizada.");
  if (parsed.data.category !== ticket.category) updates.push("Categoria actualizada.");
  if (nextStatus !== ticket.status) updates.push(`Estado actualizado a ${nextStatus}.`);
  if (nextPriority !== ticket.priority) updates.push(`Prioridad actualizada a ${nextPriority}.`);
  if (canAssign && assignedToId !== ticket.assignedToId) updates.push("Asignacion de tecnico actualizada.");

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      status: nextStatus,
      priority: nextPriority,
      assignedToId: canAssign ? assignedToId : ticket.assignedToId,
      activity: {
        create: updates.map((message) => ({
          actorId: user.id,
          type: message.includes("Asignacion") ? "ASSIGNED" : "STATUS_CHANGED",
          message,
        })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath(`/tickets/${ticketId}`);
  redirect(`/tickets/${ticketId}?saved=1`);
}

export async function updateTicketStatusAction(ticketId: string, status: TicketStatus) {
  const user = await requireUser();
  const parsedStatus = boardStatusSchema.safeParse(status);
  if (!parsedStatus.success) return;

  const prisma = getPrisma();
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || !canUpdateTicket(user, ticket) || ticket.status === parsedStatus.data) return;

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: parsedStatus.data,
      activity: {
        create: {
          actorId: user.id,
          type: "STATUS_CHANGED",
          message: `Estado actualizado a ${parsedStatus.data}.`,
        },
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/board");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function addCommentAction(ticketId: string, formData: FormData) {
  const user = await requireUser();
  const prisma = getPrisma();
  const body = String(formData.get("body") ?? "").trim();
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

  if (!ticket || !canUpdateTicket(user, ticket) || body.length < 2) redirect(`/tickets/${ticketId}`);

  await prisma.comment.create({
    data: {
      body,
      ticketId,
      authorId: user.id,
    },
  });

  await prisma.activity.create({
    data: {
      ticketId,
      actorId: user.id,
      type: "COMMENTED",
      message: "Nuevo comentario agregado.",
    },
  });

  revalidatePath(`/tickets/${ticketId}`);
}

export async function deleteTicketAction(ticketId: string) {
  const user = await requireUser();
  const prisma = getPrisma();
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });

  if (!ticket || !canDeleteTicket(user, ticket)) redirect(`/tickets/${ticketId}?error=delete`);

  await prisma.ticket.delete({ where: { id: ticketId } });
  revalidatePath("/");
  redirect("/?deleted=1");
}

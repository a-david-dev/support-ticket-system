import { Role, Ticket, TicketStatus } from "@prisma/client";
import { SessionUser } from "@/lib/auth";

export function canManageQueue(user: SessionUser) {
  return user.role === Role.ADMIN || user.role === Role.TECHNICIAN;
}

// El responsable de un ticket cerrado queda fijo; ya no puede reasignarse.
export function canEditAssignee(user: SessionUser, ticket: Pick<Ticket, "status">) {
  return canManageQueue(user) && ticket.status !== TicketStatus.CLOSED;
}

export function canUpdateTicket(user: SessionUser, ticket: Pick<Ticket, "createdById" | "assignedToId">) {
  return canManageQueue(user) || ticket.createdById === user.id || ticket.assignedToId === user.id;
}

export function canDeleteTicket(user: SessionUser, ticket: Pick<Ticket, "createdById">) {
  return user.role === Role.ADMIN || ticket.createdById === user.id;
}

export function visibleTicketWhere(user: SessionUser) {
  if (canManageQueue(user)) return {};

  return {
    OR: [{ createdById: user.id }, { assignedToId: user.id }],
  };
}

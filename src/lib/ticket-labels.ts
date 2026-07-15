import { Priority, TicketStatus } from "@prisma/client";

export const statusLabels: Record<TicketStatus, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En proceso",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

export const priorityLabels: Record<Priority, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
};

export const statusStyles: Record<TicketStatus, string> = {
  OPEN: "bg-sky-100 text-sky-800 ring-sky-200",
  IN_PROGRESS: "bg-amber-100 text-amber-800 ring-amber-200",
  RESOLVED: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  CLOSED: "bg-zinc-200 text-zinc-700 ring-zinc-300",
};

export const priorityStyles: Record<Priority, string> = {
  LOW: "bg-teal-100 text-teal-800 ring-teal-200",
  MEDIUM: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  HIGH: "bg-rose-100 text-rose-800 ring-rose-200",
};

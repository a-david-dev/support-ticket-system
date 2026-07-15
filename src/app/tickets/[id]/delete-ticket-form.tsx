"use client";

import { Trash2 } from "lucide-react";

export function DeleteTicketForm({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      className="mt-3"
      onSubmit={(event) => {
        if (!window.confirm("Seguro que quieres eliminar este ticket? Esta accion no se puede deshacer.")) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-rose-300 bg-rose-50 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-100">
        <Trash2 size={16} />
        Eliminar ticket
      </button>
    </form>
  );
}

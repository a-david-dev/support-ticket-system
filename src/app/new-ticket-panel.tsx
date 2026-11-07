"use client";

import { useEffect, useRef, useState } from "react";
import { PlusCircle, X } from "lucide-react";
import { createTicketAction } from "@/app/actions";

export function NewTicketPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
      >
        <PlusCircle size={17} />
        Nuevo ticket
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/30 p-3 sm:p-5" role="presentation" onMouseDown={() => setIsOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-ticket-title"
            className="flex h-full w-full max-w-md flex-col rounded-xl bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <PlusCircle size={19} className="text-emerald-700" />
                <h2 id="new-ticket-title" className="font-semibold">Nuevo ticket</h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar formulario"
                className="grid size-9 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X size={18} />
              </button>
            </div>

            <form action={createTicketAction} className="space-y-4 p-5">
              <input name="title" minLength={3} placeholder="Ej. No enciende mi monitor" className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm" required />
              <textarea name="description" minLength={5} placeholder="Describe el problema, pasos intentados y urgencia." rows={6} className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" required />
              <div className="grid grid-cols-2 gap-3">
                <input name="category" minLength={2} placeholder="Categoria" className="h-11 rounded-md border border-zinc-300 px-3 text-sm" required />
                <select name="priority" aria-label="Prioridad del ticket" defaultValue="MEDIUM" className="h-11 rounded-md border border-zinc-300 px-3 text-sm">
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                </select>
              </div>
              <button type="submit" className="h-11 w-full rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">
                Crear ticket
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

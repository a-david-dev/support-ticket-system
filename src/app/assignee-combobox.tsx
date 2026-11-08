"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { updateTicketAssigneeAction } from "@/app/actions";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";

type AssignableUser = {
  id: string;
  name: string;
};

export function AssigneeCombobox({ ticketId, initialAssigneeId, users }: { ticketId: string; initialAssigneeId: string | null; users: AssignableUser[] }) {
  const [isPending, startTransition] = useTransition();
  const [assigneeName, setAssigneeName] = useState<string | null>(users.find((person) => person.id === initialAssigneeId)?.name ?? null);

  return (
    <div className="relative w-36">
      <Combobox
        items={users.map((person) => person.name)}
        value={assigneeName}
        onValueChange={(name) => {
          const nextName = name as string | null;
          const nextAssignee = users.find((person) => person.name === nextName);
          setAssigneeName(nextName);
          startTransition(async () => updateTicketAssigneeAction(ticketId, nextAssignee?.id ?? null));
        }}
      >
        <ComboboxInput aria-label="Responsable" placeholder="Sin asignar" showClear className="h-8 text-xs" />
        <ComboboxContent>
          <ComboboxEmpty>No se encontró ninguna persona.</ComboboxEmpty>
          <ComboboxList>
            {(name) => <ComboboxItem key={name} value={name}>{name}</ComboboxItem>}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {isPending ? <LoaderCircle aria-label="Guardando responsable" className="pointer-events-none absolute right-8 top-2 animate-spin text-muted-foreground" size={14} /> : null}
    </div>
  );
}

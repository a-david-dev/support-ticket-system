# Ticket Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the permanently visible ticket form with on-demand creation and add a permission-aware Kanban board for status changes.

**Architecture:** Keep the dashboard server-rendered for queries and permissions. Extract interactive creation and board controls into client components; server actions remain the sole authority for ticket creation and state updates.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, PostgreSQL, Tailwind CSS, Lucide icons.

**Spec:** `docs/superpowers/specs/2026-11-07-ticket-workspace-design.md`

## Global Constraints

- Keep the existing table dashboard as the default route and preserve search and filters.
- Reuse `createTicketAction`, authentication, authorization, activity logging, and Prisma validation.
- Do not add a database migration for this feature.
- Provide a non-drag control for changing status.

## Review Focus

- A regular user must not be able to change another user’s ticket from the board; test the server action authorization path.
- A card dropped in its current column must not create an unnecessary activity entry; test the no-op path.
- A status update must create the same activity record as the current detail form; test status updates from the board action.
- Creation validation errors must be understandable without losing the form context; exercise invalid title, description, and category values.
- Board layout must remain usable by keyboard and on narrow screens; verify the alternative status control and horizontal columns.

---

### Task 1: On-demand ticket creation

**Files:**
- Create: `src/app/new-ticket-panel.tsx`
- Modify: `src/app/page.tsx`
- Reuse: `src/app/actions.ts:createTicketAction`

**Interfaces:**
- Consumes: `createTicketAction(formData: FormData)`.
- Produces: `NewTicketPanel`, a client component that opens and closes an accessible creation panel.

- [ ] **Step 1: Create the failing browser check**

Verify that the dashboard initially shows `Nuevo ticket`, does not show its form fields, and displays them only after activating the button.

- [ ] **Step 2: Run the browser check to verify it fails**

Run: Playwright CLI snapshot against the authenticated dashboard.
Expected: the control or hidden panel does not yet exist.

- [ ] **Step 3: Implement `NewTicketPanel`**

Move the existing creation inputs into a client panel. Use the existing server action and keep the same field names, constraints, and Spanish copy.

- [ ] **Step 4: Replace the fixed dashboard aside form**

Render `NewTicketPanel` from the dashboard header/toolbar and retain the available-team card in the sidebar.

- [ ] **Step 5: Run the browser check to verify it passes**

Verify opening, closing, keyboard focus, and successful submission with demo data.

- [ ] **Step 6: Commit**

`git commit -m "feat: move ticket creation to a side panel"`

### Task 2: Secure board status action

**Files:**
- Modify: `src/app/actions.ts`
- Modify: `src/lib/permissions.ts` only if an existing helper cannot express the required check.

**Interfaces:**
- Produces: `updateTicketStatusAction(ticketId: string, status: TicketStatus): Promise<void>`.
- Consumes: existing `canUpdateTicket`, `requireUser`, Prisma client, and ticket activity relation.

- [ ] **Step 1: Create the failing action check**

Exercise an allowed transition, an unauthorized ticket, and an unchanged status with the real authorization helper.

- [ ] **Step 2: Run the action check to verify it fails**

Run the targeted check.
Expected: no board-specific action exists.

- [ ] **Step 3: Implement `updateTicketStatusAction`**

Load the ticket, authorize with `canUpdateTicket`, ignore no-op moves, update only `status`, record `STATUS_CHANGED` activity, and revalidate the dashboard and board paths.

- [ ] **Step 4: Run the action check to verify it passes**

Verify correct persisted status, activity message, and rejected unauthorized update.

- [ ] **Step 5: Commit**

`git commit -m "feat: add authorized board status updates"`

### Task 3: Board view and interaction

**Files:**
- Create: `src/app/board/page.tsx`
- Create: `src/app/board/board-columns.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/actions.ts`

**Interfaces:**
- Consumes: `updateTicketStatusAction(ticketId, status)` and visible-ticket query rules.
- Produces: `/board`, grouped ticket cards, drag-and-drop movement, and a status select fallback.

- [ ] **Step 1: Create the failing browser check**

Verify a `Tablero` navigation control, four labeled columns, and the ticket cards visible only under their current status.

- [ ] **Step 2: Run the browser check to verify it fails**

Run: Playwright CLI authenticated snapshot at `/board`.
Expected: route or board controls do not exist.

- [ ] **Step 3: Implement the board query and layout**

Server-render visible tickets, grouped by `OPEN`, `IN_PROGRESS`, `RESOLVED`, and `CLOSED`. Keep title, priority, requester, and detail link on each card.

- [ ] **Step 4: Implement client movement controls**

Use native HTML drag events for card movement and call the server action. Add a status select/button fallback per card for keyboard and mobile use.

- [ ] **Step 5: Run browser verification**

Verify a permitted drag changes the card column after refresh and the fallback control performs the same update.

- [ ] **Step 6: Run regression checks**

Run: `npm run lint && npm run build`.
Expected: both commands pass.

- [ ] **Step 7: Commit**

`git commit -m "feat: add ticket board view"`

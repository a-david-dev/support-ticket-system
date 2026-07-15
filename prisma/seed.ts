import { PrismaClient, Priority, Role, TicketStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Demo1234!", 10);

  const [admin, technician, user] = await Promise.all(
    [
      { name: "Ariel Admin", email: "admin@demo.com", role: Role.ADMIN },
      { name: "Luisa Tecnico", email: "tecnico@demo.com", role: Role.TECHNICIAN },
      { name: "Carlos Usuario", email: "usuario@demo.com", role: Role.USER },
    ].map((account) =>
      prisma.user.upsert({
        where: { email: account.email },
        update: {},
        create: { ...account, passwordHash },
      }),
    ),
  );

  const existing = await prisma.ticket.count();
  if (existing > 0) return;

  const tickets = [
    {
      title: "No puedo acceder al correo corporativo",
      description: "El inicio de sesion falla despues de cambiar la contrasena.",
      category: "Accesos",
      priority: Priority.HIGH,
      status: TicketStatus.IN_PROGRESS,
      createdById: user.id,
      assignedToId: technician.id,
    },
    {
      title: "Laptop lenta al iniciar Windows",
      description: "El equipo tarda mas de 10 minutos en estar listo para trabajar.",
      category: "Hardware",
      priority: Priority.MEDIUM,
      status: TicketStatus.OPEN,
      createdById: user.id,
      assignedToId: null,
    },
    {
      title: "VPN desconecta durante videollamadas",
      description: "La conexion cae varias veces por hora cuando estoy fuera de oficina.",
      category: "Redes",
      priority: Priority.HIGH,
      status: TicketStatus.RESOLVED,
      createdById: admin.id,
      assignedToId: technician.id,
    },
  ];

  for (const ticket of tickets) {
    const created = await prisma.ticket.create({ data: ticket });
    await prisma.activity.create({
      data: {
        ticketId: created.id,
        actorId: ticket.createdById,
        type: "CREATED",
        message: "Ticket creado desde el seed de demostracion.",
      },
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });

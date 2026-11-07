# Ticket workspace design

## Intent

Liberar espacio del dashboard para revisar tickets y ofrecer una vista visual para gestionar su avance.

## Decisions

- La tabla existente seguirá siendo la vista inicial y conservará búsqueda, filtros y permisos.
- El formulario fijo de creación se sustituirá por un botón `Nuevo ticket` que abre un panel lateral accesible. Al enviar correctamente, se conserva el comportamiento actual: abrir el ticket recién creado.
- El tablero será una ruta/vista secundaria con cuatro columnas: Abierto, En proceso, Resuelto y Cerrado.
- Solo quien ya puede actualizar un ticket podrá cambiar su estado desde el tablero. Las actualizaciones conservarán la validación del servidor y el historial de actividad.
- El arrastre tendrá un control alternativo de estado para teclado y móvil.

## Non-goals

- No cambiar el esquema de PostgreSQL.
- No eliminar la página de detalle ni las reglas de visibilidad actuales.
- No añadir reasignación de técnicos desde una tarjeta del tablero en esta primera versión.

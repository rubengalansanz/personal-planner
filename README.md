# Personal Planner

Aplicación de agenda personal con calendario, tareas, contactos, notas y planner. Funciona como aplicación web y de escritorio (Electron).

## Funcionalidades

- **Calendario**: Eventos y citas con recordatorios
- **Tareas**: Gestión de tareas pendientes con prioridades y categorías
- **Contactos**: Agenda de contactos con múltiples teléfonos y direcciones
- **Notas**: Bloc de notas con categorías
- **Planner**: Gestión de proyectos con hitos y seguimiento de progreso
- **Cumpleaños/Aniversarios**: Fechas recurrentes con recordatorios
- **Enlaces**: Referencias cruzadas entre registros
- **Notificaciones Push**: Recordatorios mediante Web Push

## Stack Tecnológico

- **Frontend**: Next.js 16.3.1, React 19.2.8, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Base de datos**: SQLite con Drizzle ORM
- **Escritorio**: Electron 44
- **Lenguaje**: TypeScript

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Abrir http://localhost:3000
```

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo Next.js |
| `npm run build` | Construir la aplicación |
| `npm run start` | Iniciar producción |
| `npm run lint` | Verificar código con ESLint |
| `npm run db:generate` | Generar migraciones de Drizzle |
| `npm run db:migrate` | Ejecutar migraciones |
| `npm run db:push` | Push de esquema a la DB |
| `npm run db:studio` | Abrir Drizzle Studio |
| `npm run electron:dev` | Desarrollo con Electron |
| `npm run electron:preview` | Vista previa Electron |
| `npm run electron:dist` | Empaquetar para distribución |
| `npm run notify` | Scheduler local de pushes (cada 5 min, requiere `NOTIFY_SECRET`) |

## Notificaciones push (servidor)

El endpoint `POST /api/notify` envía Web Push a los recordatorios debidos.
Está protegido por `NOTIFY_SECRET` (header `Authorization: Bearer <secret>`);
sin esa variable devuelve 503. Variables en `.env.local` (no commitear):

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:vos@ejemplo.com
NOTIFY_SECRET=un-secreto-largo-azaroso
```

```bash
# Scheduler local (usa BASE_URL=http://localhost:3000 por defecto)
NOTIFY_SECRET=... npm run notify
```

En producción, un cron externo que haga `POST` al endpoint con el secret.

## Base de datos

Usa SQLite con Drizzle ORM. El esquema está en `db/schema.ts` e incluye:

- `events` - Calendario/Eventos
- `tasks` - Tareas
- `contacts` - Contactos
- `notes` - Notas
- `projects` - Proyectos del planner
- `planner_items` - Hitos de proyectos
- `anniversaries` - Cumpleaños/Aniversarios
- `links` - Enlaces entre registros
- `push_subscriptions` - Suscripciones Web Push

## Estructura

```
├── app/                  # Rutas Next.js (App Router)
│   ├── calendario/       # Vista del calendario
│   ├── tareas/           # Gestión de tareas
│   ├── contactos/        # Agenda de contactos
│   ├── notas/            # Bloc de notas
│   ├── planner/          # Gestor de proyectos
│   ├── cumpleanos/       # Cumpleaños y aniversarios
│   └── api/              # API Routes
├── components/           # Componentes React
├── db/                   # Esquema y migraciones Drizzle
├── electron/             # Código de Electron
├── lib/                  # Utilidades compartidas
└── scripts/              # Scripts de utilidad
```

## Electron

La aplicación se puede empaquetar como app de escritorio:

```bash
# Desarrollo con Electron
npm run electron:dev

# Empaquetar para distribución
npm run electron:dist
```

Soporta Linux (AppImage, deb), macOS (dmg) y Windows (NSIS).

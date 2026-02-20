# School Manager

A complete School Management System built for Zambian schools. Full-stack monorepo with a NestJS API and Next.js 15 web app featuring multi-tenant architecture, role-based access control, and modules covering the full school administration workflow.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 10, TypeScript, Passport JWT |
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Database | PostgreSQL 16, Prisma ORM |
| Cache/Queue | Redis 7, BullMQ |
| Monorepo | pnpm workspaces |
| Infrastructure | Docker Compose |

## Features

- **Multi-tenant platform** — Super admin can manage multiple schools from a single deployment
- **6 user roles** with granular RBAC: Super Admin, School Admin, Head Teacher, Bursar, Teacher, Parent
- **Student & Guardian management** — enrollment, profiles, guardian linking, CSV export
- **Academic setup** — academic years, terms, grades, classes, subjects, teacher assignments
- **Timetable** — period-based weekly schedule per class
- **Attendance** — session-based marking per class, student history, parent view
- **Assessments & Report Cards** — tests/exams with weighted grade calculation, class results, CSV export
- **Fees & Billing** — fee structures, bulk invoice generation, payment recording with auto-receipts, statements
- **Announcements** — school-wide or class-targeted, role-filtered
- **Reports** — enrollment, attendance trends, exam performance, fee collection
- **Audit logging** — tracks all sensitive operations with user/action/entity
- **Parent portal** — child-specific views for attendance, results, fees, and announcements

## Role Access

| Module | School Admin | Head Teacher | Bursar | Teacher | Parent |
|--------|:---:|:---:|:---:|:---:|:---:|
| Students | Full CRUD | Read + Create | - | - | - |
| Classes | Full CRUD | Read | - | - | - |
| Attendance | Read | Read + Mark | - | Mark | View own |
| Assessments | Full CRUD | Read | - | Full CRUD | View own |
| Fees | Full CRUD | Read only | Full CRUD | - | View own |
| Users | Full CRUD | Read | - | - | - |
| Announcements | Full CRUD | Create + Read | - | Create + Read | Read |
| Reports | All | All | Fee reports | - | - |
| Audit Log | Read | - | - | - | - |
| Settings | Full | - | - | - | - |

## Project Structure

```
school-manager/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema (20+ models)
│   │   │   ├── migrations/     # PostgreSQL migrations
│   │   │   └── seed.ts         # Demo school seed data
│   │   └── src/
│   │       ├── common/         # Guards, decorators, services
│   │       │   ├── guards/     # JWT, Roles, SchoolContext
│   │       │   ├── decorators/ # @Roles, @CurrentUser, @Public
│   │       │   └── services/   # Prisma, Audit, SMS, Storage
│   │       └── modules/
│   │           ├── auth/       # Login, refresh, JWT strategy
│   │           ├── school/     # Multi-school management
│   │           ├── user/       # User CRUD
│   │           ├── student/    # Student + guardian CRUD
│   │           ├── academic/   # Years, terms, grades, classes, subjects, timetable
│   │           ├── attendance/ # Session marking, student history
│   │           ├── assessment/ # Assessments, marks, results, report cards
│   │           ├── fees/       # Structures, invoices, payments, statements
│   │           ├── announcement/
│   │           ├── report/     # Enrollment, attendance, exam, fee reports
│   │           └── audit/      # Audit log viewer
│   └── web/                    # Next.js frontend
│       └── src/
│           ├── app/
│           │   ├── login/      # Auth page with school code lookup
│           │   ├── super-admin/# Platform admin dashboard
│           │   └── dashboard/  # 19 pages for school roles
│           ├── components/     # Sidebar with role-based navigation
│           ├── hooks/          # useAuth context
│           └── lib/            # API client, utilities
├── packages/
│   └── shared/                 # Shared enums, types, validators
├── docker-compose.yml          # PostgreSQL + Redis
├── pnpm-workspace.yaml
└── package.json
```

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 8
- Docker & Docker Compose (for PostgreSQL and Redis)

### Setup

```bash
# Clone the repository
git clone https://github.com/gkanyanta/school-manager.git
cd school-manager

# Start PostgreSQL and Redis
docker compose up -d

# Install dependencies
pnpm install

# Configure environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env if needed (defaults work with docker-compose)

# Create a .env.local for the web app
echo 'NEXT_PUBLIC_API_URL=http://localhost:4000/api' > apps/web/.env.local

# Run database migrations and seed demo data
pnpm db:migrate
pnpm db:seed

# Start both servers
pnpm dev
```

The API runs on **http://localhost:4000** and the web app on **http://localhost:3000**.

Swagger docs are available at **http://localhost:4000/api/docs**.

### Demo Accounts

After seeding, the following accounts are available:

| Role | Email | Password | School Code |
|------|-------|----------|-------------|
| Super Admin | admin@platform.local | ChangeMe123! | *(none)* |
| School Admin | admin@demodayschool.zm | Password123! | DEMO-SCH |
| Head Teacher | head@demodayschool.zm | Password123! | DEMO-SCH |
| Bursar | bursar@demodayschool.zm | Password123! | DEMO-SCH |
| Teacher | teacher@demodayschool.zm | Password123! | DEMO-SCH |
| Parent | parent@demodayschool.zm | Password123! | DEMO-SCH |

The seed creates a demo school ("Lusaka Demo Primary School") with 7 grades, 14 classes, 35 subjects, 10 students, 2 teachers, guardians, an academic year with 3 terms, fee structures, and sample invoices.

## API Overview

All endpoints are prefixed with `/api`. Authentication uses JWT access tokens (15min) with httpOnly refresh token cookies (7 days).

| Endpoint | Description |
|----------|-------------|
| `POST /auth/login` | Login with email, password, school code |
| `POST /auth/refresh` | Refresh access token |
| `GET /schools/lookup/:code` | Public school code lookup (for login page) |
| `GET /students` | List students (paginated, filterable) |
| `POST /students` | Create student with guardian links |
| `GET /classes` | List classes with student counts |
| `POST /attendance/mark` | Mark attendance for a class session |
| `GET /attendance/student/:id` | Get student attendance history |
| `POST /assessments` | Create assessment |
| `POST /assessments/:id/marks` | Enter/update marks |
| `GET /assessments/results/class/:id` | Get class report card results |
| `GET /fees/structures` | List fee structures |
| `POST /fees/invoices/generate-bulk` | Generate invoices for a class |
| `POST /fees/payments` | Record a payment |
| `GET /fees/dashboard` | Fee collection summary |
| `GET /reports/enrollment` | Enrollment report |
| `GET /reports/fee-collection` | Fee collection report |
| `GET /audit-logs` | Audit trail (paginated) |

## Scripts

```bash
pnpm dev            # Start API + Web in development mode
pnpm build          # Build all packages
pnpm db:migrate     # Run Prisma migrations
pnpm db:seed        # Seed demo data
pnpm db:studio      # Open Prisma Studio
pnpm db:generate    # Regenerate Prisma client
```

## License

MIT

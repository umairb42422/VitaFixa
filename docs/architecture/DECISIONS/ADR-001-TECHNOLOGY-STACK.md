ADR-001: Technology Stack Selection

Project: VitaFixa
Status: Accepted (Initial Baseline)
Decision Date: 2026-11-21
Decision Type: Technology Selection

---

1. Context

VitaFixa is a fitness and nutrition planning platform that will support web and mobile applications.

The system must support:

- User registration and authentication.
- User profiles and fitness goals.
- Custom meal and nutrition planning.
- Food database management.
- Workout planning and tracking.
- Notifications and reminders.
- Progress tracking and analytics.
- Future AI-powered features.

The technology stack must support maintainability, scalability, security, development efficiency, and integration with AI coding tools.

2. Decision

The initial technology stack will use the following technologies:

System Area| Selected Technology
Web application| Next.js
Web language| TypeScript
Mobile application| React Native with Expo
Backend| NestJS
Backend language| TypeScript
Architecture| Modular Monolith
Database| PostgreSQL
Database platform| Supabase
ORM| Prisma 6
Authentication| Supabase Auth
File storage| Supabase Storage
API style| REST API
API documentation| OpenAPI / Swagger
Repository| GitHub Monorepo
Package management| pnpm
Monorepo tooling| Turborepo
Web deployment| Vercel (proposed)
CI/CD| GitHub Actions

Specific hosting and deployment arrangements may be refined before production implementation.

Amendment (2026-11-22): Prisma 6 is the approved ORM major version. Moving to Prisma 7 or any other major version requires a new ADR.

3. Reasons for Selection

Next.js

Selected for the web application because it supports:

- React-based development.
- Server-side rendering.
- Responsive web applications.
- Structured routing.
- TypeScript integration.

React Native with Expo

Selected for mobile development because it supports:

- Android and iOS applications.
- Shared development practices with the web stack.
- Faster mobile development.
- Access to native mobile capabilities.

NestJS

Selected for the backend because it provides:

- Modular application structure.
- Dependency injection.
- Clear separation of responsibilities.
- TypeScript support.
- Structured API development.

PostgreSQL

Selected because it provides:

- Reliable relational data storage.
- Transactions.
- Data integrity.
- Relationships between users, meals, foods, and workouts.
- Strong querying capabilities.

Supabase

Selected as the initial managed backend platform for:

- PostgreSQL database hosting.
- Authentication.
- File storage.
- Development efficiency.

Prisma

Selected to provide:

- Type-safe database access.
- Schema management.
- Database migrations.
- Easier interaction with relational data.

REST API

Selected to provide a clear communication interface between web/mobile clients and the backend.

Modular Monolith

Selected instead of microservices for the initial product because:

- The project is at an early stage.
- Development and deployment should remain manageable.
- Modules can have clear boundaries.
- Independent services are not initially necessary.

4. Alternatives Considered

Area| Selected| Alternatives
Web| Next.js| React with Vite
Mobile| React Native + Expo| Flutter
Backend| NestJS| Express.js, Django
Database| PostgreSQL| MongoDB
API| REST| GraphQL
Architecture| Modular Monolith| Microservices

The selected technologies provide a consistent TypeScript development environment and a practical starting point for the project.

5. Consequences

Positive Consequences

- Consistent TypeScript usage across major application layers.
- Easier collaboration with AI coding tools.
- Clear backend module organization.
- Strong relational database support.
- Shared API for web and mobile applications.
- Easier initial deployment than a microservices architecture.

Trade-offs and Risks

- Maintaining separate web and mobile user interfaces requires additional work.
- Supabase and Prisma integration requires careful database connection and migration configuration.
- Managed platform services may introduce vendor dependency.
- TypeScript across multiple applications still requires consistent standards and shared contracts.

6. Important Architectural Rules

1. Business logic must remain in the backend domain/application layers.
2. Web and mobile applications must communicate through documented APIs for business operations.
3. Database access must follow defined backend boundaries.
4. Supabase service-role credentials must never be exposed to frontend applications.
5. Authentication and authorization must be validated by the backend.
6. Database migrations must be version-controlled.
7. Technology changes must be documented through new ADRs.
8. New services must not be introduced without a documented architectural reason.

7. Implementation Note

Before production implementation, the team must finalize:

- Prisma connection configuration with Supabase.
- Database migration ownership and workflow.
- Authentication token validation in NestJS.
- Database security and Row Level Security policies.
- Hosting and deployment configuration.

These details must be verified before production credentials or real user data are introduced.

Amendment (2026-11-23): Amended by ADR-002 (authentication and authorization) and ADR-003 (database schema and access), which resolve token validation, Row Level Security, the Prisma connection configuration and the migration workflow. Hosting and deployment configuration remain open. No technology decision in this ADR has changed.

8. Review Conditions

This decision should be reviewed if:

- Performance requirements change significantly.
- Mobile development requirements change.
- Hosting limitations appear.
- Database scaling requirements change.
- A selected technology becomes unsuitable.

A new ADR should document any major replacement or modification.

---

End of ADR-001

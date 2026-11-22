# User Profile module

**Responsibility:** Profiles, goals, preferences and allergies.

**Status:** structure placeholder only. No business logic yet. A detailed Low-Level Design is required before implementation (TECHNICAL-ARCHITECTURE.md, section 5).

Layers (LLD.md section 3-4): `domain/` (no NestJS/Prisma imports), `application/` (use cases, repository interfaces), `infrastructure/` (Prisma repositories, adapters), `presentation/` (thin controllers, DTOs).

Rules: do not access other modules' internals or data; communicate through defined interfaces; never expose Prisma models as API responses.

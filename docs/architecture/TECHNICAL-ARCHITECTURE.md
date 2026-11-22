VITAFIXA

Software Architecture & Technology Blueprint

Document Version: 1.0
Status: Initial Technical Baseline
Reconciled with: ADR-002 and ADR-003 (2026-11-23)
Product Category: Fitness, Nutrition & Wellness Platform
Target Platforms: Web, Android and iOS
Architecture Style: Modular Monolith, Clean Architecture and Domain-Driven Design

---

1. Product Overview

VitaFixa is a comprehensive fitness and nutrition planning platform that enables users to organize their meals, nutrition, workouts and daily health routines in one system.

The platform will provide:

- Personalized user profiles and onboarding.
- Daily calorie and nutritional requirement estimation.
- Custom meal and diet plan creation.
- Food and portion tracking.
- Workout planning and exercise tracking.
- Meal and workout reminders.
- Progress monitoring and analytics.
- Educational content based on trustworthy health research.
- Future AI-powered nutrition and fitness assistance.

The product must support a responsive web interface and dedicated mobile applications.

2. Technology Stack

The following stack is recommended for the first production architecture.

Layer| Technology| Language
Web frontend| Next.js| TypeScript
Mobile frontend| React Native + Expo| TypeScript
Backend API| NestJS| TypeScript
Database| PostgreSQL| SQL
Database hosting| Supabase| PostgreSQL
Database access| Prisma ORM| TypeScript
Authentication| Supabase Auth| TypeScript integration
File storage| Supabase Storage| TypeScript integration
API communication| REST API| JSON
API documentation| OpenAPI / Swagger| YAML/JSON
Version control| GitHub| Git
Automated testing| Jest / Vitest / Playwright| TypeScript
Mobile testing| React Native Testing Library| TypeScript
Deployment| Vercel + backend hosting| Cloud services

2.1 Frontend: Web Application

Technology: Next.js + TypeScript

Next.js will be responsible for the browser-based application.

Why we choose it:

- Responsive interface for desktop, tablet and mobile browsers.
- Modern React-based architecture.
- Routing and page organization.
- Performance optimization.
- Server-side rendering where appropriate.
- Integration with the backend API.

UI technologies:

- React
- TypeScript
- Tailwind CSS
- Accessible component library

The website must adapt to different screen sizes rather than being designed exclusively for desktop.

2.2 Frontend: Mobile Application

Technology: React Native + Expo + TypeScript

We will build dedicated Android and iOS applications.

Why:

- One shared mobile codebase for Android and iOS.
- Native mobile navigation and interaction.
- Push notifications.
- Camera and image-upload integration.
- Mobile-specific user experience.
- Future Google Play Store publication.

React Native and Expo will provide the mobile interface. The web interface will remain a separate Next.js application.

We will share suitable business logic, validation rules, API clients and design tokens between platforms, rather than forcing every UI component to be identical.

2.3 Backend

Technology: NestJS + TypeScript

The backend will handle the main business operations.

Responsibilities:

- User profile management.
- Nutrition calculations.
- Meal-plan management.
- Food tracking.
- Workout management.
- Notification scheduling.
- Progress analytics.
- AI integration.
- Authorization and business rules.

Why NestJS:

- Modular architecture.
- Dependency injection.
- Separation of responsibilities.
- Structured controllers and services.
- Built-in validation and testing support.
- Easier enforcement of module boundaries.

The backend will initially operate as a Modular Monolith. We will not start with microservices.

2.4 Database

Technology: PostgreSQL through Supabase

PostgreSQL will store structured application data.

Examples:

- User profiles.
- Food items.
- Nutritional information.
- Meal plans.
- Meal entries.
- Workout plans.
- Exercise records.
- Notifications.
- Progress history.

Prisma ORM will provide structured database access from the backend.

Supabase will provide managed PostgreSQL hosting, authentication and file storage.

Important architectural rule:

The backend API will be the main entry point for business operations. Frontend applications must not directly bypass backend business rules to modify application data.

Row Level Security is enabled on every table with no permissive policies, and the Supabase data API is off. The backend's runtime database role bypasses RLS, so backend ownership checks are the enforcement (ADR-002 and ADR-003).

3. Overall System Architecture

The system will contain three major application layers.

Layer A: Presentation

- Next.js Web Application.
- React Native Mobile Application.

Layer B: Application and Business Logic

- NestJS API.
- Domain modules.
- Application services.
- Validation and authorization.

Layer C: Infrastructure

- PostgreSQL.
- Supabase Auth.
- Supabase Storage.
- Notification providers.
- External nutrition and AI services.

High-Level Architecture Diagram

flowchart TD
    WEB[Next.js Web Application]
    MOBILE[React Native Mobile Application]

    API[NestJS Backend API]

    AUTH[Authentication Module]
    PROFILE[User Profile Module]
    NUTRITION[Nutrition Module]
    FOOD[Food Database Module]
    WORKOUT[Workout Module]
    PROGRESS[Progress Module]
    NOTIFY[Notification Module]
    AI[AI Assistant Module]
    RESEARCH[Research Centre Module]

    DB[(PostgreSQL Database)]
    STORAGE[Supabase Storage]
    SERVICES[External Services]

    WEB --> API
    MOBILE --> API

    API --> AUTH
    API --> PROFILE
    API --> NUTRITION
    API --> FOOD
    API --> WORKOUT
    API --> PROGRESS
    API --> NOTIFY
    API --> AI
    API --> RESEARCH

    AUTH --> SERVICES
    NUTRITION --> DB
    FOOD --> DB
    WORKOUT --> DB
    PROFILE --> DB
    PROGRESS --> DB
    NOTIFY --> DB
    AI --> SERVICES
    RESEARCH --> DB
    PROFILE --> STORAGE

4. Architecture Principles

The following principles are mandatory.

4.1 Modular Architecture

Each major business responsibility must have its own module.

Initial modules:

1. Identity and Authentication
2. User Profile
3. Nutrition and Diet Planning
4. Food Database
5. Workout Planning
6. Notifications
7. Progress and Analytics
8. AI Assistant
9. Research and Educational Centre

Every module must have:

- Clearly defined responsibilities.
- Its own application logic.
- Defined interfaces.
- Defined data ownership.
- Unit and integration tests.
- Module documentation.

4.2 Loose Coupling

Modules must communicate through defined interfaces and application-level contracts.

One module must not depend on another module's internal implementation details.

For example:

The Notification module should receive a meal-reminder request through a defined interface. It should not directly access or modify internal Nutrition module objects.

4.3 High Cohesion

Every module should contain functionality belonging to the same business responsibility.

For example:

Meal planning, food portions and nutritional calculations belong to the Nutrition domain, not the Workout domain.

4.4 Clean Architecture

Organize business logic into:

- Presentation layer.
- Application layer.
- Domain layer.
- Infrastructure layer.

The domain layer must not depend on database providers, UI frameworks or external APIs.

Dependencies should point towards business rules and abstractions.

4.5 Fault Isolation

A failure in one module should not unnecessarily bring down the entire application.

Required techniques:

- Clear module boundaries.
- Controlled error handling.
- Timeouts for external services.
- Retry policies for suitable transient failures.
- Background processing for long-running work.
- Graceful degradation.
- Health checks and monitoring.

For example, if the AI Assistant becomes unavailable, users should still be able to create meal plans manually.

5. Initial Module Responsibilities

Module| Responsibility
Authentication| Login, registration and sessions
User Profile| Personal information, goals and preferences
Nutrition| Calories, macros and meal plans
Food Database| Foods, portions and nutritional values
Workout| Exercises, schedules and completion
Notifications| Meal and workout reminders
Progress| Weight and activity history
AI Assistant| Suggestions and assistance
Research Centre| Evidence-based health education

Each module will have its own detailed Low-Level Design before implementation.

6. Quality Attributes and Engineering Requirements

Quality attributes must be considered from the beginning, not added after the application is completed.

6.1 Performance

Objectives:

- Optimize database queries and indexes.
- Avoid unnecessary API requests.
- Implement pagination for large datasets.
- Use caching where appropriate.
- Compress and optimize images.
- Avoid blocking user interactions with long-running tasks.
- Monitor API latency and frontend performance.

Initial engineering targets:

- Typical API response: P95 under 500 ms for ordinary operations.
- Initial page rendering: target LCP under 2.5 seconds on suitable test conditions.
- Database queries must be monitored for slow execution.

These are targets to validate under realistic workloads, not guaranteed performance.

6.2 Security

Security requirements:

- Secure authentication.
- Server-side authorization.
- Role and ownership checks.
- Input validation.
- Parameterized database access through ORM.
- HTTPS for all production communication.
- Secure secret management.
- Rate limiting.
- Protection against common web vulnerabilities.
- Safe file uploads.
- Audit logging for sensitive operations.
- Dependency and vulnerability scanning.

Additional rules:

- Never expose secret API keys in frontend code.
- Never commit ".env" files.
- Never trust user-supplied account IDs for authorization.
- Do not store passwords directly.
- Use secure token handling appropriate to each platform.
- Keep production and development environments separate.

6.3 Scalability

The initial architecture will be a Modular Monolith.

We will scale it through:

- Efficient database design.
- Database indexing.
- Stateless API instances where possible.
- Background job processing.
- Caching.
- Connection pooling.
- Performance monitoring.

If genuine scaling requirements emerge, individual modules can later be extracted into independent services.

Microservices will not be introduced without a clear technical reason.

6.4 Reliability and Availability

Requirements:

- Centralized error handling.
- Database backups.
- Health-check endpoints.
- Safe retry mechanisms.
- Graceful handling of external service failures.
- Recovery procedures.
- Monitoring and alerts.

No module should assume that another module or external provider is always available.

6.5 Maintainability

Requirements:

- Consistent code formatting.
- Naming conventions.
- Modular directory structure.
- Documentation.
- Type safety.
- Code reviews.
- Automated tests.
- Architecture Decision Records (ADRs).

Superseded ADRs should be retained and marked as superseded rather than deleted.

6.6 Testability

Testing levels:

1. Unit testing.
2. Integration testing.
3. API contract testing.
4. Module boundary testing.
5. End-to-end testing.
6. Security testing.
7. Performance testing.
8. Mobile device testing.

Business-critical nutrition calculations must have explicit test cases.

6.7 Accessibility and Usability

Requirements:

- Responsive layouts.
- Readable typography.
- Accessible contrast.
- Keyboard navigation on web.
- Screen-reader-friendly controls.
- Clear form validation.
- Consistent interaction patterns.
- Support for small mobile screens.

7. Repository Structure

We will use a Monorepo structure.

This allows web, mobile and backend applications to remain in one GitHub repository while preserving separate application boundaries.

Proposed structure:

vitafixa/
│
├── apps/
│   ├── web/
│   │   ├── src/
│   │   └── tests/
│   │
│   ├── mobile/
│   │   ├── src/
│   │   └── tests/
│   │
│   └── api/
│       ├── src/
│       │   ├── modules/
│       │   ├── common/
│       │   └── infrastructure/
│       └── tests/
│
├── packages/
│   ├── shared-types/
│   ├── validation/
│   ├── api-client/
│   ├── business-rules/
│   └── design-tokens/
│
├── docs/
│   ├── requirements/
│   ├── architecture/
│   │   └── DECISIONS/
│   ├── database/
│   ├── api/
│   ├── security/
│   └── testing/
│
├── infrastructure/
│   ├── database/
│   └── deployment/
│
├── .github/
│   └── workflows/
│
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── .gitignore
└── package.json

The exact module folder structure will be defined in the detailed architecture document before implementation.

8. API Design

Web and mobile applications will communicate with the same backend API.

Authentication is handled by Supabase Auth directly from the clients, so the API has no authentication endpoints. The API accepts a Supabase access token as a Bearer token and verifies it on the backend (ADR-002).

We will initially use REST APIs.

Example endpoint structure:

/api/v1/users
/api/v1/nutrition
/api/v1/foods
/api/v1/meal-plans
/api/v1/workouts
/api/v1/notifications
/api/v1/progress
/api/v1/ai
/api/v1/research

API requirements:

- Consistent response formats.
- Input and output validation.
- Authentication and authorization.
- Versioning.
- Pagination.
- Appropriate HTTP status codes.
- Error handling.
- OpenAPI documentation.

9. Database Design Principles

PostgreSQL will be the primary relational database.

Requirements:

- Proper primary and foreign keys.
- Referential integrity.
- Appropriate indexes.
- Unique constraints.
- Transactions for related operations.
- Database migrations.
- Data ownership boundaries.
- Audit fields where useful.

We will design the ERD before implementing the database.

The approved MVP schema (25 tables), its conventions, delete rules, database roles and migration strategy are recorded in ADR-003 and detailed in DATABASE-DESIGN.md. Progress goals and Research Centre tables are deferred.

Important entities will include:

- Users
- Profiles
- Goals
- Foods
- Food Portions
- Meal Plans
- Meals
- Meal Entries
- Workout Plans
- Exercises
- Workout Sessions
- Progress Records
- Notification Preferences

The final database schema will be determined during Low-Level Design.

10. AI Integration Strategy

AI will be an optional supporting capability, not a dependency for core application functionality.

Potential features:

- Meal suggestions.
- Personalized plan assistance.
- Food image recognition.
- Nutrition explanations.
- Workout suggestions.

Requirements:

- AI provider abstraction.
- Server-side API calls.
- No exposed AI credentials.
- Input and output validation.
- Usage limits.
- Cost monitoring.
- Safe fallback behavior.
- Human-readable explanations.

If an AI provider becomes unavailable, essential manual planning and tracking must continue working.

11. Health and Nutrition Safety

VitaFixa must use trustworthy nutritional information.

Requirements:

- Evidence-based nutrition guidance.
- Documented calculation methods.
- Source references and publication dates.
- Clear explanations of estimation uncertainty.
- Appropriate warnings for higher-risk users.
- No unsupported medical claims.
- No automatic unsafe weight-loss recommendations.

The initial target audience will be adults.

The platform must distinguish general wellness guidance from medical diagnosis or treatment.

12. Development and Deployment Environments

We will maintain separate environments:

Development

- Local development.
- Test database.
- Test credentials.
- Debug logging.

Staging

- Production-like configuration.
- Integration testing.
- Release verification.

Production

- Real user data.
- Secure secrets.
- Monitoring.
- Backups.
- Controlled deployment.

Production credentials must never be used in local development or committed to GitHub.

13. GitHub and AI Development Rules

GitHub will be the single source of truth for project code and documentation.

Required rules:

- Protect the "main" branch.
- No direct AI changes to "main".
- Use feature branches.
- Require pull requests.
- Run automated tests before merging.
- Review changes before approval.
- Keep commits focused.
- Do not delete existing architecture documents without approval.

Claude must:

1. Read "AGENTS.md" and "CLAUDE.md".
2. Read relevant architecture documents.
3. Understand module dependencies.
4. Follow the task's allowed-file scope.
5. Implement only the assigned task.
6. Add or update tests.
7. Update documentation when necessary.
8. Report files changed and verification results.

AI-generated code must never be assumed correct without review and testing.

14. Implementation Phases

We will not develop the entire application in one large coding task.

Phase 1 — Project Foundation

- Repository structure.
- Architecture documentation.
- Coding standards.
- AI instructions.
- GitHub protection and CI.

Phase 2 — Core Infrastructure

- Backend foundation.
- Database connection.
- Authentication.
- API conventions.
- Logging and error handling.

Phase 3 — User and Profile

- Registration.
- Login.
- Onboarding.
- User goals and preferences.

Phase 4 — Nutrition

- Food database.
- Calorie calculations.
- Meal planning.
- Food tracking.

Phase 5 — Workout

- Exercise library.
- Workout planning.
- Workout completion.

Phase 6 — Notifications

- Meal reminders.
- Workout reminders.
- Notification preferences.

Phase 7 — Progress and Analytics

- Weight history.
- Nutrition consistency.
- Workout statistics.
- Reports.

Phase 8 — AI and Research Centre

- AI assistance.
- Research-backed educational content.
- AI safety and usage controls.

Phase 9 — Release Preparation

- Security testing.
- Performance testing.
- Accessibility testing.
- Web deployment.
- Android production builds.
- Google Play Store preparation.

---

15. Architecture Governance

Every major technical decision must be documented.

We will use Architecture Decision Records.

Each ADR should contain:

- Decision title.
- Context.
- Alternatives considered.
- Selected approach.
- Reason for selection.
- Consequences and trade-offs.
- Status.
- Date.

Architecture changes must be reviewed rather than made casually by an AI coding agent.

---

16. Definition of Done

A feature is not complete merely because its code works once.

A task can be considered complete only when:

- Requirements are satisfied.
- Architecture boundaries are respected.
- Input validation exists.
- Authorization is correct.
- Relevant tests pass.
- Error cases are handled.
- No secrets are exposed.
- Documentation is updated.
- No unintended module changes are introduced.
- Pull request review is complete.

Final engineering principle:

VitaFixa must be designed for security, maintainability, reliability, performance and future growth from the beginning. These qualities must be verified through measurable tests and reviews rather than simply claimed in documentation.

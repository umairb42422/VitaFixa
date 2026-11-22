VITAFIXA

Low-Level Design (LLD)

Document Version: 1.0
Status: Initial Detailed Design Baseline
Reconciled with: ADR-002 and ADR-003 (2026-11-23)
Product: VitaFixa
Related Documents:

- Software Architecture & Technology Blueprint
- Product Requirements Document (PRD)
- High-Level Design (HLD)

---

1. Introduction

1.1 Purpose

This document describes the internal design of VitaFixa's software components.

It provides implementation guidance for developers and AI coding agents.

It defines:

- Backend module structure.
- Internal software layers.
- Module responsibilities.
- Service and interface boundaries.
- Initial domain models.
- Data validation rules.
- API design conventions.
- Error handling.
- Module interactions.
- Testing requirements.
- Implementation constraints.

The purpose is to prevent inconsistent implementation and uncontrolled changes as the product grows.

1.2 Design Principles

All implementation must follow these principles:

1. High cohesion.
2. Loose coupling.
3. Separation of concerns.
4. Dependency inversion.
5. Clear module ownership.
6. Reusable business logic.
7. Testability.
8. Type safety.
9. Secure data access.
10. Explicit contracts between modules.

The backend will initially use a modular monolith.

Microservices must not be introduced without an approved architectural decision.

---

2. Repository and Application Structure

The repository will contain separate applications for web, mobile and backend.

Initial proposed structure:

vitafixa/
│
├── apps/
│   ├── web/
│   ├── mobile/
│   └── api/
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
└── package.json

The structure is a target design. AI agents must not create every folder or application in one operation without an approved implementation task.

---

3. Backend Internal Architecture

Framework: NestJS
Language: TypeScript

The backend will follow a modular Clean Architecture approach.

Each business module should separate its responsibilities into four conceptual layers.

3.1 Domain Layer

Contains the core business rules.

Responsibilities:

- Domain entities.
- Value objects.
- Business invariants.
- Domain services where necessary.
- Domain events where useful.

Rules:

- Must not depend on NestJS.
- Must not depend on Prisma.
- Must not depend on HTTP controllers.
- Must not call external APIs directly.

3.2 Application Layer

Coordinates application use cases.

Responsibilities:

- Application services.
- Use cases.
- Input and output models.
- Repository interfaces.
- Application-level validation.
- Transaction coordination.

Examples:

- CreateMealPlan.
- AddFoodEntry.
- CompleteWorkout.
- ScheduleMealReminder.
- RecordWeight.

3.3 Infrastructure Layer

Implements external technical dependencies.

Responsibilities:

- Prisma repositories.
- Database access.
- Supabase integration.
- External API clients.
- Notification provider adapters.
- AI provider adapters.
- Background job processing.

Infrastructure implementations must satisfy interfaces defined by the appropriate inner layer.

3.4 Presentation Layer

Handles communication with external clients.

Responsibilities:

- REST controllers.
- Request DTOs.
- Response DTOs.
- Authentication guards.
- HTTP validation.
- HTTP error mapping.

Controllers must remain thin.

They should receive requests, invoke application use cases and return appropriate responses.

---

4. Backend Folder Structure

Proposed backend structure:

apps/api/
│
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── modules/
│   │   ├── identity/
│   │   ├── user-profile/
│   │   ├── nutrition/
│   │   ├── food-database/
│   │   ├── workout/
│   │   ├── notifications/
│   │   ├── progress/
│   │   ├── ai-assistant/
│   │   └── research-centre/
│   │
│   ├── common/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── decorators/
│   │   ├── exceptions/
│   │   └── logging/
│   │
│   └── infrastructure/
│       ├── database/
│       ├── authentication/
│       ├── storage/
│       ├── notifications/
│       └── external-services/
│
├── test/
│
└── package.json

Each module will follow an internal structure similar to:

nutrition/
│
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── interfaces/
│   └── services/
│
├── application/
│   ├── use-cases/
│   ├── dto/
│   ├── interfaces/
│   └── services/
│
├── infrastructure/
│   ├── repositories/
│   └── adapters/
│
├── presentation/
│   ├── controllers/
│   └── dto/
│
├── nutrition.module.ts
└── README.md

This is a logical structure. The exact implementation may vary when justified by framework conventions, but the separation of responsibilities must remain.

---

5. Module-Level Design

5.1 Identity Module

Responsibility: Handle identity-related application operations and integrate with Supabase Auth.

Main operations:

- Verify access tokens.
- Provide the authenticated identity to other modules.
- Handle account deletion requests (a later feature).

Supabase Auth owns registration, login, logout and account recovery. Clients call Supabase Auth directly, and the backend exposes no authentication endpoints (ADR-002). The Identity module holds token verification, the global authentication guard and the Supabase adapter.

Important components:

- IdentityController.
- IdentityService.
- AuthenticationGuard.
- SupabaseAuthAdapter.

Security requirements:

- Never store plain-text passwords.
- Verify tokens on protected endpoints.
- Do not trust user IDs supplied by the frontend.
- Keep authentication secrets on the server.
- Enforce authorization independently of authentication.

Supabase Auth remains the identity provider. The backend is responsible for protecting application resources.

Token-to-profile owner mapping (ADR-003 section 2.5.2):

- The only input is the verified "sub" claim, which the guard places on the request as request.user.authUserId.
- A single resolver in the User Profile module looks up user_profiles by authUserId and returns the profile id (userId). If no profile exists, it creates one on first authenticated use with an insert that is safe when two requests arrive at once.
- The profile id is resolved once per request and passed to use cases as the owner. Repositories require the owner and apply it in the same query.
- Other modules obtain the owner through the resolver's contract and never query user_profiles themselves.
- No request body, query string, path parameter or header may carry an owner id.

Food access rule (ADR-003 section 2.5.1): a food is accessible to a user when it is shared (no creator) or created by that user. The Food Database module exposes one reusable check in its public contract, and the Nutrition module calls it for food logs, meal entries and favorites. A reference to another user's custom food is treated as not found.

5.2 User Profile Module

Responsibility: Manage personal information, goals and preferences.

Main operations:

- Create profile.
- Retrieve profile.
- Update profile.
- Set fitness goals.
- Update activity level.
- Manage food preferences.
- Manage allergies.
- Configure workout availability.

Conceptual domain models:

- UserProfile.
- FitnessGoal.
- FoodPreference.
- UserActivityLevel.

Important rules:

- Profile information must be associated with the authenticated account.
- Personal information must be validated.
- Units must be stored and interpreted consistently.
- Sensitive information must only be available to authorized operations.

5.3 Nutrition Module

Responsibility: Handle nutritional calculations and meal planning.

Main operations:

- Estimate daily energy requirements.
- Calculate nutritional totals.
- Create meal plans.
- Update meal plans.
- Add meals.
- Edit meal portions.
- Remove meal entries.
- Compare planned and actual food intake.

Conceptual domain models:

- MealPlan.
- Meal.
- MealEntry.
- NutritionalTarget.
- DailyNutritionSummary.

Important rules:

- Nutritional calculations must be based on documented formulas.
- Food portions must have consistent units.
- Planned food and consumed food must remain distinguishable.
- Calculations must be covered by automated tests.
- Invalid or unsafe targets must be rejected or flagged.

5.4 Food Database Module

Responsibility: Provide searchable food and nutritional information.

Main operations:

- Search food.
- Retrieve food details.
- Retrieve portion information.
- Create custom food.
- Update permitted custom food records.
- Save frequently used foods.

Conceptual domain models:

- Food.
- FoodPortion.
- NutritionalInformation.
- FoodSource.

Important rules:

- Food information must have an identifiable source where available.
- Custom user entries must be distinguishable from verified records.
- Nutritional values must be associated with appropriate serving sizes.
- Search operations must support pagination.

The module owns food records. Other modules must access food information through its defined interfaces.

5.5 Workout Module

Responsibility: Manage exercise information and workout activities.

Main operations:

- Create workout plan.
- Update workout plan.
- Add exercises.
- Set repetitions and sets.
- Configure rest periods.
- Schedule workouts.
- Record workout completion.
- Retrieve workout history.

Conceptual domain models:

- Exercise.
- WorkoutPlan.
- WorkoutExercise.
- WorkoutSession.
- WorkoutCompletion.

Important rules:

- Completed sessions must preserve historical information.
- Changes to future workout plans must not silently rewrite historical records.
- Invalid workout data must be rejected.
- Exercise information must be clearly structured.

5.6 Notifications Module

Responsibility: Manage reminders and notification preferences.

Main operations:

- Create meal reminder.
- Create workout reminder.
- Update reminder.
- Cancel reminder.
- Manage quiet hours.
- Process due notifications.
- Record delivery outcomes where supported.

Conceptual domain models:

- NotificationPreference.
- Reminder: the rule (type, title, time of day, selected weekdays, date range, enabled flag and an optional link to a meal or workout session). Custom reminders have no link.
- ScheduledReminder: one dated occurrence generated from a Reminder.
- NotificationDelivery: one delivery attempt for an occurrence.

Important rules:

- Notifications must respect user time zones.
- Quiet hours must be respected.
- Duplicate scheduling must be prevented.
- Disabled notifications must not be sent.
- Schedule changes must update associated reminders.
- Reminders are disabled by default.
- A linked reminder mirrors the schedule of its meal or workout session. The backend overwrites the mirrored fields in the same transaction as the source change and regenerates pending occurrences.
- Custom reminders depend only on their own enabled flag, not on the meal or workout switches.
- An occurrence that is due inside quiet hours is marked suppressed and is not sent later.
- External provider failures must be handled safely.

The reminder lifecycle (what changes when a meal, plan, session, time zone or switch changes) is defined in ADR-003 sections 2.4.1 to 2.4.3.

Reminder delivery should use background processing rather than blocking ordinary API requests.

5.7 Progress Module

Responsibility: Maintain historical progress and generate summaries.

Main operations:

- Record weight.
- Retrieve weight history.
- Generate nutrition summaries.
- Retrieve workout history.
- Calculate consistency indicators.
- Generate weekly reports.

Conceptual domain models:

- WeightRecord.
- ProgressSummary.
- NutritionHistory.
- ActivitySummary.

Important rules:

- Historical records must be preserved.
- Summaries must use consistent date ranges.
- Calculations must be tested.
- Historical values must not be presented as current measurements.

5.8 AI Assistant Module

Responsibility: Provide optional AI-powered assistance.

Main operations:

- Generate meal suggestions.
- Explain nutritional information.
- Assist with meal plan creation.
- Suggest suitable workout ideas.
- Process future food recognition requests.

Important components:

- AIController.
- AIApplicationService.
- AIProviderInterface.
- AIProviderAdapter.
- AIOutputValidator.

Important rules:

- AI credentials must remain server-side.
- AI output must be validated.
- User input must be handled safely.
- Usage limits and cost monitoring must be implemented.
- AI-generated recommendations must follow application safety rules.
- AI failure must not affect essential manual features.

The application must not rely on a specific AI provider throughout its domain logic.

5.9 Research Centre Module

Responsibility: Manage educational content and source references.

Main operations:

- Retrieve articles.
- Search educational content.
- Organize content by topic.
- Manage source references.
- Record publication information.
- Update reviewed content.

Conceptual domain models:

- ResearchArticle.
- ResearchSource.
- Topic.
- ContentReview.

Important rules:

- Educational content must have traceable sources.
- Publication dates should be stored where available.
- Content must distinguish general information from medical advice.
- Outdated or unsupported content must be reviewed.

---

6. Module Communication Contracts

Modules must communicate through clearly defined contracts.

Example:

The Nutrition module needs to schedule a reminder.

It should call an application-level notification interface instead of directly accessing notification database tables.

Conceptual interface:

interface ReminderScheduler {
  scheduleMealReminder(input: {
    userId: string;
    mealId: string;
    scheduledAt: Date;
    timeZone: string;
  }): Promise<void>;

  cancelMealReminder(input: {
    userId: string;
    mealId: string;
  }): Promise<void>;
}

The Notification module provides the implementation.

The Nutrition module depends on the interface, not the implementation.

Additional contracts will be documented for:

- Profile information access.
- Food information retrieval.
- Workout completion events.
- Progress updates.
- AI provider requests.
- External notification delivery.

Contracts must use explicit input and output types.

---

7. Domain Model Design

The following conceptual models establish the initial business vocabulary.

They are not final database schemas.

7.1 User Profile

Potential fields:

- id
- userId
- dateOfBirth or age information, according to the approved privacy design
- height
- preferred measurement units
- current activity level
- fitness goal
- food preferences
- createdAt
- updatedAt

Weight history should be maintained separately so that previous measurements are preserved.

7.2 Food

Potential fields:

- id
- name
- description
- category
- sourceType
- sourceReference
- createdAt
- updatedAt

7.3 Food Portion

Potential fields:

- id
- foodId
- referenceUnit (g or ml)
- portionName
- quantity
- unit
- referenceAmount (portion size in the reference unit)

7.4 Nutritional Information

Potential fields:

- id
- foodId
- portionReference
- calories
- protein
- carbohydrates
- fat
- additionalNutrients

The final nutrient representation and reference quantity must be defined in database design. The approved representation (ADR-003): one nutrition row per food, referenceQuantity and referenceUnit (g or ml), calories required and the other nutrients optional, where NULL means unknown.

7.5 Meal Plan

Potential fields:

- id
- userId
- name
- description
- startDate
- endDate
- createdAt
- updatedAt

7.6 Meal

Potential fields:

- id
- mealPlanId
- name
- mealType
- scheduledTime
- createdAt
- updatedAt

7.7 Meal Entry

Potential fields:

- id
- mealId
- foodId
- portionReference
- quantity
- plannedOrConsumed
- recordedAt

The implementation must distinguish planned meal entries from actual consumption.

7.8 Workout Plan

Potential fields:

- id
- userId
- name
- description
- createdAt
- updatedAt

7.9 Workout Session

Potential fields:

- id
- workoutPlanId
- userId
- scheduledAt
- completedAt
- status

7.10 Weight Record

Potential fields:

- id
- userId
- weight
- unit
- recordedAt

7.11 Notification Preference

Potential fields:

- id
- userId
- mealRemindersEnabled
- workoutRemindersEnabled
- quietHours
- timeZone

Final field names, data types, constraints and relationships will be specified in the database design.

---

8. API Design Details

The backend will expose versioned REST APIs.

Base path:

"/api/v1"

Example endpoint structure:

Method| Endpoint| Purpose
POST| "/users/profile"| Create profile
GET| "/users/profile"| Retrieve profile
PATCH| "/users/profile"| Update profile
GET| "/foods"| Search foods
GET| "/foods/:id"| Retrieve food
POST| "/meal-plans"| Create meal plan
GET| "/meal-plans"| Retrieve meal plans
PATCH| "/meal-plans/:id"| Update meal plan
POST| "/meal-entries"| Record food entry
POST| "/workouts"| Create workout
GET| "/workouts"| Retrieve workouts
POST| "/workouts/:id/complete"| Record workout completion
GET| "/progress/weight"| Retrieve weight history
POST| "/progress/weight"| Record weight
GET| "/notifications/preferences"| Retrieve preferences
PATCH| "/notifications/preferences"| Update preferences

These are proposed API contracts. Exact routes, request fields, response schemas and status codes must be finalized in the API documentation.

8.1 Request Validation

All incoming requests must be validated on the backend.

Validation must cover:

- Required fields.
- Data types.
- Allowed values.
- String length.
- Numeric ranges.
- Date formats.
- Resource ownership.
- Business rules.

Client-side validation may improve usability but must never replace server-side validation.

8.2 Response Design

Responses should follow a consistent structure.

Successful response example:

{
  "data": {
    "id": "example-id",
    "name": "Breakfast"
  }
}

Error response example:

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The supplied information is invalid",
    "details": []
  }
}

Actual response schemas will be documented and standardized before implementation.

---

9. Database Access Design

ORM: Prisma
Database: PostgreSQL

Requirements:

- Database operations must be managed through appropriate repositories.
- Database access must follow module ownership.
- Related operations must use transactions where necessary.
- Database constraints must protect data integrity.
- Schema changes must use version-controlled migrations.
- Database queries must be monitored.
- Sensitive records must have appropriate access restrictions.

Database roles and connections (ADR-003 section 2.9):

- vitafixa_app is the runtime role. It reads and writes application tables, cannot change the schema and has no access to the Supabase auth schema.
- vitafixa_migrator owns the application tables and is used only to apply migrations.
- DATABASE_URL is the runtime connection through the Supabase transaction pooler (port 6543, pgbouncer=true) using vitafixa_app.
- DIRECT_URL is the migration connection (direct connection, or the session pooler on port 5432 if required) using vitafixa_migrator. The transaction pooler is never used for migrations.
- The Prisma datasource declares both (url and directUrl). TLS is required.
- The roles are created by a reviewed script that the project owner executes. Code must not assume they exist until the owner confirms.

Because the runtime role bypasses RLS (ADR-002), every repository query on user-owned data must filter by the owner in the same query.

Important implementation rule:

Do not expose Prisma database models directly as public API response objects.

Use explicit mapping between persistence models and application response models.

---

10. Authentication and Authorization Design

Supabase Auth will provide identity authentication.

The backend will:

1. Receive the user's access token.
2. Verify the token using an approved verification method.
3. Identify the authenticated user.
4. Check permissions for the requested operation.
5. Confirm ownership of user-specific resources.
6. Execute the operation only when authorized.

Important rules:

- Authentication does not automatically mean authorization.
- User ownership must be checked on the backend.
- Administrative permissions must be restricted.
- Frontend-supplied user IDs must never be trusted as proof of ownership.
- Row Level Security is enabled with no permissive policies and the Supabase data API is off (ADR-002, ADR-003). The runtime role bypasses RLS, so backend ownership checks are the enforcement.
- A request for another user's resource returns 404.
- Service role credentials must remain server-side.

---

11. Background Processing

Some operations should not execute as part of ordinary user-facing requests.

Potential background operations:

- Sending meal reminders.
- Sending workout reminders.
- Processing notification retries.
- Generating reports.
- Processing AI requests that require longer execution.
- Processing future food image recognition jobs.

Background processing requirements:

- Jobs must have defined inputs.
- Failures must be recorded.
- Retry behavior must be controlled.
- Duplicate execution must be considered.
- Jobs must not expose sensitive information in logs.
- Long-running operations must not block unrelated requests.

The specific queue and worker technology will be selected before implementation.

---

12. Error Handling and Logging

All modules must use consistent error handling.

Requirements:

- Use appropriate application error types.
- Convert internal errors into safe API responses.
- Never expose stack traces or secrets to users.
- Log relevant technical information.
- Include request correlation identifiers where practical.
- Avoid logging unnecessary personal information.
- Handle external service errors separately from internal business errors.

Example error categories:

- VALIDATION_ERROR
- AUTHENTICATION_ERROR
- AUTHORIZATION_ERROR
- RESOURCE_NOT_FOUND
- CONFLICT_ERROR
- EXTERNAL_SERVICE_ERROR
- INTERNAL_SERVER_ERROR

---

13. Testing Design

Testing must be implemented alongside features.

13.1 Unit Tests

Verify individual business rules.

Examples:

- Calorie estimation calculations.
- Nutritional total calculations.
- Meal validation.
- Workout validation.
- Reminder schedule validation.

13.2 Integration Tests

Verify module interactions and infrastructure.

Examples:

- Nutrition repository operations.
- Supabase authentication integration.
- Notification scheduling.
- Database transaction behavior.

13.3 API Tests

Verify:

- Request validation.
- Response structure.
- Authorization.
- Error handling.
- Pagination.
- API contracts.

13.4 Module Boundary Tests

Verify:

- A module uses approved interfaces.
- Internal implementations are not accessed directly.
- Circular dependencies are avoided.
- Data ownership is respected.

13.5 End-to-End Tests

Important user workflows:

- Registration and onboarding.
- Creating a meal plan.
- Recording food consumption.
- Scheduling reminders.
- Creating and completing workouts.
- Reviewing progress.

---

14. Frontend Design Boundaries

Web and mobile applications must remain separate presentation applications.

They may share:

- Type definitions.
- API client.
- Validation schemas.
- Suitable business rules.
- Design tokens.

They sh

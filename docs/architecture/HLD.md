VITAFIXA

High-Level Design (HLD)

Document Version: 1.0
Status: Initial System Design
Reconciled with: ADR-002 and ADR-003 (2026-11-23)
Product: VitaFixa
Related Documents:

- Software Architecture & Technology Blueprint
- Product Requirements Document (PRD)

---

1. Introduction

1.1 Purpose

This document describes the high-level design of VitaFixa.

It explains the major system components, their responsibilities, interactions, communication methods, data flow and deployment structure.

The purpose is to provide a shared technical understanding before detailed implementation begins.

1.2 System Overview

VitaFixa is a fitness, nutrition and wellness platform that will support:

- Responsive web application.
- Android mobile application.
- iOS mobile application.
- Central backend API.
- Relational database.
- Authentication and file storage.
- Notification services.
- Optional AI and external information services.

All platforms will use the same central backend business rules.

1.3 Design Objectives

The system design must support:

1. Modular architecture.
2. Loose coupling between modules.
3. High cohesion within modules.
4. Secure communication.
5. Reliable data management.
6. Independent development of major components.
7. Future feature expansion.
8. Automated testing.
9. Graceful handling of external service failures.

---

2. System Context

2.1 External Actors

The primary actors are:

Actor| Description
Guest User| A visitor who has not registered
Registered User| A person using VitaFixa
Product Administrator| An authorized person managing platform content and operations
External AI Provider| A service used for optional AI capabilities
Notification Provider| A service used to deliver supported notifications
Authentication Provider| Supabase Auth for account authentication

Administrative permissions must be restricted to authorized personnel.

2.2 System Context Diagram

flowchart TD
    USER[Registered User]
    GUEST[Guest User]
    ADMIN[Authorized Administrator]

    VITAFIXA[VitaFixa Platform]

    AUTH[Supabase Auth]
    AI[External AI Provider]
    NOTIFY[Notification Provider]
    RESEARCH[Trusted Research Sources]

    USER --> VITAFIXA
    GUEST --> VITAFIXA
    ADMIN --> VITAFIXA

    VITAFIXA <--> AUTH
    VITAFIXA <--> AI
    VITAFIXA <--> NOTIFY
    RESEARCH --> VITAFIXA

The VitaFixa platform remains responsible for validating requests, applying business rules and protecting user data.

External providers must not bypass the platform's authorization and business logic.

---

3. High-Level System Architecture

VitaFixa will use a three-layer application structure.

3.1 Presentation Layer

Contains:

- Next.js Web Application.
- React Native Mobile Application.

Responsibilities:

- Display information.
- Collect user input.
- Perform client-side validation for usability.
- Communicate with the backend API.
- Display notifications and application results.

The presentation layer must not independently implement critical business rules.

3.2 Application and Domain Layer

Contains the NestJS backend and its business modules.

Responsibilities:

- Process application requests.
- Validate business operations.
- Apply domain rules.
- Enforce authorization.
- Coordinate modules.
- Manage transactions.
- Communicate with infrastructure services.

3.3 Infrastructure Layer

Contains:

- PostgreSQL database.
- Supabase Auth.
- Supabase Storage.
- Notification integration.
- AI provider integration.
- Background job infrastructure.
- Monitoring and logging services.

Infrastructure implementations must be accessed through appropriate application interfaces.

3.4 System Architecture Diagram

flowchart TB
    subgraph CLIENTS["Presentation Layer"]
        WEB["Next.js Web"]
        MOBILE["React Native Mobile"]
    end

    subgraph BACKEND["Application Layer - NestJS"]
        API["REST API"]

        subgraph MODULES["Business Modules"]
            AUTH["Identity"]
            PROFILE["User Profile"]
            NUTRITION["Nutrition"]
            FOOD["Food Database"]
            WORKOUT["Workout"]
            NOTIFICATION["Notifications"]
            PROGRESS["Progress"]
            AI["AI Assistant"]
            RESEARCH["Research Centre"]
        end
    end

    subgraph INFRA["Infrastructure Layer"]
        DB[("PostgreSQL")]
        STORAGE["Supabase Storage"]
        SUPABASEAUTH["Supabase Auth"]
        AIPROVIDER["AI Provider"]
        PUSH["Notification Provider"]
    end

    WEB --> API
    MOBILE --> API
    API --> MODULES

    AUTH --> SUPABASEAUTH
    PROFILE --> DB
    PROFILE --> STORAGE
    NUTRITION --> DB
    FOOD --> DB
    WORKOUT --> DB
    NOTIFICATION --> DB
    NOTIFICATION --> PUSH
    PROGRESS --> DB
    AI --> AIPROVIDER
    RESEARCH --> DB

This diagram represents logical responsibilities. Detailed module dependencies and database access rules will be defined in the LLD.

---

4. Major System Components

4.1 Web Application

Technology: Next.js + TypeScript

Responsibilities:

- User registration and login interface.
- Onboarding.
- Dashboard.
- Meal planning.
- Food tracking.
- Workout management.
- Progress visualization.
- Educational content.

The web application will communicate with the backend through versioned REST APIs.

4.2 Mobile Application

Technology: React Native + Expo + TypeScript

Responsibilities:

- Mobile-specific navigation.
- User authentication interface.
- Meal and workout management.
- Food tracking.
- Push notification handling.
- Camera and image upload support when implemented.
- Progress monitoring.

The mobile application must use the same backend business rules as the web application.

4.3 Backend API

Technology: NestJS + TypeScript

The backend acts as the central application entry point.

Responsibilities:

- API routing.
- Request validation.
- Authentication verification.
- Authorization.
- Business logic coordination.
- Database operations.
- External service integration.
- Error handling.
- Logging.

API prefix:

"/api/v1"

4.4 Database

Technology: PostgreSQL through Supabase

Responsibilities:

- Store user information.
- Store food and nutrition data.
- Store meal plans and food entries.
- Store workout plans and sessions.
- Store notification preferences.
- Store progress history.

Database transactions and constraints must protect data consistency.

4.5 Authentication

Technology: Supabase Auth

Responsibilities:

- Account registration.
- Login.
- Session management.
- Password recovery.
- Token issuance.

The backend must verify authentication tokens and independently enforce resource authorization.

4.6 File Storage

Technology: Supabase Storage

Potential uses:

- User profile images.
- Food images.
- Exercise illustrations.
- Other approved user-uploaded files.

Access to private files must follow appropriate authorization policies.

4.7 Notification Service

Responsibilities:

- Manage notification preferences.
- Schedule meal reminders.
- Schedule workout reminders.
- Handle schedule changes.
- Deliver notifications through supported providers.

Notification delivery must respect user permissions, configured time zones and quiet hours.

4.8 AI Integration

Responsibilities:

- Process approved AI requests.
- Generate meal suggestions.
- Assist with nutrition explanations.
- Support future food image recognition.

AI integration must remain optional.

Manual meal planning, food tracking and workout management must continue working when the AI provider is unavailable.

---

5. Backend Module Design

The backend will use a modular monolith.

Each module has a defined business responsibility.

Module| Main responsibility
Identity| Authentication integration and identity-related operations
User Profile| Personal information, goals and preferences
Nutrition| Calorie calculations and meal plans
Food Database| Food information and portions
Workout| Exercise plans and workout sessions
Notifications| Reminder scheduling and preferences
Progress| Historical records and analytics
AI Assistant| Optional AI-powered assistance
Research Centre| Educational content and source management

5.1 Module Interaction Rules

- Modules must expose clearly defined interfaces.
- Modules must not access another module's internal implementation.
- Cross-module operations must use approved contracts.
- Data ownership must be documented.
- Circular dependencies must be avoided.
- Module interactions must be testable.

Example:

The Nutrition module can request a meal reminder through the Notification module's defined interface.

It must not directly modify the Notification module's database tables.

---

6. Main System Workflows

6.1 User Registration Workflow

1. User opens VitaFixa.
2. User enters registration information.
3. Frontend sends the request to the authentication integration.
4. Supabase Auth processes registration.
5. Backend verifies the user's identity when authenticated application operations begin.
6. User completes onboarding.
7. User profile information is saved.
8. User reaches the dashboard.

6.2 Meal Planning Workflow

1. User opens the nutrition section.
2. User creates a meal plan.
3. User searches the food database.
4. Food information is retrieved.
5. User selects a food and portion.
6. Backend validates the request.
7. Nutrition calculations are performed.
8. Meal information is saved in PostgreSQL.
9. The updated meal plan is returned to the frontend.

6.3 Food Tracking Workflow

1. User opens the daily tracking screen.
2. User selects a food item.
3. User enters the consumed portion.
4. Frontend sends the tracking request.
5. Backend validates the entry.
6. Nutrition module calculates nutritional values.
7. Entry is saved.
8. Daily totals are updated or recalculated.
9. Updated information is displayed.

6.4 Meal Reminder Workflow

1. User creates a meal schedule.
2. User enables reminders.
3. Nutrition module requests reminder scheduling.
4. Notification module validates the schedule.
5. A Reminder rule is stored (disabled unless the user enables it). A linked reminder mirrors the meal's time, selected weekdays and plan dates.
6. A background job creates ScheduledReminder occurrences for a short rolling window ahead.
7. Background processing handles due occurrences. An occurrence due inside quiet hours is marked suppressed and is not sent later.
8. Notification provider attempts delivery.
9. Delivery outcome is recorded where supported.

Changing or deleting a meal schedule must update its related reminders. The reminder rule is updated in the same transaction as the meal, and pending occurrences are cancelled and regenerated. Custom reminders are standalone rules that depend only on their own enabled setting. Details are in ADR-003 section 2.4.

6.5 Workout Workflow

1. User creates a workout plan.
2. User selects exercises.
3. User enters sets and repetitions.
4. Backend validates the plan.
5. Workout plan is stored.
6. User receives a reminder if enabled.
7. User records workout completion.
8. Progress module receives the relevant workout information.
9. Workout history is updated.

6.6 AI Meal Suggestion Workflow

1. User requests a meal suggestion.
2. Backend verifies authentication and permissions.
3. Relevant profile and nutrition information is retrieved.
4. Approved information is sent to the AI provider.
5. AI generates a suggestion.
6. Backend validates the output against safety rules.
7. Result is returned to the user.
8. User decides whether to use or ignore the suggestion.

AI output must not be automatically treated as a medically validated diet plan.

---

7. API Communication Design

Web and mobile applications will use the same REST API.

7.1 API Conventions

- Base path: "/api/v1"
- Data format: JSON.
- Communication: HTTPS in production.
- Authentication: Verified access tokens.
- Validation: Server-side request validation.
- Errors: Consistent error response structure.
- Documentation: OpenAPI / Swagger.

7.2 Main API Groups

API group| Example responsibility
"/api/v1/users"| User profile
"/api/v1/nutrition"| Nutrition operations
"/api/v1/foods"| Food search
"/api/v1/meal-plans"| Meal plan management
"/api/v1/workouts"| Workout management
"/api/v1/notifications"| Reminder preferences
"/api/v1/progress"| Progress records
"/api/v1/ai"| AI assistance
"/api/v1/research"| Educational content

The exact endpoints, request schemas and response schemas will be specified in the API design documentation.

---

8. High-Level Data Design

The system will use PostgreSQL as its primary relational database.

8.1 Main Data Areas

Identity and Profile

- User identity reference.
- Profile.
- Goals.
- Preferences.

Nutrition

- Food.
- Food portions.
- Nutritional values.
- Meal plans.
- Meals.
- Meal entries.

Workout

- Exercise.
- Workout plan.
- Workout session.
- Exercise completion records.

Notifications

- Notification preferences.
- Scheduled reminders.
- Delivery records where supported.

Progress

- Weight records.
- Nutrition summaries.
- Workout history.

Research

- Educational articles.
- Source references.
- Publication information.

8.2 Data Ownership

Each business module must have clearly documented ownership of its data.

Other modules must use defined interfaces instead of directly manipulating another module's internal records.

The complete entity relationships, constraints and database schema will be defined in the database design and LLD documents.

---

9. Security Architecture

Security must be applied across all system layers.

9.1 Authentication

- Use Supabase Auth for supported identity operations.
- Verify access tokens on protected backend endpoints.
- Handle session expiration securely.

9.2 Authorization

- Check permissions on the backend.
- Enforce ownership of user-specific records.
- Restrict administrative operations.
- Never rely only on frontend authorization checks.

9.3 Data Protection

- Use HTTPS in production.
- Store secrets in secure environment configuration.
- Never expose private API credentials.
- Apply database access controls.
- Use appropriate Supabase Row Level Security policies.
- Validate uploaded files.
- Limit access to sensitive information.

9.4 Monitoring

Security-relevant events should be logged appropriately.

Logs must not expose passwords, access tokens or unnecessary sensitive personal information.

---

10. Reliability and Fault Handling

The system must handle failures without unnecessarily affecting unrelated functionality.

Examples:

Failure| Expected behavior
AI provider unavailable| Manual planning continues
Notification provider unavailable| Application remains usable; failed delivery is handled safely
Temporary database connection failure| Return a controlled error and log the failure
Invalid user request| Return a validation error
Expired authentication token| Require reauthentication
Background job failure| Apply controlled retry or failure handling

Retries must be used carefully, especially for operations that could create duplicate records or notifications.

---

11. Deployment Architecture

11.1 Environments

The system will use three environments.

Development

- Local development.
- Test credentials.
- Development database.
- Debug logging.

Staging

- Production-like configuration.
- Integration and release testing.
- Separate test data.

Production

- Real users.
- Protected secrets.
- Monitoring.
- Backups.
- Controlled deployment.

11.2 Initial Deployment Components

Component| Proposed platform
Web frontend| Vercel
Backend API| Dedicated backend hosting provider, to be selected
Database| Supabase PostgreSQL
Authentication| Supabase Auth
File storage| Supabase Storage
Source control| GitHub
Android distribution| Google Play Store

The final backend hosting provider and deployment configuration will be selected after evaluating cost, reliability, security and operational requirements.

11.3 Deployment Diagram

flowchart TB
    USER[Users]

    WEB[Web Application - Vercel]
    MOBILE[Android and iOS Applications]

    API[Backend API Hosting]

    DB[(Supabase PostgreSQL)]
    AUTH[Supabase Auth]
    STORAGE[Supabase Storage]

    SERVICES[External Providers]

    USER --> WEB
    USER --> MOBILE

    WEB --> API
    MOBILE --> API

    API --> DB
    API --> AUTH
    API --> STORAGE
    API --> SERVICES

---

12. Logging and Monitoring

The application must provide visibility into system behavior.

Requirements:

- Centralized application logging.
- Request and error tracking.
- API performance monitoring.
- Database performance monitoring.
- Background job monitoring.
- Health-check endpoints.
- Error alerts for important failures.

Sensitive information must be excluded from logs.

Monitoring technology will be selected before production deployment.

---

13. Scalability Strategy

The first release will use a modular monolith.

Initial scaling methods:

- Database indexing.
- Query optimization.
- Pagination.
- Connection pooling.
- Caching where appropriate.
- Background job processing.
- Horizontal scaling of stateless backend instances where supported.

Individual modules should only be extracted into separate services when measured technical or business needs justify the additional operational complexity.

---

14. Testing Strategy

Each major component must be tested at appropriate levels.

Testing level| Purpose
Unit testing| Verify individual business operations
Integration testing| Verify interactions with infrastructure
API testing| Verify request and response behavior
Module boundary testing| Verify module contracts
End-to-end testing| Verify complete user workflows
Security testing| Identify security weaknesses
Performance testing| Evaluate response times and workload behavior
Mobile testing| Verify Android and iOS behavior

Critical workflows such as account access, meal planning, food tracking and notification scheduling require dedicated tests.

---

15. Architectural Decisions and Future Considerations

The following decisions are established as the initial design baseline:

1. Use a modular monolith for the backend.
2. Use Next.js for the web frontend.
3. Use React Native and Expo for mobile.
4. Use NestJS for backend development.
5. Use PostgreSQL as the primary relational database.
6. Use Supabase for managed database, authentication and storage capabilities.
7. Use REST APIs for initial client-server communication.
8. Keep AI services optional.
9. Use GitHub as the source of truth for code and documentation.
10. Maintain separate development, staging and production environments.

Detailed implementation decisions must be recorded in Architecture Decision Records.

Unresolved decisions must not be treated as finalized.

---

16. Relationship with Other Documents

Document| Purpose
Technical Architecture| Overall architectural principles and technology baseline
PRD| Product scope and functional requirements
HLD| Major system components and their interactions
LLD| Detailed internal implementation design
Database Design| Entity relationships and schema
API Documentation| Endpoint contracts
Security Documentation| Detailed security controls
Testing Strategy| Test coverage and verification approach
ADRs| Important architectural decisions and trade-offs

All documents must be kept consistent.

When a product or architecture change affects this design, the HLD must be reviewed and updated.

---

17. Definition of Done

The high-level design is ready for implementation planning when:

- Major system components are identified.
- Component responsibilities are clear.
- Main workflows are documented.
- Module boundaries are established.
- Data ownership is understood.
- API communication conventions are defined.
- Security responsibilities are documented.
- Deployment environments are planned.
- Failure handling is considered.
- Relevant architectural decisions are recorded.

---

Final Design Principle

VitaFixa must be developed as a modular, secure, reliable and maintainable platform.

Every component should have a clear responsibility, every interaction should follow an approved contract, and every important design decision should be documented.

Design the system carefully. Implement it incrementally. Verify every change.

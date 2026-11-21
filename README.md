VitaFixa

Your Health. Your Way.

VitaFixa is a fitness and nutrition planning platform designed to help people organize their daily meals, nutrition, workouts, and health-related progress in one place.

Our goal is to make fitness planning easier through personalized plans, food tracking, workout scheduling, reminders, and useful progress insights.

«Project status: Planning and documentation phase. Application development has not yet started.»

Vision

Build a reliable, user-friendly platform that helps people make informed decisions about their nutrition and fitness through organized planning and progress tracking.

Planned Features

Nutrition and Meal Planning

- Personalized nutrition profiles.
- Custom meal and diet plans.
- Food database with portion information.
- Daily calorie and macronutrient tracking.
- Meal scheduling and reminders.
- Food substitutions and meal editing.

Fitness and Workout Planning

- Custom workout schedules.
- Exercise library.
- Sets, repetitions, and workout tracking.
- Workout completion history.
- Fitness progress monitoring.

Progress and Insights

- Weight tracking.
- Nutrition consistency tracking.
- Workout history.
- Weekly progress summaries.
- Goal monitoring.

Notifications

- Meal reminders.
- Workout reminders.
- Configurable notification preferences.
- Quiet hours.

Future AI Capabilities

- AI-assisted meal suggestions.
- Personalized planning assistance.
- Food recognition from images.
- Intelligent progress insights.

These are planned capabilities, not currently available features.

Planned Technology Stack

Area| Technology
Web| Next.js
Mobile| React Native + Expo
Language| TypeScript
Backend| NestJS
Architecture| Modular Monolith
Database| PostgreSQL
Database Platform| Supabase
ORM| Prisma
Authentication| Supabase Auth
API| REST
API Documentation| OpenAPI / Swagger
Version Control| GitHub
CI/CD| GitHub Actions

See the architecture documentation and ADRs for technical details and approved decisions.

Project Architecture

VitaFixa will initially use a Modular Monolith architecture.

The system will maintain clear boundaries between major areas such as:

- Authentication and User Management
- User Profiles
- Nutrition and Food Management
- Meal Planning
- Workout Management
- Notifications
- Progress Tracking
- AI Integration

The web and mobile applications will communicate with the backend through documented APIs.

Repository Structure

VitaFixa/
├── docs/
│   ├── architecture/
│   ├── requirements/
│   ├── database/
│   ├── api/
│   ├── security/
│   └── testing/
├── AGENTS.md
├── CLAUDE.md
├── README.md
└── .gitignore

The repository structure will evolve as development begins.

Documentation

Project documentation is maintained in the "docs/" directory.

It includes:

- Product Requirements Document (PRD)
- Technical Architecture
- High-Level Design (HLD)
- Low-Level Design (LLD)
- Database Design
- API Specification
- Security Design
- Testing Strategy
- Architecture Decision Records (ADRs)

Development Principles

VitaFixa follows these principles:

- Modular and maintainable architecture.
- Security and privacy by design.
- Evidence-informed nutrition information.
- Clear API contracts.
- Automated testing.
- Controlled and incremental development.
- Human-reviewed AI-generated code.
- Documentation that evolves with the product.

AI-Assisted Development

Claude Code is the primary AI coding assistant for this project.

AI development must follow:

- "AGENTS.md" for shared project rules.
- "CLAUDE.md" for Claude-specific instructions.
- Approved requirements and architecture documents.

All significant changes must be reviewed before merging into the main branch.

Project Roadmap

1. Complete product and technical documentation.
2. Establish repository structure and development tooling.
3. Implement backend foundations.
4. Implement authentication and user profiles.
5. Develop nutrition and meal planning.
6. Develop workout planning and tracking.
7. Implement reminders and notifications.
8. Develop progress tracking.
9. Introduce approved AI capabilities.
10. Test, secure, and prepare for release.

Project Status

Current phase: Documentation and architecture preparation.

Features described in this README are planned unless explicitly identified as implemented.

License

License to be determined before public distribution.

---

VitaFixa — Your Health. Your Way.

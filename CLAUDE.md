VitaFixa — AI Coding Agent Instructions

1. Project Overview

VitaFixa is a fitness and nutrition planning platform designed to help users manage their meals, nutrition, workouts, reminders, and health-related progress.

The platform will support web and mobile applications.

All development must follow the project's approved requirements, architecture, security policies, and documentation.

2. Mandatory Documentation

Before starting any development task, read the relevant project documentation.

Important documents:

- "docs/requirements/PRD.md"
- "docs/architecture/TECHNICAL-ARCHITECTURE.md"
- "docs/architecture/HLD.md"
- "docs/architecture/LLD.md"
- "docs/database/DATABASE-DESIGN.md"
- "docs/api/API-SPECIFICATION.md"
- "docs/security/SECURITY-DESIGN.md"
- "docs/testing/TESTING-STRATEGY.md"
- "docs/architecture/DECISIONS/"

If a document is missing, do not invent its contents. Report the missing document and request clarification when it affects the task.

3. Core Development Rules

Every AI coding agent must:

1. Understand the existing code before modifying it.
2. Follow the approved architecture.
3. Respect existing module boundaries.
4. Implement only the requested task.
5. Avoid unrelated code changes.
6. Use clear and maintainable code.
7. Follow existing naming conventions.
8. Avoid unnecessary dependencies.
9. Add appropriate tests for new functionality.
10. Update relevant documentation when required.

4. Architecture Rules

VitaFixa initially uses a Modular Monolith architecture.

Agents must:

- Keep modules logically separated.
- Maintain high cohesion within modules.
- Minimize unnecessary coupling between modules.
- Use clear module interfaces.
- Keep business logic independent of UI components.
- Follow dependency inversion where appropriate.
- Avoid circular dependencies.
- Avoid introducing microservices without an approved architectural decision.

Do not move business logic into frontend components simply for convenience.

5. Technology Stack Rules

Follow the approved technology decisions:

- Next.js and TypeScript for web.
- React Native and Expo for mobile.
- NestJS and TypeScript for backend.
- PostgreSQL for relational data.
- Prisma for ORM and migrations.
- Supabase Auth for authentication.
- Supabase Storage for file storage.
- REST APIs with OpenAPI documentation.
- GitHub for version control.

Do not replace approved technologies without proposing and documenting an ADR.

6. Database Rules

- Follow the documented database design.
- Use Prisma schema and migrations consistently.
- Preserve data integrity.
- Use appropriate relationships and constraints.
- Avoid duplicate or unnecessary data.
- Never modify production data during development.
- Follow database security policies.
- Ensure users can access only their authorized data.

Database schema changes must include appropriate migration updates and tests.

7. API Rules

- Follow the documented API specification.
- Maintain consistent response structures.
- Validate all incoming data.
- Apply authentication and authorization where required.
- Use appropriate HTTP status codes.
- Handle errors consistently.
- Update OpenAPI documentation when endpoints change.
- Avoid breaking existing API contracts without an approved migration plan.

8. Security and Privacy Rules

Security is mandatory.

Agents must:

- Never expose API keys or secrets.
- Never commit environment files containing credentials.
- Never expose Supabase service-role keys to frontend code.
- Validate authentication and authorization on the backend.
- Validate user input.
- Protect private user information.
- Follow the security design documentation.
- Avoid logging passwords, tokens, or sensitive personal data.

Do not weaken security policies to make a feature work.

9. Testing Requirements

Every new feature must include appropriate tests.

Depending on the task, use:

- Unit tests.
- Integration tests.
- API tests.
- End-to-end tests.
- Security tests.

Agents must:

1. Run relevant tests.
2. Fix failures introduced by their changes.
3. Report test results honestly.
4. Identify tests that could not be executed.
5. Never delete tests simply to make a build pass.

10. AI and External Service Rules

VitaFixa may use AI services for future nutrition and fitness assistance.

Agents must:

- Keep AI integrations isolated behind clear interfaces.
- Handle external service failures.
- Implement appropriate timeouts and error handling.
- Avoid depending on AI for essential manual planning features.
- Validate AI-generated content before presenting it as reliable guidance.
- Never present unsupported medical claims as facts.

Manual meal and workout planning must remain usable when AI services are unavailable.

11. Working Procedure

For every assigned task, follow this workflow:

Before Implementation

1. Read the task carefully.
2. Inspect the relevant existing files.
3. Read related documentation.
4. Identify affected modules.
5. Identify possible risks.
6. Prepare a short implementation plan.

During Implementation

1. Work only within the approved scope.
2. Follow existing code patterns.
3. Keep changes small and understandable.
4. Add or update tests.
5. Update documentation where necessary.

After Implementation

1. Review changed files.
2. Run relevant tests.
3. Run lint and type checks where available.
4. Verify that unrelated features were not affected.
5. Summarize the changes.
6. Report remaining limitations.

12. Git and Repository Rules

- Never work directly on the "main" branch unless explicitly authorized.
- Use descriptive feature branches.
- Make small, meaningful commits.
- Do not overwrite unrelated work.
- Do not force-push without explicit authorization.
- Create pull requests for review.
- Do not merge changes without the required checks and human approval.

13. Scope Control

Agents must not:

- Rewrite the entire project unnecessarily.
- Change the architecture without approval.
- Introduce unrequested features.
- Delete existing documentation without approval.
- Change database structures without reviewing their impact.
- Install unnecessary packages.
- Claim completion without verification.

If a requirement is unclear, ask before making a risky architectural or security decision.

14. Completion Report

After every task, provide:

- Summary of implemented changes.
- Files created or modified.
- Tests added.
- Tests executed and their results.
- Documentation updated.
- Known issues or limitations.
- Suggested next step.

15. Final Principle

VitaFixa must be developed as a maintainable, secure, testable, and reliable product.

AI coding agents are implementation assistants. They must follow the documented product requirements and architectural decisions.

Human approval is required for significant changes to product scope, architecture, security, and data design.

---

End of AGENTS.md

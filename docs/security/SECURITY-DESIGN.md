VitaFixa — Security Design

Document: Security Design
Project: VitaFixa
Version: 1.0
Status: Initial Design
Security Approach: Defense in Depth

---

1. Purpose

This document defines the security requirements and protective measures for VitaFixa.

VitaFixa will handle personal user information, including:

- Account information.
- Age and date of birth.
- Height and weight.
- Nutrition and food records.
- Food allergies and preferences.
- Workout schedules and history.
- Health and fitness goals.
- Progress information.

The primary goal is to protect user privacy, prevent unauthorized access, maintain data integrity, and ensure that the platform operates securely.

Security must be considered during design, development, testing, deployment, and maintenance.

2. Security Objectives

VitaFixa must follow these security objectives:

2.1 Confidentiality

Only authorized users and services can access protected information.

2.2 Integrity

User information must not be modified, deleted, or manipulated by unauthorized parties.

2.3 Availability

The application should remain accessible and recover gracefully from service failures and attacks.

2.4 Privacy

Collect only information necessary for the application's functionality and protect personal information throughout its lifecycle.

2.5 Accountability

Important security-related activities must be recorded through appropriate audit and monitoring mechanisms.

3. Security Principles

All developers and AI coding agents must follow these principles:

1. Security by design.
2. Least privilege.
3. Defense in depth.
4. Secure defaults.
5. Server-side validation.
6. Explicit authorization.
7. Data minimization.
8. Separation of responsibilities.
9. Secure secret management.
10. Regular security testing.
11. Privacy by default.
12. Fail securely when authorization or validation cannot be completed.

Security must never depend only on frontend restrictions.

4. Threat Model

The following threats must be considered during development.

Threat| Possible Impact| Required Protection
Unauthorized account access| Personal data exposure| Secure authentication and session management
Broken access control| Access to another user's records| Resource ownership checks
SQL injection| Database compromise| Safe queries and parameterized database access
Cross-site scripting (XSS)| Malicious scripts executed in a browser| Output handling and content security policies
Cross-site request forgery (CSRF)| Unauthorized browser actions| Appropriate CSRF protections for cookie-based authentication
Credential theft| Account takeover| Secure authentication and session controls
API abuse| Service disruption or excessive costs| Rate limiting and monitoring
Exposed secrets| Unauthorized system access| Secure secret storage
Malicious file uploads| Malware or data compromise| File validation and restricted storage
External service failure| Interrupted functionality| Timeouts and graceful degradation
Database exposure| Loss of private information| Access controls, encryption, and backups
AI data leakage| Unnecessary disclosure of user information| Data minimization and controlled integrations

This is an initial threat model. It must be reviewed and expanded as the application grows.

5. Authentication Security

VitaFixa will use Supabase Auth for authentication.

Authentication responsibilities must be clearly separated from application authorization.

5.1 Authentication requirements

- Users must authenticate before accessing protected features.
- Password handling must be delegated to the authentication provider.
- The application must never store plaintext passwords.
- Authentication tokens must be validated by the backend.
- Expired or invalid sessions must be rejected.
- Logout must invalidate or terminate the appropriate session.
- Password reset and account recovery must use secure provider-supported flows.
- Authentication errors must not expose sensitive account information.

5.2 Token security

The backend must validate:

- Token signature.
- Token expiration.
- Issuer.
- Audience where applicable.
- Expected authentication claims.

The backend must not trust an unverified JWT payload.

5.3 Session management

- Use secure session handling.
- Avoid storing authentication tokens in insecure browser storage.
- Prefer secure, HttpOnly, SameSite cookies when using a cookie-based web session architecture.
- Protect cookie-based state-changing requests against CSRF.
- Use appropriate token storage and refresh mechanisms in mobile applications.
- Clear locally stored session information during logout.
- Handle expired sessions safely.

The exact session strategy must be finalized before implementation for both web and mobile clients.

6. Authorization and Access Control

Authentication confirms who the user is.

Authorization determines what that user is allowed to do.

VitaFixa must implement server-side authorization for all protected resources.

6.1 User ownership

Users must access only their own private resources.

Examples:

- Meal plans.
- Food logs.
- Weight records.
- Workout sessions.
- Personal goals.
- Reminders.
- Preferences.

A user must never access another user's private data by changing a resource ID in an API request.

6.2 Role-based access control

The application may support these roles:

Role| Permissions
User| Manage own account and records
Admin| Perform approved administrative operations
Content Manager| Manage approved educational content

Roles must be assigned and verified through trusted backend-controlled mechanisms.

Users must not be able to grant themselves administrative permissions.

6.3 Least privilege

Every service and database connection must receive only the permissions necessary to perform its responsibilities.

Administrative access must be restricted and monitored.

7. Database Security

VitaFixa will use PostgreSQL through Supabase.

Database security must include multiple layers of protection.

7.1 Row Level Security (RLS)

RLS must be enabled and correctly configured for tables containing user-owned private information.

Policies must ensure that:

- Users can read only authorized records.
- Users can create records only for their own account.
- Users can update only records they own.
- Users cannot delete another user's records.
- Administrative access follows separately controlled permissions.

RLS policies must be tested independently.

7.2 Backend authorization

RLS does not replace backend authorization.

The NestJS backend must independently verify user identity and resource ownership before performing protected operations.

7.3 Database access

- Use Prisma or approved parameterized database access.
- Avoid unsafe raw SQL.
- Restrict database permissions.
- Keep production credentials private.
- Never expose database connection strings to frontend applications.
- Review database migrations before production deployment.
- Separate development and production environments.

7.4 Sensitive database operations

Operations involving account deletion, personal data exports, and administrative access must receive additional security review.

8. Data Protection and Privacy

8.1 Data minimization

Collect only information required for product functionality.

Do not collect unnecessary personal information.

8.2 Data classification

Classification| Examples| Protection
Public| Published educational articles| Controlled publishing
Internal| Application configuration| Restricted access
Personal| Email and profile information| Authentication and access control
Sensitive personal| Weight history, allergies, nutrition records| Strict authorization and additional privacy controls
Confidential| Secrets, API keys, database credentials| Restricted secret management

8.3 Encryption

Data in transit

- Use HTTPS for deployed application communication.
- Use secure TLS connections for external services.
- Reject insecure production connections.

Data at rest

- Use encryption at rest provided by the hosting and database infrastructure.
- Protect backups and uploaded files.
- Restrict access to encryption keys and credentials.

8.4 Personal information handling

- Do not expose private user information in public API responses.
- Do not include sensitive information in application logs.
- Avoid unnecessary duplication of personal records.
- Use appropriate retention and deletion policies.
- Restrict internal access to user information.

8.5 User privacy controls

The application should support:

- Viewing personal information.
- Updating personal information.
- Requesting account deletion.
- Requesting a copy of personal information where supported.
- Managing notification preferences.
- Understanding how personal information is used.

Applicable privacy and data-protection requirements must be reviewed before public launch.

9. API Security

All API endpoints must follow the API Specification.

Required protections

1. Validate authentication.
2. Enforce authorization.
3. Validate request bodies and parameters.
4. Use safe database operations.
5. Apply rate limiting.
6. Restrict sensitive operations.
7. Use consistent error handling.
8. Avoid exposing internal errors.
9. Apply appropriate request size limits.
10. Validate resource ownership.

API-specific risks

Special attention must be given to:

- Broken Object Level Authorization (BOLA).
- Broken Function Level Authorization (BFLA).
- Injection attacks.
- Excessive resource consumption.
- Authentication weaknesses.
- Improper error handling.

The backend must not assume that a valid resource ID means the requester is authorized to access it.

10. Frontend Security

Both web and mobile applications must follow secure development practices.

Web application

- Avoid unsafe HTML rendering.
- Sanitize untrusted content when necessary.
- Apply an appropriate Content Security Policy.
- Use secure cookie settings when cookies are used.
- Protect state-changing cookie-authenticated requests against CSRF.
- Avoid exposing private environment variables.
- Validate redirects to prevent open redirect vulnerabilities.
- Do not rely on hidden buttons or frontend route guards for authorization.

Mobile application

- Use secure platform-supported storage for sensitive credentials.
- Avoid storing unnecessary personal information locally.
- Do not embed server secrets in application binaries.
- Validate API responses.
- Handle authentication expiration securely.
- Avoid exposing sensitive information in debug logs.

11. Secret Management

Secrets include:

- Supabase service-role keys.
- Database credentials.
- JWT-related secrets.
- AI provider API keys.
- Email service credentials.
- Payment provider credentials in future phases.

Rules

- Store secrets in environment variables or approved secret-management services.
- Never commit secrets to GitHub.
- Maintain a safe ".env.example" containing placeholder values only.
- Add real environment files to ".gitignore".
- Keep production secrets separate from development secrets.
- Rotate exposed or compromised credentials immediately.
- Restrict access to production secrets.

Critical rule: Supabase service-role keys and other privileged credentials must never be included in frontend code.

12. File and Image Upload Security

Future features may allow users to upload food images or profile images.

All uploads must follow these rules:

- Validate file type.
- Validate actual file content where appropriate.
- Enforce maximum file size.
- Generate safe storage names.
- Do not trust user-provided filenames.
- Restrict executable file types.
- Store private files in private storage locations.
- Use authorization-controlled access or signed URLs.
- Apply appropriate retention policies.
- Avoid exposing private image URLs publicly.

Image recognition features must not automatically make uploaded images publicly accessible.

13. AI and External Service Security

VitaFixa may integrate external AI providers and other third-party services.

Requirements

- Send only the minimum information required.
- Never expose provider API keys to frontend applications.
- Validate external service responses.
- Apply request timeouts.
- Apply rate limits and cost controls.
- Handle provider failures gracefully.
- Avoid sending unnecessary personal information.
- Review third-party privacy and data-handling practices.
- Do not allow AI-generated output to bypass normal application validation.

AI-generated meal suggestions must not automatically modify a user's saved plan without explicit confirmation.

Manual meal planning must remain available even if an AI provider is unavailable.

14. Logging and Monitoring

Security-related events must be monitored appropriately.

Examples:

- Failed authentication attempts.
- Suspicious access attempts.
- Repeated authorization failures.
- Rate-limit violations.
- Administrative actions.
- Account deletion requests.
- Unexpected service errors.

Logging rules

- Never log passwords.
- Never log authentication tokens.
- Never log database credentials.
- Avoid logging sensitive health and personal information.
- Restrict access to production logs.
- Define retention periods.
- Protect logs against unauthorized modification.

Monitoring should help identify suspicious behavior without unnecessarily collecting personal information.

15. Rate Limiting and Abuse Prevention

Apply rate limits to protect the application.

Important targets include:

- Authentication-related requests.
- Food database searches.
- AI requests.
- File uploads.
- Resource-intensive reporting endpoints.

Additional protections may include:

- Request size limits.
- Abuse detection.
- Temporary blocking of suspicious activity.
- API usage monitoring.
- Cost monitoring for external integrations.

Return HTTP "429" when a request exceeds its allowed rate.

16. Backup and Recovery Security

VitaFixa must protect data against accidental deletion, corruption, and infrastructure failure.

Requirements:

- Enable appropriate database backups.
- Protect backups using encryption and access controls.
- Define backup retention periods.
- Restrict backup access.
- Test restoration procedures.
- Define recovery objectives before production launch.
- Document incident recovery steps.

A backup is not considered reliable until restoration has been tested.

17. Environment Security

Maintain separate environments:

Environment| Purpose
Local| Individual development
Development| Shared development and testing
Staging| Pre-production verification
Production| Real users and live data

Rules:

- Never use real production secrets in local development.
- Avoid copying real user data into development environments.
- Use separate databases and credentials.
- Restrict production access.
- Require review before production deployment.
- Apply security updates regularly.

18. Dependency and Code Security

The project must maintain secure dependencies and code.

Requirements:

- Use maintained libraries.
- Review dependency updates.
- Remove unused dependencies.
- Run dependency vulnerability checks.
- Use automated security scanning where practical.
- Review code before merging.
- Avoid committing credentials.
- Keep runtime and framework versions supported.
- Review third-party package permissions and behavior.

GitHub security features and automated checks should be enabled where available.

19. Security Testing

Security must be tested throughout development.

Authentication tests

- Invalid token rejection.
- Expired token rejection.
- Unauthorized access rejection.
- Secure logout behavior.

Authorization tests

- User A cannot read User B's meal plans.
- User A cannot update User B's food logs.
- User A cannot delete User B's progress records.
- Ordinary users cannot access admin operations.

Database tests

- RLS policies prevent unauthorized access.
- Database permissions follow least privilege.
- Sensitive queries cannot be manipulated.

API tests

- Invalid input is rejected.
- Rate limits work correctly.
- Error responses do not reveal secrets.
- Resource ownership is verified.
- File uploads reject invalid files.

Application tests

- Sensitive tokens are not exposed.
- Frontend authorization restrictions are not treated as the only protection.
- Session expiration is handled safely.
- Sensitive information is not unnecessarily stored or logged.

Security testing must be included in the development workflow.

20. Security Incident Response

A security incident may involve:

- Unauthorized account access.
- Exposed credentials.
- Data leakage.
- Database compromise.
- Malicious uploads.
- Abuse of application endpoints.

Response process

1. Identify and investigate the incident.
2. Determine the affected systems and information.
3. Contain the issue.
4. Revoke or rotate compromised credentials.
5. Restore secure service operation.
6. Recover affected data where necessary.
7. Document the incident.
8. Identify the root cause.
9. Apply preventive improvements.
10. Complete any required user or regulatory notifications.

Incident response must prioritize user protection and data integrity.

21. Security Responsibilities

Area| Responsibility
Authentication| Supabase Auth and backend validation
Authorization| NestJS backend
Database protection| PostgreSQL, RLS, and backend access controls
Frontend protection| Web and mobile development
Secret management| Deployment and infrastructure configuration
Monitoring| Backend and infrastructure
Security testing| Development and testing workflow
Incident response| Project maintainers and authorized operators

Security responsibilities must not be assumed to belong to only one technology or service.

22. Future Security Improvements

As VitaFixa grows, consider:

- Multi-factor authentication.
- Advanced anomaly detection.
- Dedicated security monitoring.
- Automated penetration testing.
- Independent security audits.
- Enhanced administrative audit trails.
- More advanced abuse prevention.
- Formal privacy impact assessments.
- Additional compliance controls based on target markets.

These improvements must be evaluated according to actual product requirements and risk.

23. AI Coding Agent Security Instructions

Every AI coding agent working on VitaFixa must follow these rules:

1. Read this document before implementing security-sensitive features.
2. Never hardcode secrets.
3. Never expose privileged credentials to frontend applications.
4. Enforce authentication and authorization on the backend.
5. Verify resource ownership for user-specific data.
6. Validate all incoming requests.
7. Follow database RLS policies.
8. Never disable security checks merely to make tests pass.
9. Add security tests for new protected functionality.
10. Avoid logging sensitive information.
11. Do not introduce unnecessary personal data collection.
12. Do not change authentication architecture without approval.
13. Report security risks discovered during implementation.
14. Do not make unrelated security-sensitive changes.
15. Update documentation whenever security behavior changes.

If an implementation conflicts with this document, the AI agent must explain the conflict before making a significant architectural change.

24. Definition of Done

A feature involving protected information is complete only when:

- Authentication requirements are implemented.
- Authorization is enforced on the backend.
- Resource ownership is verified.
- Input validation is implemented.
- Database permissions are reviewed.
- Sensitive information is protected.
- Secrets are handled securely.
- Appropriate security tests pass.
- Errors do not reveal internal details.
- Logging follows privacy requirements.
- Documentation is updated.
- Changes pass code review.

---

Document Status: Initial Security Design
Maintained In: "docs/security/SECURITY-DESIGN.md"

Related Documents:

- "docs/requirements/PRD.md"
- "docs/architecture/TECHNICAL-ARCHITECTURE.md"
- "docs/architecture/HLD.md"
- "docs/architecture/LLD.md"
- "docs/databas

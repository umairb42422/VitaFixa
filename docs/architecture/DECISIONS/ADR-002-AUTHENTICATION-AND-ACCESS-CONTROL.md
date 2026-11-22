ADR-002: Authentication and Access Control

Project: VitaFixa
Status: Accepted
Decision Date: 2026-11-22
Decision Type: Security and Architecture
Related Documents: ADR-001, SECURITY-DESIGN.md, LLD.md, API-SPECIFICATION.md, DATABASE-DESIGN.md

---

1. Context

VitaFixa stores sensitive personal data (weight history, allergies, nutrition records). ADR-001 selected Supabase Auth, NestJS and Prisma, and listed "Authentication token validation in NestJS" and "Database security and Row Level Security policies" as items to finalize (ADR-001 section 7).

The existing documents leave several points open or inconsistent: who performs login and registration, how tokens are verified, which roles exist, and how Row Level Security (RLS) relates to Prisma. This ADR records the approved decisions. No authentication code is implemented by this ADR.

2. Decisions

2.1 Identity provider responsibilities

- Supabase Auth handles sign-up, login, logout, password reset and session issuance.
- Web and mobile clients call Supabase Auth directly.
- The NestJS backend does not handle passwords and does not expose login, register or logout endpoints in the MVP.
- The backend receives the access token as "Authorization: Bearer <access_token>" (API-SPECIFICATION.md section 5).
- The backend accepts the Bearer header only. It does not accept authentication cookies, so CSRF protection for cookie-based API calls is not required on the backend API.

2.2 Access token verification

- Tokens are verified locally in NestJS using the "jose" library and the public keys (JWKS) published by Supabase Auth at the project's "/auth/v1/.well-known/jwks.json" endpoint.
- No JWT signing secret is stored in the backend. The only required configuration is the Supabase project URL.
- The backend must validate: signature, expiration, issuer, audience ("authenticated") and the presence of the subject ("sub") claim.
- Only asymmetric algorithms published in the JWKS are accepted. Unsigned tokens and shared-secret (HS256) tokens are rejected.
- A global authentication guard in the Identity module applies to every route by default (default-deny). Public routes must be explicitly marked public.
- The guard sets the authenticated identity from the verified "sub" claim. A user identifier supplied in a request body, query or path is never trusted for authorization.
- Prerequisite: the Supabase project must use asymmetric JWT signing keys. The JWKS endpoint returns no keys otherwise.

2.3 Session rechecks for sensitive operations

- Local verification cannot detect a session that was revoked before the access token expires.
- For sensitive operations (account deletion, personal data export, and administrative access when it exists, per SECURITY-DESIGN.md section 7.4), the backend must re-check the session with the Supabase Auth server before executing the operation.
- Accepted limitation: logout and revocation take full effect for ordinary requests only when the access token expires.

2.4 Roles and permissions

- The MVP has no application roles. Access levels are: Public, Authenticated and Owner.
- Admin and Content Manager roles are not introduced. Adding them requires a new ADR that defines where roles are stored, how they are assigned and which operations they permit.
- Roles, when introduced, must never be read from user-editable data.

2.5 Resource ownership

- Every use case that touches user-owned data receives the owner identity from the verified token, never from client input.
- Every repository query for user-owned data filters by the owner in the same query. It must not fetch a record by ID alone and check ownership afterwards.
- When a user requests another user's resource, the API returns 404 Not Found, the same response as for a resource that does not exist. This avoids revealing that the resource exists.
- 403 Forbidden is reserved for function-level permission failures (for example a future role check).

2.6 Profile creation

- The UserProfile record is created on the user's first authenticated use, in the backend (User Profile module), keyed by the verified Supabase user identifier ("authUserId", unique).
- No database trigger on Supabase's "auth" schema is used.
- Prisma does not read or write the "auth" schema, and "authUserId" is a plain unique column without a foreign key to it.

3. Row Level Security and Prisma (corrected approach)

3.1 The contradiction that is being corrected

An earlier recommendation said both that "Prisma bypasses RLS" and that RLS is a "safety net". These statements need to be separated.

- RLS policies are applied to database roles. Prisma connects through the backend's database role. That role is expected to bypass RLS, which is also what Supabase's Prisma guidance does for its dedicated role. Therefore RLS provides no protection for queries made through Prisma. A missing owner filter in backend code is not caught by the database.
- RLS does protect the other paths into the database, namely Supabase's auto-generated data API when it is accessed with client-facing keys and roles ("anon" and "authenticated"). That is the only thing it guards against here.

So RLS is not a safety net for backend bugs. It is a safeguard against accidental direct access that bypasses the backend.

3.2 Security implications

- Backend authorization is the single enforcement point for all data accessed by NestJS. A mistake in ownership checks can expose user data. This is mitigated by the repository rule in section 2.5 and by mandatory authorization tests (access to another user's resource must return 404 for every user-owned endpoint).
- SECURITY-DESIGN.md section 7.1 expects per-user RLS policies. Such policies only take effect for requests that run as the user's database role. Since clients must never access the database directly (ADR-001 section 6), they would protect nothing today and would add complexity. They are not adopted for the MVP.
- If direct client access to the database or the data API is ever introduced, this decision must be revisited by a new ADR before it is enabled.

3.3 Approved approach (simplest secure option)

1. The NestJS backend connects with a dedicated database role for Prisma, not the default "postgres" role. It has no rights on the "auth" schema.
2. That role bypasses RLS. Backend authorization is the enforcement layer.
3. RLS is enabled on all tables holding user data, with no permissive policies for "anon" or "authenticated". These roles are therefore denied everything.
4. Supabase's auto-generated data API is turned off, because the project uses Prisma through the backend only.
5. No per-request database role switching and no per-user RLS policies in the MVP.
6. Tests for RLS must verify the deny-by-default behavior for "anon" and "authenticated", independently of the backend (SECURITY-DESIGN.md section 7.1).

4. Alternatives Considered

Area| Selected| Alternatives
Token verification| Local JWKS with jose| Calling Supabase Auth on every request; shared-secret HS256 verification
Login and registration| Clients call Supabase Auth| Backend proxy endpoints under "/api/v1/auth"
Roles| None in MVP| Roles in Supabase "app_metadata"; roles table in the database
Database authorization| Backend checks, RLS deny-by-default| Per-user RLS policies with per-request role switching through Prisma

5. Consequences

Positive

- No authentication secret in the backend and no per-request call to Supabase.
- Smaller backend scope: no password or credential handling.
- A single, clear place for data authorization.

Trade-offs and risks

- A revoked session remains valid for ordinary requests until the access token expires.
- Backend authorization bugs are not caught by the database.
- The Supabase project depends on correct signing-key configuration.
- Clients depend directly on Supabase Auth availability for login.

6. Items Still Open (not decided by this ADR)

1. Web and mobile session storage strategy (SECURITY-DESIGN.md section 5.3).
2. Access token lifetime and any "recent sign-in" requirement for sensitive operations.
3. Whether email verification is required before access. Social login and multi-factor authentication are not covered by current requirements.
4. Account deletion and data retention policy, and how the backend deletes the Supabase Auth user with the service-role key (server-side only).
5. Access control for "/health/ready" and "/health/live" (API-SPECIFICATION.md section 8.1).
6. Error response format: LLD.md section 8 and API-SPECIFICATION.md section 6 use different structures.
7. Profile field mismatches between API-SPECIFICATION.md section 8.2 (heightCm, weightKg, displayName) and DATABASE-DESIGN.md section 5.1 (heightValue, heightUnit, no display name).
8. Prisma and Supabase connection details (pooled and direct URLs, "directUrl", migration role and workflow), still open from ADR-001 section 7.
9. Role model for administrative content management, which requires a new ADR.

7. Documentation Impact

- ADR-001 section 7 item "Authentication token validation in NestJS" is resolved by this ADR. ADR-001 itself is not changed.
- SECURITY-DESIGN.md section 7.1, section 5.1 (logout) and section 11 ("JWT-related secrets") are interpreted as described in sections 2 and 3 of this ADR. Those documents have not been edited. A review may update them later.
- LLD.md section 5.1 lists register, authenticate and log out as Identity module operations. Under this ADR those happen in Supabase Auth, and the Identity module contains token verification, the authentication guard and the Supabase adapter.

---

End of ADR-002

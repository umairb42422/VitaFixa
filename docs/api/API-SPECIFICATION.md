VitaFixa — API Specification

Document: API Specification
Project: VitaFixa
Version: 1.0
Status: Initial Design
API Style: RESTful JSON API
Base Path: "/api/v1"

---

1. Purpose

This document defines the API standards and endpoint contracts for VitaFixa.

The API acts as the communication layer between:

- VitaFixa Web Application
- VitaFixa Mobile Application
- VitaFixa Backend
- External services and integrations

The goal is to provide a consistent, secure, maintainable, and scalable API.

This document is the initial API design. Detailed request and response schemas must be finalized during implementation and maintained in OpenAPI/Swagger documentation.

2. API Design Principles

All API development must follow these principles:

1. Use RESTful resource-based endpoints.
2. Use JSON for request and response bodies.
3. Use meaningful HTTP methods and status codes.
4. Keep business logic inside the backend.
5. Validate all incoming data on the server.
6. Apply authentication and authorization where required.
7. Use consistent error responses.
8. Version public API routes.
9. Avoid exposing internal database structures directly.
10. Document every implemented endpoint.
11. Keep web and mobile clients compatible with the same backend API.
12. Never trust data simply because it comes from an authenticated user.

3. Base URL and Versioning

All API endpoints must begin with:

"/api/v1"

Example:

"https://api.example.com/api/v1/users/me"

The production domain will be configured before deployment.

Versioning rules

- Use URL-based versioning.
- Do not introduce breaking changes into an existing API version.
- Add optional fields when backward-compatible changes are needed.
- Introduce a new API version for breaking changes.
- Document deprecated endpoints and provide a migration period.
- Do not remove an endpoint without reviewing its impact on web and mobile clients.

4. HTTP Methods

Method| Purpose
GET| Retrieve information
POST| Create a resource or perform an action
PUT| Replace an existing resource
PATCH| Partially update a resource
DELETE| Delete or deactivate a resource

Use the correct HTTP method for each operation.

5. Authentication and Authorization

VitaFixa will use Supabase Auth for user authentication.

The frontend obtains an access token after successful authentication and sends it to the backend.

Authentication header

"Authorization: Bearer <access_token>"

Rules

- Public endpoints do not require authentication.
- Protected endpoints require a valid access token.
- The backend must validate the token.
- The backend must identify the authenticated user from the validated token.
- Users may access only resources they are authorized to access.
- Never trust a user ID supplied by the frontend as proof of ownership.
- Admin-only operations require additional role-based authorization.
- Service-role keys and private secrets must never be exposed to frontend applications.

Authorization levels

Level| Description
Public| Accessible without login
Authenticated| Accessible to logged-in users
Owner| User can access their own resources
Admin| Restricted administrative access

6. Standard Response Format

API responses should use a consistent JSON structure.

Successful response

Example:

{
  "success": true,
  "data": {
    "id": "resource-id",
    "name": "Example"
  },
  "meta": null
}

Collection response

{
  "success": true,
  "data": [
    {
      "id": "item-1",
      "name": "Example Item"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

Error response

{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted information is invalid.",
    "details": [
      {
        "field": "name",
        "message": "Name is required."
      }
    ]
  }
}

Response rules

- Do not expose stack traces or internal system details.
- Do not expose database credentials or sensitive information.
- Use stable error codes.
- Keep messages understandable.
- Use "details" when field-level validation information is useful.
- Do not return unnecessary personal information.

7. HTTP Status Codes

Status| Meaning| Example
200| OK| Data retrieved or updated
201| Created| New resource created
202| Accepted| Background task accepted
204| No Content| Resource deleted successfully
400| Bad Request| Invalid request structure
401| Unauthorized| Missing or invalid authentication
403| Forbidden| User lacks permission
404| Not Found| Resource does not exist
409| Conflict| Duplicate or conflicting operation
422| Unprocessable Entity| Valid format but invalid business data
429| Too Many Requests| Rate limit exceeded
500| Internal Server Error| Unexpected backend failure
503| Service Unavailable| Temporary service outage

The backend must use the most appropriate status code.

8. API Endpoint Groups

The following endpoint groups define the initial API scope.

They are proposed contracts, not a statement that all endpoints already exist.

8.1 Health and System

Method| Endpoint| Access| Purpose
GET| "/health"| Public| Basic service health
GET| "/health/ready"| Internal/authorized| Check service readiness
GET| "/health/live"| Internal/authorized| Check whether the application is running

Health endpoints must not expose secrets, private configuration, or detailed infrastructure information.

8.2 User Profile

Base path: "/users"

Method| Endpoint| Access| Purpose
GET| "/users/me"| Authenticated| Retrieve current user's profile
PATCH| "/users/me"| Authenticated| Update current user's profile
DELETE| "/users/me"| Authenticated| Request account deletion

Example profile update:

{
  "displayName": "Alex",
  "dateOfBirth": "2000-05-10",
  "heightCm": 175,
  "weightKg": 75
}

Rules:

- Validate age and measurement ranges.
- Use consistent measurement units.
- Do not allow users to update another user's profile.
- Account deletion must follow the defined deletion and retention policy.
- Do not treat profile weight as a replacement for historical weight records.

8.3 User Goals and Preferences

Base path: "/users/me"

Method| Endpoint| Access| Purpose
GET| "/users/me/goals"| Authenticated| Retrieve user goals
PUT| "/users/me/goals"| Authenticated| Create or replace goal settings
GET| "/users/me/preferences"| Authenticated| Retrieve preferences
PATCH| "/users/me/preferences"| Authenticated| Update preferences
GET| "/users/me/allergies"| Authenticated| Retrieve allergies
PUT| "/users/me/allergies"| Authenticated| Update allergy information

Example goal:

{
  "primaryGoal": "weight_loss",
  "targetWeightKg": 70,
  "activityLevel": "moderately_active"
}

Goal values must be validated against supported options.

8.4 Food Database

Base path: "/foods"

Method| Endpoint| Access| Purpose
GET| "/foods"| Public or authenticated| Search and list foods
GET| "/foods/:foodId"| Public or authenticated| Retrieve food details
GET| "/foods/:foodId/portions"| Public or authenticated| Retrieve available portions
GET| "/users/me/favorite-foods"| Authenticated| Retrieve favorite foods
POST| "/users/me/favorite-foods/:foodId"| Authenticated| Add a favorite
DELETE| "/users/me/favorite-foods/:foodId"| Authenticated| Remove a favorite

Example food search:

"GET /foods?search=chicken&page=1&limit=20"

Example food response:

{
  "success": true,
  "data": [
    {
      "id": "food-001",
      "name": "Chicken Breast",
      "category": "protein",
      "servingSize": 100,
      "servingUnit": "g",
      "nutritionPer100g": {
        "caloriesKcal": 165,
        "proteinG": 31,
        "carbohydratesG": 0,
        "fatG": 3.6
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}

Rules:

- Food nutrition values must have a traceable source where possible.
- Clearly distinguish raw, cooked, and prepared food entries.
- Never assume different foods have identical nutritional values.
- Validate portion units and conversions.
- Food search must support future localization and regional foods.

8.5 Meal Plans

Base path: "/meal-plans"

Method| Endpoint| Access| Purpose
POST| "/meal-plans"| Authenticated| Create a meal plan
GET| "/meal-plans"| Authenticated| List user's meal plans
GET| "/meal-plans/:planId"| Owner| Retrieve a meal plan
PATCH| "/meal-plans/:planId"| Owner| Update a meal plan
DELETE| "/meal-plans/:planId"| Owner| Delete a meal plan
POST| "/meal-plans/:planId/meals"| Owner| Add a meal
PATCH| "/meal-plans/:planId/meals/:mealId"| Owner| Update a meal
DELETE| "/meal-plans/:planId/meals/:mealId"| Owner| Remove a meal
POST| "/meal-plans/:planId/entries"| Owner| Add food to a meal
PATCH| "/meal-plans/:planId/entries/:entryId"| Owner| Update a food entry
DELETE| "/meal-plans/:planId/entries/:entryId"| Owner| Remove a food entry

Example meal plan creation:

{
  "name": "My Weekly Plan",
  "description": "A balanced meal plan",
  "startDate": "2026-12-01",
  "endDate": "2026-12-07"
}

Example meal creation:

{
  "name": "Breakfast",
  "scheduledTime": "08:00",
  "dayOfWeek": 1
}

Example food entry:

{
  "foodId": "food-001",
  "portionId": "portion-001",
  "quantity": 2
}

Rules:

- Users can manage only their own plans.
- Meal times must use a clearly defined time format.
- Quantities must be positive.
- Nutrition totals must be calculated or verified by the backend.
- Updating a plan must not silently modify unrelated historical food logs.
- Plan changes must be handled consistently with reminder scheduling.

8.6 Food Tracking and Daily Nutrition

Base path: "/food-logs"

Method| Endpoint| Access| Purpose
POST| "/food-logs"| Authenticated| Record consumed food
GET| "/food-logs"| Authenticated| Retrieve food logs
GET| "/food-logs/:logId"| Owner| Retrieve a specific log
PATCH| "/food-logs/:logId"| Owner| Update a food log
DELETE| "/food-logs/:logId"| Owner| Delete a food log
GET| "/nutrition/daily-summary"| Authenticated| Retrieve daily nutrition summary

Example food log:

{
  "foodId": "food-001",
  "quantity": 1,
  "portionId": "portion-001",
  "consumedAt": "2026-12-01T08:30:00+05:00",
  "mealType": "breakfast"
}

Daily summary request:

"GET /nutrition/daily-summary?date=2026-12-01"

Example summary:

{
  "success": true,
  "data": {
    "date": "2026-12-01",
    "consumed": {
      "caloriesKcal": 1250,
      "proteinG": 75,
      "carbohydratesG": 140,
      "fatG": 35
    },
    "targets": {
      "caloriesKcal": 2000,
      "proteinG": 120,
      "carbohydratesG": 220,
      "fatG": 65
    }
  }
}

Rules:

- Food logs represent actual consumption, not planned meals.
- Preserve historical nutrition records when food database information changes.
- Use a consistent timezone strategy for daily summaries.
- Do not assume a user consumed a meal simply because it was scheduled.
- Clearly distinguish estimated nutrition from verified values.

8.7 Workout and Exercise Management

Base path: "/workouts"

Method| Endpoint| Access| Purpose
GET| "/exercises"| Public or authenticated| List exercises
GET| "/exercises/:exerciseId"| Public or authenticated| Retrieve exercise details
POST| "/workout-plans"| Authenticated| Create workout plan
GET| "/workout-plans"| Authenticated| List workout plans
GET| "/workout-plans/:planId"| Owner| Retrieve workout plan
PATCH| "/workout-plans/:planId"| Owner| Update workout plan
DELETE| "/workout-plans/:planId"| Owner| Delete workout plan
POST| "/workout-sessions"| Authenticated| Record workout session
GET| "/workout-sessions"| Authenticated| Retrieve workout history
GET| "/workout-sessions/:sessionId"| Owner| Retrieve session details
PATCH| "/workout-sessions/:sessionId"| Owner| Update session

Example workout plan:

{
  "name": "Beginner Strength Plan",
  "daysPerWeek": 3,
  "description": "A beginner-friendly workout plan"
}

Example workout session:

{
  "workoutPlanId": "plan-001",
  "startedAt": "2026-12-01T17:00:00+05:00",
  "completedAt": "2026-12-01T18:00:00+05:00",
  "status": "completed"
}

Rules:

- Validate exercise references.
- Validate sets, repetitions, duration, and other exercise-specific values.
- Users can access only their own workout records.
- Historical workout sessions should remain available when a plan is edited or deleted.

8.8 Notifications and Reminders

Base path: "/notifications"

Method| Endpoint| Access| Purpose
GET| "/notifications"| Authenticated| Retrieve notifications
PATCH| "/notifications/:notificationId/read"| Owner| Mark notification as read
GET| "/reminders"| Authenticated| Retrieve reminders
POST| "/reminders"| Authenticated| Create reminder
PATCH| "/reminders/:reminderId"| Owner| Update reminder
DELETE| "/reminders/:reminderId"| Owner| Delete reminder
GET| "/notification-preferences"| Authenticated| Retrieve notification settings
PATCH| "/notification-preferences"| Authenticated| Update notification settings

Example reminder:

{
  "title": "Breakfast Time",
  "type": "meal",
  "scheduledTime": "08:00",
  "repeatDays": [1, 2, 3, 4, 5, 6, 7],
  "enabled": true
}

Rules:

- Respect the user's timezone and notification preferences.
- Support quiet hours.
- Avoid duplicate reminder delivery.
- Do not guarantee delivery when a device is offline or a push service is unavailable.
- Keep reminder scheduling separate from notification delivery.
- Store delivery status where required.

8.9 Progress Tracking

Base path: "/progress"

Method| Endpoint| Access| Purpose
POST| "/progress/weight"| Authenticated| Record weight
GET| "/progress/weight"| Authenticated| Retrieve weight history
PATCH| "/progress/weight/:recordId"| Owner| Update weight record
DELETE| "/progress/weight/:recordId"| Owner| Delete weight record
GET| "/progress/summary"| Authenticated| Retrieve progress summary
GET| "/progress/reports/weekly"| Authenticated| Retrieve weekly report

Example weight record:

{
  "weightKg": 74.5,
  "recordedAt": "2026-12-01T09:00:00+05:00"
}

Rules:

- Store measurement units consistently.
- Validate reasonable measurement boundaries.
- Preserve historical records unless the user requests deletion.
- Progress summaries must be based on actual stored records.
- Avoid presenting estimates as confirmed medical measurements.

8.10 Research and Educational Content

Base path: "/research"

Method| Endpoint| Access| Purpose
GET| "/research/articles"| Public| List educational articles
GET| "/research/articles/:articleId"| Public| Retrieve article
GET| "/research/categories"| Public| List research categories
GET| "/research/sources"| Public| List information sources

Research content must include appropriate source information, publication details where available, and links to original material.

Administrative content creation and editing endpoints must be protected.

8.11 AI Features — Future Phase

Base path: "/ai"

Method| Endpoint| Access| Purpose
POST| "/ai/meal-suggestions"| Authenticated| Request meal suggestions
POST| "/ai/plan-assistance"| Authenticated| Request plan assistance
POST| "/ai/food-recognition"| Authenticated| Request food image analysis

These endpoints are future capabilities and are not required for the initial MVP.

Rules:

- AI output must be validated before being used.
- AI must not directly modify user data without explicit confirmation.
- Users must be able to create and manage plans manually.
- AI service failures must not prevent normal meal planning or food tracking.
- Avoid presenting AI-generated nutrition estimates as exact measurements.
- Apply rate limits and appropriate cost controls.
- Do not send unnecessary personal data to external AI providers.

9. Pagination

Collection endpoints should support pagination.

Example:

"GET /foods?page=1&limit=20"

Standard parameters:

Parameter| Description
"page"| Page number, starting at 1
"limit"| Number of records per page
"search"| Search query where supported
"sortBy"| Supported sorting field
"sortOrder"| "asc" or "desc"

Rules:

- Apply a reasonable maximum page size.
- Validate all pagination parameters.
- Use stable sorting to avoid inconsistent results.
- Consider cursor pagination for large or frequently changing datasets.

10. Filtering and Sorting

Endpoints should expose only relevant and supported filters.

Examples:

"GET /foods?category=protein"

"GET /food-logs?from=2026-12-01&to=2026-12-07"

"GET /workout-sessions?status=completed"

Rules:

- Validate filter values.
- Do not allow arbitrary database field sorting.
- Apply authorization before returning filtered records.
- Avoid exposing records belonging to other users.

11. Date, Time, and Measurement Standards

Date and time

- Use ISO 8601 for timestamps.
- Store event timestamps in UTC where appropriate.
- Preserve user timezone information for scheduling and local-day calculations.
- Use date-only values for calendar dates when a time is not relevant.
- Do not assume every user is in the same timezone.

Example timestamp:

"2026-12-01T08:30:00+05:00"

Measurement units

Use consistent units in API contracts:

Measurement| Standard unit
Weight| kg
Height| cm
Food quantity| g or ml, where applicable
Energy| kcal
Protein| g
Carbohydrates| g
Fat| g
Duration| seconds or minutes, as explicitly defined

Conversion logic must be centralized and tested.

12. Validation Rules

All incoming requests must be validated by the backend.

Examples:

- Required fields cannot be empty.
- IDs must have valid formats.
- Numeric values must be within defined limits.
- Dates must be valid.
- End dates cannot be earlier than start dates where the business rule requires it.
- Quantities must be positive.
- Enum values must belong to supported options.
- Text fields must have maximum lengths.
- Uploaded files must be checked for type and size.
- Users must not submit another user's resource ID to bypass ownership checks.

Validation rules should be defined close to the relevant application use case and documented in the API contract.

13. Idempotency and Duplicate Requests

Some operations may be repeated because of network failures, retries, or accidental double taps.

For operations where duplicate execution could cause problems, support idempotency.

Examples include:

- Creating food logs.
- Recording workout sessions.
- Creating payment-related operations in a future phase.
- Triggering expensive AI requests.

An idempotency key may be supplied through:

"Idempotency-Key: unique-request-key"

Rules:

- Define which endpoints support idempotency.
- Store and validate keys safely.
- Repeated requests with the same key must not create duplicate effects.
- Define key expiration and conflict behavior.
- Do not apply idempotency blindly to every endpoint.

14. Rate Limiting

Rate limits must protect the backend from abuse and excessive resource consumption.

Apply appropriate limits to:

- Authentication-related operations.
- Food searches.
- AI endpoints.
- File uploads.
- Other resource-intensive operations.

Rules:

- Rate limits should consider authenticated user identity and IP where appropriate.
- Return HTTP "429" when a limit is exceeded.
- Provide a retry indication where practical.
- Do not expose internal rate-limiting implementation details.
- Configure stricter limits for expensive AI operations.

15. File Uploads

Future image-based features may require image uploads.

Rules:

- Use approved upload endpoints or signed upload mechanisms.
- Validate file type and size.
- Do not trust the file extension alone.
- Restrict access to private user files.
- Avoid storing sensitive files in public buckets.
- Use secure storage policies.
- Do not accept executable files for image-recognition features.

16. Security Requirements

Every API endpoint must follow these security rules:

1. Validate authentication tokens.
2. Enforce resource ownership.
3. Apply role-based access control where needed.
4. Validate all incoming data.
5. Use HTTPS in deployed environments.
6. Avoid exposing sensitive personal information.
7. Keep secrets on the server.
8. Apply rate limiting.
9. Use safe database queries.
10. Log security-relevant events without logging pa

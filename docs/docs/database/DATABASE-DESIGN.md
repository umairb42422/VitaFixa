VITAFIXA

Database Design and Entity Relationship Diagram (ERD)

Document Version: 1.0
Status: Initial Database Design Baseline
Database: PostgreSQL
ORM: Prisma
Managed Database Platform: Supabase

Related Documents:

- Technical Architecture
- Product Requirements Document (PRD)
- High-Level Design (HLD)
- Low-Level Design (LLD)

---

1. Introduction

1.1 Purpose

This document defines the initial database design for VitaFixa.

It describes:

- Main database entities.
- Relationships between entities.
- Primary and foreign keys.
- Data ownership.
- Data integrity rules.
- Indexing strategy.
- Database security.
- Historical data management.
- Migration and backup requirements.

The database must support the current product requirements while allowing future expansion.

1.2 Database Design Objectives

The database must provide:

1. Data consistency.
2. Data integrity.
3. Secure access.
4. Efficient queries.
5. Reliable historical records.
6. Clear entity relationships.
7. Support for future features.
8. Maintainable schema changes.

1.3 Design Approach

VitaFixa will use PostgreSQL with a relational database design.

The initial design will follow:

- Appropriate normalization.
- Explicit primary and foreign keys.
- Referential integrity.
- Appropriate indexes.
- Transactions for related operations.
- Version-controlled database migrations.

The final physical schema may be refined during implementation, but changes must be documented.

---

2. Database Ownership

Each business module owns its relevant data.

Module| Main data
Identity| Authentication identity reference
User Profile| Profiles, goals and preferences
Food Database| Foods, portions and nutritional information
Nutrition| Meal plans, meals and food entries
Workout| Exercises, workout plans and sessions
Notifications| Preferences, reminders and delivery records
Progress| Weight records and progress summaries
AI Assistant| AI request metadata and usage records where needed
Research Centre| Articles and source references

Modules must not directly modify another module's internal data.

Cross-module operations must use approved application interfaces.

---

3. Entity Overview

The initial database will contain the following major entities.

3.1 Identity and Profile

- UserProfile
- FitnessGoal
- FoodPreference
- UserAllergy

3.2 Food Database

- Food
- FoodPortion
- FoodNutrition
- FoodSource
- FavoriteFood

3.3 Nutrition

- MealPlan
- Meal
- MealEntry
- FoodLog

3.4 Workout

- Exercise
- WorkoutPlan
- WorkoutPlanExercise
- WorkoutSession
- WorkoutExerciseRecord

3.5 Notifications

- NotificationPreference
- ScheduledReminder
- NotificationDelivery

3.6 Progress

- WeightRecord
- ProgressGoal

3.7 Research Centre

- ResearchArticle
- ResearchSource

Additional entities may be introduced when approved requirements need them.

---

4. Entity Relationship Diagram

The following diagram describes the initial logical database relationships.

erDiagram
    USER_PROFILE ||--o{ FITNESS_GOAL : has
    USER_PROFILE ||--o{ FOOD_PREFERENCE : selects
    USER_PROFILE ||--o{ USER_ALLERGY : records

    FOOD ||--o{ FOOD_PORTION : has
    FOOD ||--o{ FOOD_NUTRITION : contains
    FOOD_SOURCE ||--o{ FOOD : supports

    USER_PROFILE ||--o{ FAVORITE_FOOD : saves
    FOOD ||--o{ FAVORITE_FOOD : selected

    USER_PROFILE ||--o{ MEAL_PLAN : creates
    MEAL_PLAN ||--o{ MEAL : contains
    MEAL ||--o{ MEAL_ENTRY : contains
    FOOD ||--o{ MEAL_ENTRY : references

    USER_PROFILE ||--o{ FOOD_LOG : records
    FOOD ||--o{ FOOD_LOG : consumed

    USER_PROFILE ||--o{ WORKOUT_PLAN : creates
    WORKOUT_PLAN ||--o{ WORKOUT_PLAN_EXERCISE : contains
    EXERCISE ||--o{ WORKOUT_PLAN_EXERCISE : included

    USER_PROFILE ||--o{ WORKOUT_SESSION : performs
    WORKOUT_PLAN ||--o{ WORKOUT_SESSION : schedules
    WORKOUT_SESSION ||--o{ WORKOUT_EXERCISE_RECORD : contains
    EXERCISE ||--o{ WORKOUT_EXERCISE_RECORD : performed

    USER_PROFILE ||--o| NOTIFICATION_PREFERENCE : configures
    USER_PROFILE ||--o{ SCHEDULED_REMINDER : receives
    SCHEDULED_REMINDER ||--o{ NOTIFICATION_DELIVERY : generates

    USER_PROFILE ||--o{ WEIGHT_RECORD : records
    USER_PROFILE ||--o{ PROGRESS_GOAL : tracks

    RESEARCH_SOURCE ||--o{ RESEARCH_ARTICLE : supports

This is a logical ERD. Exact physical tables, column types and optional relationships will be finalized during implementation.

---

5. Detailed Entity Design

5.1 UserProfile

Purpose: Store user profile information associated with an authenticated account.

Field| Description
id| Primary key
authUserId| Reference to authenticated Supabase user
dateOfBirth| Date of birth, if required
heightValue| Height measurement
heightUnit| Height measurement unit
activityLevel| Selected activity level
createdAt| Creation timestamp
updatedAt| Last update timestamp

Rules:

- authUserId must be unique.
- A profile must belong to an authenticated identity.
- Date and measurement values must be validated.
- Sensitive information must be protected.
- Weight history must be stored separately.

The application must not duplicate password storage in this table.

5.2 FitnessGoal

Purpose: Store a user's fitness and nutrition goals.

Field| Description
id| Primary key
userId| Profile reference
goalType| Goal category
targetValue| Target value where applicable
targetUnit| Target measurement unit
status| Active, completed or archived
createdAt| Creation timestamp

A user may have multiple historical goals.

5.3 FoodPreference

Purpose: Store food preferences.

Field| Description
id| Primary key
userId| Profile reference
preferenceType| Preference category
value| Preference value

5.4 UserAllergy

Purpose: Record user-reported food allergies.

Field| Description
id| Primary key
userId| Profile reference
allergenName| Allergen name
notes| Optional additional information
createdAt| Creation timestamp

Allergy information must be handled carefully and must be considered by relevant meal suggestion features.

---

6. Food Database Design

6.1 Food

Purpose: Store food information.

Field| Description
id| Primary key
name| Food name
description| Optional description
category| Food category
sourceId| Food source reference
createdByUserId| Creator for custom food, if applicable
isVerified| Verification status
createdAt| Creation timestamp
updatedAt| Last update timestamp

Examples:

- Roti
- Chapati
- Rice
- Daal
- Eggs
- Chicken
- Milk
- Yogurt

6.2 FoodPortion

Purpose: Define selectable food portions.

Field| Description
id| Primary key
foodId| Food reference
portionName| Display name
quantity| Portion quantity
unit| Measurement unit
gramEquivalent| Gram equivalent where known

Examples:

- 1 piece.
- 1 cup.
- 100 grams.
- 1 serving.

Portions must use consistent measurement conventions.

6.3 FoodNutrition

Purpose: Store nutritional values.

Field| Description
id| Primary key
foodId| Food reference
referenceQuantity| Quantity represented
referenceUnit| Measurement unit
calories| Energy value
protein| Protein quantity
carbohydrates| Carbohydrate quantity
fat| Fat quantity
fiber| Fiber quantity, if available
createdAt| Creation timestamp

Nutritional values must have an explicit reference quantity and unit.

Missing nutritional information must not be silently treated as zero.

6.4 FoodSource

Purpose: Track the origin of food information.

Field| Description
id| Primary key
sourceName| Source name
sourceReference| External reference, if available
sourceType| Database, official source or user entry
accessedAt| Retrieval date where applicable

Food data must be traceable where possible.

6.5 FavoriteFood

Purpose: Allow users to save frequently used foods.

Field| Description
id| Primary key
userId| Profile reference
foodId| Food reference
createdAt| Date saved

A user should not have duplicate favorite entries for the same food.

---

7. Nutrition Database Design

7.1 MealPlan

Purpose: Store user-created diet plans.

Field| Description
id| Primary key
userId| Profile reference
name| Meal plan name
description| Optional description
startDate| Plan start date
endDate| Optional end date
status| Active, inactive or archived
createdAt| Creation timestamp
updatedAt| Last update timestamp

7.2 Meal

Purpose: Represent a meal within a plan.

Field| Description
id| Primary key
mealPlanId| Meal plan reference
name| Meal name
mealType| Breakfast, lunch, dinner or snack
scheduledTime| Planned meal time
createdAt| Creation timestamp

7.3 MealEntry

Purpose: Store foods assigned to planned meals.

Field| Description
id| Primary key
mealId| Meal reference
foodId| Food reference
portionId| Selected portion
quantity| Number of portions
createdAt| Creation timestamp

7.4 FoodLog

Purpose: Store actual food consumption.

Field| Description
id| Primary key
userId| Profile reference
foodId| Food reference
portionId| Selected portion, if applicable
quantity| Consumed quantity
consumedAt| Consumption timestamp
notes| Optional notes
createdAt| Record creation timestamp

Important rules:

- Planned meals and actual consumption must be separate.
- A user must be able to record food that was not in a meal plan.
- Historical logs must preserve the nutritional values used at the time of recording, or reference an immutable nutritional snapshot.
- Corrections must not silently alter unrelated historical records.

---

8. Workout Database Design

8.1 Exercise

Purpose: Store exercise library information.

Field| Description
id| Primary key
name| Exercise name
description| Exercise instructions
category| Exercise category
difficulty| Difficulty level
createdAt| Creation timestamp

8.2 WorkoutPlan

Purpose: Store user-created workout plans.

Field| Description
id| Primary key
userId| Profile reference
name| Plan name
description| Optional description
createdAt| Creation timestamp
updatedAt| Last update timestamp

8.3 WorkoutPlanExercise

Purpose: Connect exercises to workout plans.

Field| Description
id| Primary key
workoutPlanId| Workout plan reference
exerciseId| Exercise reference
sets| Planned sets
repetitions| Planned repetitions
restSeconds| Rest period
sequence| Exercise order

8.4 WorkoutSession

Purpose: Record scheduled or completed workout sessions.

Field| Description
id| Primary key
userId| Profile reference
workoutPlanId| Optional plan reference
scheduledAt| Scheduled date and time
completedAt| Completion timestamp
status| Planned, completed, skipped or cancelled

8.5 WorkoutExerciseRecord

Purpose: Record actual exercise performance.

Field| Description
id| Primary key
sessionId| Workout session reference
exerciseId| Exercise reference
setsCompleted| Completed sets
repetitionsCompleted| Completed repetitions
weightValue| Weight used, if applicable
weightUnit| Weight measurement unit

Historical workout records must remain understandable even when a user later changes their workout plan.

---

9. Notification Database Design

9.1 NotificationPreference

Purpose: Store notification settings.

Field| Description
id| Primary key
userId| Profile reference
mealRemindersEnabled| Boolean
workoutRemindersEnabled| Boolean
quietHoursStart| Quiet-hours start
quietHoursEnd| Quiet-hours end
timeZone| User time zone
updatedAt| Last update timestamp

Each user should have one primary notification preference record.

9.2 ScheduledReminder

Purpose: Store scheduled reminder information.

Field| Description
id| Primary key
userId| Profile reference
reminderType| Meal or workout
relatedEntityId| Related meal or workout reference
scheduledAt| Scheduled timestamp
status| Pending, processed, cancelled or failed
createdAt| Creation timestamp

The related entity reference must be validated by the application according to reminder type.

9.3 NotificationDelivery

Purpose: Track delivery attempts.

Field| Description
id| Primary key
reminderId| Reminder reference
providerReference| External provider reference, if available
status| Attempted, sent, failed or unknown
attemptedAt| Attempt timestamp
errorCode| Optional error information

A provider accepting a notification request does not necessarily prove that the user received or viewed it.

---

10. Progress Database Design

10.1 WeightRecord

Purpose: Maintain historical weight measurements.

Field| Description
id| Primary key
userId| Profile reference
weightValue| Recorded weight
weightUnit| Measurement unit
recordedAt| Measurement date and time
createdAt| Record creation timestamp

Weight records must be preserved as historical entries.

10.2 ProgressGoal

Purpose: Track progress towards a user-defined goal.

Field| Description
id| Primary key
userId| Profile reference
goalType| Goal category
targetValue| Target value
targetUnit| Measurement unit
startDate| Goal start
targetDate| Optional target date
status| Active, completed or archived

Progress summaries should be calculated from appropriate historical data.

---

11. Research Centre Database Design

11.1 ResearchSource

Purpose: Store source information.

Field| Description
id| Primary key
name| Organization or publication name
sourceUrl| Source link
sourceType| Official, academic or other
createdAt| Creation timestamp

11.2 ResearchArticle

Purpose: Store educational content.

Field| Description
id| Primary key
title| Article title
summary| Article summary
content| Educational content
sourceId| Research source reference
publicationDate| Original publication date
lastReviewedAt| Last review date
status| Draft, published or archived

Published content must have traceable sources.

---

12. Primary Keys and Relationships

All major entities must have stable primary keys.

Recommended approach:

- Use UUID identifiers for application entities.
- Use foreign keys to enforce relationships.
- Use unique constraints where duplicate records are not allowed.
- Use appropriate deletion behavior.
- Avoid unnecessary cascading deletion of historical records.

Important relationships:

- One user can have multiple meal plans.
- One meal plan can contain multiple meals.
- One meal can contain multiple planned food entries.
- One food can have multiple portion definitions.
- One user can have multiple food logs.
- One user can have multiple workout plans.
- One workout plan can contain multiple exercises.
- One user can have multiple weight records.
- One reminder can have multiple delivery attempts.

---

13. Data Types and Measurement Standards

The database must use consistent units.

Examples:

Data| Recommended representation
Height| Numeric value plus unit, or normalized centimeters
Weight| Numeric value plus unit, or normalized kilograms
Food quantity| Numeric value plus unit
Calories| Numeric energy value with documented unit
Protein| Grams
Carbohydrates| Grams
Fat| Grams
Dates| PostgreSQL date
Timestamps| Time-zone-aware timestamps

Use appropriate decimal precision for nutritional values and measurements.

Avoid floating-point arithmetic for calculations that require predictable decimal precision.

Store timestamps consistently and retain each user's time-zone preference for local schedules.

---

14. Database Integrity Rules

The following rules must be enforced:

1. Required fields must not accept null values.
2. Foreign keys must reference valid records.
3. User-owned data must have a valid owner.
4. Numeric quantities must follow appropriate validation rules.
5. Food portions must belong to valid food records.
6. Meal entries must reference valid meals and foods.
7. Workout records must reference valid sessions.
8. Reminder records must follow supported reminder types.
9. Duplicate favorites must be prevented.
10. Historical records must be protected against accidental deletion.

Database constraints should be supplemented by application-level business validation.

---

15. Indexing Strategy

Indexes should support frequently used queries.

Initial candidates:

Table| Candidate index
UserProfile| authUserId unique
Food| name
Food| category
MealPlan| userId
Meal| mealPlanId
MealEntry| mealId
FoodLog| userId, consumedAt
WorkoutPlan| userId
WorkoutSession| userId, scheduledAt
ScheduledReminder| status, scheduledAt
WeightRecord| userId, recordedAt
ResearchArticle| status, publicationDate

Index selection must be validated using actual query patterns and database query plans.

Avoid creating indexes without considering their write and storage costs.

---

16. Security and Privacy

Database security requirements:

- Enable appropriate Row Level Security policies where applicable.
- Restrict access to user-owned records.
- Keep privileged service credentials server-side.
- Use least-privilege database access.
- Validate authorization in the backend.
- Avoid exposing private records through public endpoints.
- Protect sensitive personal information.
- Use secure backup and recovery procedures.

RLS policies and backend authorization must work together.

RLS must not be treated as a replacement for application authorization.

---

17. Historical Data and Deletion Strategy

VitaFixa must preserve important historical information.

Examples:

- Previous weight records.
- Completed workout sessions.
- Food consumption history.
- Previous meal plan records.

Updating a current plan must not silently rewrite historical activity.

For food logs and completed workouts, the system should preserve relevant historical values or snapshots when referenced source data may change.

Account deletion must follow the approved privacy and retention policy.

The implementation must define which records are deleted, anonymized or retained for legitimate reasons.

---

18. Database Migration Strategy

All schema changes must be version-controlled.

Requirements:

1. Use Prisma migrations.
2. Never manually change production schema without an approved process.
3. Test migrations in development.
4. Validate migrations in staging.
5. Plan production migration and rollback or recovery procedures.
6. Review migrations that may affect large tables.
7. Keep schema changes documented.

Each migration must have a clear purpose.

---

19. Backup and Recovery

Production data must be protected.

Requirements:

- Configure database backups.
- Document recovery procedures.
- Define backup retention.
- Restrict backup access.
- Test restoration periodically.
- Document recovery objectives before production launch.

The exact backup frequency and recovery targets will be finalized before production deployment.

---

20. Future Database Expansion

The database must allow future features such as:

- Food image recognition.
- AI-generated meal suggestions.
- Additional micronutrients.
- Wearable integrations.
- Advanced analytics.
- Subscription management.
- Social and community features.
- Multi-language food descriptions.

Future entities must be introduced through reviewed migrations.

Do not add speculative tables without an approved requirement.

---

21. AI Coding Agent Rules

All AI coding agents must:

1. Read the approved database design before modifying schema.
2. Understand the affected module's data ownership.
3. Avoid creating duplicate entities.
4. Use Prisma migrations.
5. Preserve referential integrity.
6. Add appropriate constraints and indexes.
7. Update related documentation.
8. Add migration and repository tests where appropriate.
9. Never expose secrets.
10. Never make destructive production changes without explicit approval.

AI agents must report all database schema changes and their impact.

---

22. Definition of Done

A database change is complete when:

- The requirement is approved.
- Entity ownership is clear.
- Relationships are documented.
- Appropriate constraints exist.
- Migrations are created.
- Migrations have been tested.
- Authorization and RLS implications are reviewed.
- Relevant tests pass.
- Documentation is updated.
- Historical data behavior is considered.

---

Final Database Principle

VitaFixa's database must protect user information, maintain reliable history and support future growth.

Every entity must have a clear purpose, every relationship must be intentional and every schema change must be controll

VITAFIXA

Database Design and Entity Relationship Diagram (ERD)

Document Version: 1.0
Status: Initial Database Design Baseline
Reconciled with: ADR-002 and ADR-003 (2026-11-23)
Database: PostgreSQL
ORM: Prisma
Managed Database Platform: Supabase

Related Documents:

- Technical Architecture
- Product Requirements Document (PRD)
- High-Level Design (HLD)
- Low-Level Design (LLD)
- ADR-002: Authentication and Authorization
- ADR-003: Database Schema and Access

Where this document and ADR-003 differ, ADR-003 is the approved decision. ADR-003 holds the full physical schema (25 tables), constraints, delete rules and allowed values.

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
User Profile| Profiles, goals, preferences, allergies and workout availability
Food Database| Foods, portions and nutritional information
Nutrition| Meal plans, meals, meal entries, meal logs and food logs
Workout| Exercises, workout plans and sessions
Notifications| Preferences, reminder rules, scheduled reminder occurrences and delivery records
Progress| Weight records and progress summaries (progress goals are deferred)
AI Assistant| AI request metadata and usage records where needed
Research Centre| Articles and source references (deferred; no tables in the MVP schema)

Modules must not directly modify another module's internal data.

Cross-module operations must use approved application interfaces.

---

3. Entity Overview

The approved MVP schema (ADR-003) contains 25 tables, listed below. Entities marked deferred are not created in the MVP schema.

3.1 Identity and Profile

- UserProfile
- FitnessGoal
- FoodPreference
- UserAllergy
- WorkoutAvailability

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
- MealLog
- FoodLog

3.4 Workout

- Exercise
- WorkoutPlan
- WorkoutPlanExercise
- WorkoutSession
- WorkoutExerciseRecord

3.5 Notifications

- NotificationPreference
- Reminder (the reminder rule)
- ScheduledReminder (one occurrence of a reminder)
- NotificationDelivery

3.6 Progress

- WeightRecord
- ProgressGoal (deferred; not in the MVP schema)

3.7 Research Centre

- ResearchArticle (deferred; not in the MVP schema)
- ResearchSource (deferred; not in the MVP schema)

Additional entities may be introduced when approved requirements need them.

---

4. Entity Relationship Diagram

The following diagram describes the initial logical database relationships.

erDiagram
    USER_PROFILE ||--o{ FITNESS_GOAL : has
    USER_PROFILE ||--o{ FOOD_PREFERENCE : selects
    USER_PROFILE ||--o{ USER_ALLERGY : records
    USER_PROFILE ||--o{ WORKOUT_AVAILABILITY : sets

    FOOD ||--o{ FOOD_PORTION : has
    FOOD ||--|| FOOD_NUTRITION : has
    FOOD_NUTRITION ||--o{ FOOD_PORTION : fixes_unit
    FOOD_SOURCE ||--o{ FOOD : supports

    USER_PROFILE ||--o{ FAVORITE_FOOD : saves
    FOOD ||--o{ FAVORITE_FOOD : selected

    USER_PROFILE ||--o{ MEAL_PLAN : creates
    USER_PROFILE ||--o{ MEAL : owns
    MEAL_PLAN ||--o{ MEAL : contains
    MEAL ||--o{ MEAL_ENTRY : contains
    FOOD ||--o{ MEAL_ENTRY : references
    FOOD_PORTION ||--o{ MEAL_ENTRY : measures
    MEAL ||--o{ MEAL_LOG : logged_as

    USER_PROFILE ||--o{ FOOD_LOG : records
    FOOD ||--o{ FOOD_LOG : consumed
    FOOD_PORTION ||--o{ FOOD_LOG : measures
    MEAL_LOG ||--o{ FOOD_LOG : groups

    USER_PROFILE ||--o{ WORKOUT_PLAN : creates
    WORKOUT_PLAN ||--o{ WORKOUT_PLAN_EXERCISE : contains
    EXERCISE ||--o{ WORKOUT_PLAN_EXERCISE : included

    USER_PROFILE ||--o{ WORKOUT_SESSION : performs
    WORKOUT_PLAN ||--o{ WORKOUT_SESSION : schedules
    WORKOUT_SESSION ||--o{ WORKOUT_EXERCISE_RECORD : contains
    EXERCISE ||--o{ WORKOUT_EXERCISE_RECORD : performed

    USER_PROFILE ||--o| NOTIFICATION_PREFERENCE : configures
    USER_PROFILE ||--o{ REMINDER : owns
    MEAL ||--o{ REMINDER : linked_to
    WORKOUT_SESSION ||--o{ REMINDER : linked_to
    REMINDER ||--o{ SCHEDULED_REMINDER : generates
    SCHEDULED_REMINDER ||--o{ NOTIFICATION_DELIVERY : generates

    USER_PROFILE ||--o{ WEIGHT_RECORD : records
    USER_PROFILE ||--o{ PROGRESS_GOAL : tracks

    RESEARCH_SOURCE ||--o{ RESEARCH_ARTICLE : supports

This is a logical ERD. The approved physical schema, column types, constraints and delete rules are defined in ADR-003.

PROGRESS_GOAL, RESEARCH_SOURCE and RESEARCH_ARTICLE are deferred (ADR-003 section 2.1). They stay in the diagram as planned future entities and are not created in the MVP schema.
REMINDER is the reminder rule (including custom reminders). SCHEDULED_REMINDER is one dated occurrence generated from a rule. A reminder links to at most one meal or one workout session, and custom reminders have no link.

---

5. Detailed Entity Design

5.1 UserProfile

Purpose: Store user profile information associated with an authenticated account.

Field| Description
id| Primary key
authUserId| Supabase user id (the token "sub" claim); no foreign key into the Supabase auth schema
displayName| Optional display name
dateOfBirth| Date of birth, if required
heightCm| Height in centimeters, optional
activityLevel| Selected activity level (allowed values not yet decided)
timeZone| IANA time zone name, used for local schedules and reminders
createdAt| Creation timestamp
updatedAt| Last update timestamp

Rules:

- authUserId must be unique.
- heightCm must be greater than zero. Height is stored in centimeters only; the application converts other units.
- All other tables reference user_profiles.id (userId), never the Supabase user id. Only the server maps the verified token to the profile id (ADR-003 section 2.5.2).
- A profile is created on first authenticated use (ADR-002).
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

targetValue and targetUnit must be set together or both empty. goalType uses the allowed values of ADR-003 section 2.8 (weight_loss, weight_gain, weight_maintenance, muscle_gain, general_fitness). Calorie and nutrition targets are not stored; they are calculated on demand.

5.3 FoodPreference

Purpose: Store food preferences.

Field| Description
id| Primary key
userId| Profile reference
preferenceType| Preference category
value| Preference value

preferenceType is dietary_pattern, cuisine or disliked_food, validated against the allowed values of ADR-003 section 2.8. A user cannot have the same type and value twice.

5.4 UserAllergy

Purpose: Record user-reported food allergies.

Field| Description
id| Primary key
userId| Profile reference
allergenName| Standard allergen code (milk, eggs, peanuts, tree_nuts, soy, wheat, fish, shellfish, sesame) or other
notes| Additional information; required custom description when allergenName is other
createdAt| Creation timestamp

Allergy information must be handled carefully and must be considered by relevant meal suggestion features.

A standard allergen can be recorded once per user. Several entries of type other are allowed, each with its own description.

5.5 WorkoutAvailability

Purpose: Store the weekly time windows in which a user can work out (PRD FR-PRO-010).

Field| Description
id| Primary key
userId| Profile reference
dayOfWeek| ISO weekday, 1 (Monday) to 7 (Sunday)
startTime| Window start time
endTime| Window end time

Rules:

- startTime must be before endTime; a window cannot cross midnight.
- A user may have several windows on the same day.
- The same user, day and start time cannot be stored twice. Overlapping windows are rejected by the backend.

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

Rules:

- category uses the food category list in ADR-003 section 2.8.
- Catalogue foods have no createdByUserId. A custom food has createdByUserId set and can never be verified.
- A food is accessible to a user when it is shared or created by that user. Search, retrieval and every reference from a food log, meal entry or favorite apply this rule in the backend (ADR-003 section 2.5.1).

6.2 FoodPortion

Purpose: Define selectable food portions.

Field| Description
id| Primary key
foodId| Food reference
referenceUnit| g or ml; must equal the reference unit of the food's nutrition row
portionName| Display name
quantity| Portion quantity
unit| Measurement unit (g, ml, piece, slice, cup, tbsp, tsp, bowl or serving)
referenceAmount| Required size of this portion in the food's reference unit

Examples:

- 1 piece.
- 1 cup.
- 100 grams.
- 1 serving.

Portions must use consistent measurement conventions.

Rules (ADR-003 section 2.3.2):

- Every portion states its own size in grams or milliliters through referenceAmount. No conversion is shared between foods.
- The portion's referenceUnit must match the food's nutrition referenceUnit (a composite relationship). A 100 g portion cannot exist for a food whose nutrition is stated per ml.
- A portion measured directly in g or ml must use the food's reference unit and have referenceAmount equal to quantity.
- quantity and referenceAmount must be greater than zero. A portion name is unique per food.

6.3 FoodNutrition

Purpose: Store nutritional values.

Field| Description
id| Primary key
foodId| Food reference
referenceQuantity| Quantity represented
referenceUnit| g or ml
calories| Energy in kcal (required)
protein| Protein in grams, optional
carbohydrates| Carbohydrates in grams, optional
fat| Fat in grams, optional
fiber| Fiber in grams, optional
createdAt| Creation timestamp
updatedAt| Last update timestamp

Nutritional values must have an explicit reference quantity and unit.

Missing nutritional information must not be silently treated as zero.

Rules (ADR-003 section 2.3.4):

- Each food has exactly one nutrition row.
- referenceUnit must be g or ml (enforced by the database), and referenceQuantity must be greater than zero.
- Calories are required. Protein, carbohydrates, fat and fiber are optional, and NULL means unknown. Unknown is never stored as zero; a measured zero is stored as zero.
- Any nutrient that is present must be zero or greater.
- Daily totals sum only known values, and a total is marked incomplete when any contributing entry has an unknown value for that nutrient.
- This replaces the earlier assumption that protein, carbohydrates and fat are always present.

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

Deleting a meal plan through the API archives it, so previous plans are preserved (section 17). endDate, when set, must not be before startDate.

7.2 Meal

Purpose: Represent a meal within a plan.

Field| Description
id| Primary key
userId| Profile reference; the same owner as the meal plan
mealPlanId| Meal plan reference
name| Meal name
mealType| Breakfast, lunch, dinner or snack
scheduledTime| Planned meal time
daysOfWeek| ISO weekdays on which the meal repeats (1 Monday to 7 Sunday); default every day
createdAt| Creation timestamp

Rules:

- userId and mealPlanId together reference the meal plan, so the database guarantees that a meal belongs to its plan's owner.
- daysOfWeek must contain 1 to 7 distinct values between 1 and 7 (database function is_valid_weekday_set). A meal with all seven days is a daily meal.

7.3 MealEntry

Purpose: Store foods assigned to planned meals.

Field| Description
id| Primary key
mealId| Meal reference
foodId| Food reference
portionId| Selected portion (required)
quantity| Number of portions; must be greater than zero
createdAt| Creation timestamp

foodId and portionId together reference the food portion, so a portion always belongs to the selected food. The food must also be accessible to the user (section 6.1).

7.4 FoodLog

Purpose: Store actual food consumption.

Field| Description
id| Primary key
userId| Profile reference
foodId| Food reference
portionId| Selected portion (required)
quantity| Consumed quantity in portions; must be greater than zero
consumedAt| Consumption timestamp
mealType| Optional breakfast, lunch, dinner or snack
mealLogId| Optional meal log this entry belongs to
notes| Optional notes
foodNameSnapshot| Food name at logging time
portionNameSnapshot| Portion name at logging time
caloriesSnapshot| Calories for this entry at logging time (required)
proteinSnapshot| Protein at logging time, NULL if unknown
carbohydratesSnapshot| Carbohydrates at logging time, NULL if unknown
fatSnapshot| Fat at logging time, NULL if unknown
fiberSnapshot| Fiber at logging time, NULL if unknown
createdAt| Record creation timestamp
updatedAt| Last update timestamp

Important rules:

- Planned meals and actual consumption must be separate.
- A user must be able to record food that was not in a meal plan.
- Historical logs must preserve the nutritional values used at the time of recording, or reference an immutable nutritional snapshot.
- Corrections must not silently alter unrelated historical records.
- The snapshot fields freeze the food name, portion name and nutrient totals when the entry is logged. The backend recomputes them only when the user edits that log. A nutrient snapshot is NULL exactly when the nutrient was unknown at logging time.
- foodId and portionId together reference the food portion. The food must be accessible to the user (section 6.1).
- If a meal log is removed, mealLogId becomes empty and the food history is kept.
- The backend checks that mealLogId belongs to the same user and that mealType matches the meal's type.

7.5 MealLog

Purpose: Record whether a planned meal was completed or skipped on a given date.

Field| Description
id| Primary key
mealId| Planned meal reference
logDate| Date the meal was logged for
status| Completed or skipped
createdAt| Creation timestamp

Rules:

- There is one meal log per meal per date.
- Deleting a meal deletes its meal logs, but food logs linked to them are kept (mealLogId is cleared).
- The owner is derived through the meal.

---

8. Workout Database Design

8.1 Exercise

Purpose: Store exercise library information.

Field| Description
id| Primary key
name| Exercise name
description| Exercise instructions
category| Exercise category (strength, cardio, flexibility, mobility, balance, sports or other)
difficulty| beginner, intermediate or advanced
createdAt| Creation timestamp

Exercise names are unique. Exercises are a shared, read-only catalogue in the MVP.

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
repetitions| Planned repetitions per set
restSeconds| Rest period
sequence| Exercise order

sets and repetitions must be greater than zero, and sequence is unique within a plan.

8.4 WorkoutSession

Purpose: Record scheduled or completed workout sessions.

Field| Description
id| Primary key
userId| Profile reference
workoutPlanId| Optional plan reference; must belong to the same user
scheduledAt| Planned date and time, optional
startedAt| Actual start time, optional
completedAt| Completion timestamp, optional
status| Planned, completed, skipped or cancelled
createdAt| Creation timestamp
updatedAt| Last update timestamp

Rules (ADR-003 section 2.3.1):

- planned: scheduledAt required; startedAt and completedAt empty.
- completed: completedAt required and not before startedAt when startedAt is set; scheduledAt and startedAt optional. A workout recorded after the fact needs only completedAt.
- skipped or cancelled: scheduledAt required; startedAt and completedAt empty.
- scheduledAt (planned time) and startedAt (actual start) are different concepts and are both kept.
- userId and workoutPlanId together reference the plan, so a session cannot reference another user's plan.
- A workout plan cannot be deleted while sessions reference it. The backend clears workoutPlanId on its sessions and then deletes the plan in one transaction.
- Sessions are not deleted through the API; they are cancelled or skipped.

8.5 WorkoutExerciseRecord

Purpose: Record actual exercise performance.

Field| Description
id| Primary key
sessionId| Workout session reference
exerciseId| Exercise reference
setsCompleted| Completed sets
repetitionsCompleted| Completed repetitions per set
weightKg| Weight used in kilograms, if applicable

Historical workout records must remain understandable even when a user later changes their workout plan.

There is one aggregate row per exercise per session, and records exist only for completed sessions. Per-set tracking can be added later as a child table without changing this one.

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
updatedAt| Last update timestamp

Each user should have one primary notification preference record.

The time zone is stored on UserProfile (section 5.1), not here. mealRemindersEnabled and workoutRemindersEnabled default to false, and when no row exists the defaults (off) apply. Quiet hours are both set or both empty, must not be equal, and may cross midnight. The meal and workout switches never affect custom reminders.

9.2 Reminder

Purpose: Store a reminder rule: what to remind about, at what time of day, on which days and between which dates.

Field| Description
id| Primary key
userId| Profile reference (required)
reminderType| Meal, workout or custom
title| Reminder title
timeOfDay| Local time of day
repeatDays| ISO weekdays on which the reminder repeats
startDate| First date
endDate| Optional last date
enabled| Whether the reminder is active; default false
mealId| Optional linked meal (meal reminders only)
workoutSessionId| Optional linked workout session (workout reminders only)
createdAt| Creation timestamp
updatedAt| Last update timestamp

Rules (ADR-003 section 2.4):

- Reminders are disabled unless the user explicitly enables them.
- A custom reminder has no link. A meal or workout reminder may be linked or standalone.
- userId and mealId together reference the meal, and userId and workoutSessionId together reference the workout session, so a link always points to the same user's record. Deleting the meal or session deletes its reminders.
- A one-off reminder has startDate equal to endDate. A recurring reminder uses repeatDays (valid ISO weekday set) and an optional endDate.
- A linked reminder mirrors the schedule of its source (meal time, weekdays and plan dates; or the session's local time and date). The backend overwrites the mirrored fields in the same transaction as every source change. The database does not check that the copy equals the source, so a test covers it. Users can edit only the title and enabled flag of a linked reminder.

9.3 ScheduledReminder

Purpose: Store one dated occurrence of a reminder. A background job creates occurrences for a short rolling window ahead.

Field| Description
id| Primary key
reminderId| Reminder reference
scheduledAt| Exact scheduled moment
status| Pending, processed, cancelled, failed or suppressed
createdAt| Creation timestamp
updatedAt| Last update timestamp

Rules:

- There is no userId; the owner is derived from the reminder.
- (reminderId, scheduledAt) is unique, so duplicate occurrences are impossible.
- The occurrence time is the local date plus timeOfDay in the user's time zone, converted to an exact moment.
- An occurrence that falls inside quiet hours when it is due is marked suppressed and is never sent late.
- Processed, failed, suppressed and cancelled occurrences are history and are never altered or regenerated.
- No occurrences are created for a disabled reminder, for a user without a time zone, or for a meal or workout reminder whose master switch is off.

9.4 NotificationDelivery

Purpose: Track delivery attempts.

Field| Description
id| Primary key
scheduledReminderId| Scheduled reminder (occurrence) reference
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
weightKg| Recorded weight in kilograms; must be greater than zero
recordedAt| Measurement date and time
createdAt| Record creation timestamp

Weight records must be preserved as historical entries.

10.2 ProgressGoal

Status: Deferred. ProgressGoal is not part of the MVP schema (ADR-003 section 2.1). The MVP uses FitnessGoal (section 5.2) and weight records for progress.

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

Status: Deferred. ResearchSource and ResearchArticle are not part of the MVP schema (ADR-003 section 2.1). The design below is kept for the later release.

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
- One user can have multiple reminders, including custom reminders.
- One reminder can have multiple scheduled occurrences, and one occurrence can have multiple delivery attempts.
- One meal or workout session can have linked reminders.
- One meal can have multiple meal logs, one per date.
- One user can have multiple workout availability windows.
- One food has exactly one nutrition row and multiple portions.

Approved conventions (ADR-003 sections 2.2, 2.5 and 2.6):

- UUID primary keys named id; PostgreSQL tables and columns use snake_case and Prisma fields use camelCase.
- Ownership that must hold is enforced with composite foreign keys that include userId (meals, reminders, workout sessions) or foodId (portions).
- No foreign key from user_profiles to its data cascades; all are RESTRICT, so account deletion is a later feature that follows the retention policy.
- Cascades occur only inside a parent-child chain.
- Logged or planned foods cannot be deleted, and food logs survive the removal of a meal log.

---

13. Data Types and Measurement Standards

The database must use consistent units.

Examples:

Data| Recommended representation
Height| Centimeters (heightCm)
Weight| Kilograms (weightKg)
Food quantity| Quantity in portions, with a portion size in g or ml
Calories| Kilocalories (kcal)
Protein| Grams
Carbohydrates| Grams
Fat| Grams
Dates| PostgreSQL date
Timestamps| Time-zone-aware timestamps

Use appropriate decimal precision for nutritional values and measurements.

Avoid floating-point arithmetic for calculations that require predictable decimal precision.

Store timestamps consistently and retain each user's time-zone preference (UserProfile.timeZone, an IANA name) for local schedules.

Approved conventions (ADR-003 section 2.2): units are metric only and imperial input is converted by the application; exact decimals with fixed precision (weight and height 5,2; workout weight 6,2; grams and quantities 7,2; calories 8,2); times of day use the time type. Lifecycle values are PostgreSQL enums; other classification values are text validated against one documented code-level list (ADR-003 section 2.8).

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
11. Unknown nutrient values must be stored as NULL, never as zero.
12. Ownership that crosses tables must be enforced by composite foreign keys where the owner is known (meal to plan, reminder to meal or session, session to plan).
13. Rules the database cannot express (food access, overlapping availability windows, reminder mirroring) must be enforced by the backend and covered by automated tests.

Database constraints should be supplemented by application-level business validation.

---

15. Indexing Strategy

Indexes should support frequently used queries.

Initial candidates:

Table| Candidate index
UserProfile| authUserId unique
Food| name
Food| category
Food| createdByUserId
FitnessGoal| userId, status
MealPlan| userId, status
Meal| mealPlanId
MealEntry| mealId
FoodLog| userId, consumedAt; mealLogId
WorkoutPlan| userId
WorkoutSession| userId, scheduledAt; userId, completedAt; workoutPlanId
Reminder| userId; mealId; workoutSessionId
ScheduledReminder| status, scheduledAt (unique reminderId, scheduledAt)
NotificationDelivery| scheduledReminderId
WeightRecord| userId, recordedAt
ResearchArticle| status, publicationDate (deferred)

Unique constraints listed in ADR-003 section 2.3 also create indexes.

Index selection must be validated using actual query patterns and database query plans.

Avoid creating indexes without considering their write and storage costs.

---

16. Security and Privacy

Database security requirements:

- Enable Row Level Security on every table with no permissive policies (deny by default), and turn the Supabase data API off (ADR-002 and ADR-003 section 2.7).
- Restrict access to user-owned records.
- Keep privileged service credentials server-side.
- Use least-privilege database access: a runtime role (vitafixa_app) for the application and a separate migration role (vitafixa_migrator) used only to apply migrations (ADR-003 section 2.9).
- Validate authorization in the backend.
- Avoid exposing private records through public endpoints.
- Protect sensitive personal information.
- Use secure backup and recovery procedures.

The backend's runtime role bypasses RLS. RLS therefore blocks direct client access through the Supabase data API, and it does not protect against a faulty backend query. Backend ownership filters (the owner taken from the verified token in every query on user-owned data) are the enforcement, and they are covered by automated tests.

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

Until that policy exists, no foreign key from user_profiles to user data cascades (all RESTRICT), and API deletion of a meal plan archives it (ADR-003 section 2.6).

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

Additional rules (ADR-003 section 2.10):

- CHECK constraints, the partial unique index on allergies, the weekday function and RLS are written as reviewed SQL inside Prisma migrations.
- prisma migrate dev is used only against the development Supabase project; staging and production use prisma migrate deploy with the migration role.
- Changes are additive first, and destructive changes need explicit approval.
- Hand-written constraints are covered by tests that insert invalid data and expect rejection.

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

Every entity must have a clear purpose, every relationship must be intentional and every schema change must be controlled.

ADR-003: Database Schema, Reminder Architecture and Database Access

Project: VitaFixa
Status: Accepted (schema approved as the basis for implementation; implementation pending)
Decision Date: 2026-11-22
Decision Type: Data Architecture and Security
Related Documents: ADR-001, ADR-002, PRD.md, DATABASE-DESIGN.md, API-SPECIFICATION.md, LLD.md, HLD.md, SECURITY-DESIGN.md

---

1. Context

DATABASE-DESIGN.md (v1.0) is a logical design. It states that exact physical tables, column types and optional relationships are finalized during implementation, and it contains gaps and conflicts with the PRD and the API specification. ADR-001 section 7 left open the Prisma and Supabase connection configuration, the migration ownership and workflow, and the database security approach. ADR-002 decided the authentication and Row Level Security (RLS) approach.

This ADR records the approved physical schema for the MVP, the reminder architecture, ownership rules, database roles, migration strategy, and the resolutions of conflicts between the existing documents. It does not itself create any database object. Existing documents are not modified by this ADR; section 9 lists the updates they need.

2. Decisions

2.1 Scope

The MVP schema has 25 tables. These are deferred and must not be created without a new approved requirement:

- ProgressGoal (duplicates FitnessGoal).
- ResearchSource and ResearchArticle (not part of the MVP feature list).
- Nutrition targets storage, the calorie-formula inputs (for example sex) and any in-app notification inbox.
- Per-set workout records.

2.2 Conventions

- Identifiers: UUID primary keys named "id". Identifiers never change, so no update actions are defined on foreign keys.
- Naming: tables and columns use snake_case in PostgreSQL and camelCase fields in Prisma. Table names are plural.
- Timestamps use time-zone-aware timestamps. Dates use the date type. Times of day use the time type.
- Units are metric only: height in cm, weight in kg, nutrients in grams, energy in kcal. Imperial input is converted by the application. Unit columns exist only where the unit is part of the data (food portions, food reference units, goal target unit).
- Decimals are exact. Precision: weight and height 5 digits with 2 decimals (workout weight 6,2); grams and quantities 7,2; calories 8,2.
- A missing nutrient value means unknown, never zero.
- Lifecycle values the design lists are PostgreSQL enums. Other classification values are plain text validated against one documented code-level list (section 2.8).

2.2.1 Enums

Enum| Values
goal_status| active, completed, archived
meal_plan_status| active, inactive, archived
meal_type| breakfast, lunch, dinner, snack
meal_log_status| completed, skipped
food_source_type| database, official_source, user_entry
workout_session_status| planned, completed, skipped, cancelled
reminder_type| meal, workout, custom
occurrence_status| pending, processed, cancelled, failed, suppressed
delivery_status| attempted, sent, failed, unknown

2.3 Physical schema

Legend: every table has "id uuid" as primary key. "?" means optional; every other column is required. "ts" is a time-zone-aware timestamp; "dec(p,s)" is an exact decimal. FK = foreign key with its delete action. UQ = unique constraint. IDX = index. CHK = database check.

Profile (User Profile module)

user_profiles: authUserId uuid; displayName? text; dateOfBirth? date; heightCm? dec(5,2); activityLevel? text; timeZone? text (IANA name); createdAt ts; updatedAt ts.
- UQ authUserId. No foreign key into the Supabase "auth" schema.
- CHK heightCm > 0.

fitness_goals: userId; goalType text; targetValue? dec(7,2); targetUnit? text; status goal_status (default active); createdAt ts.
- FK userId -> user_profiles RESTRICT. IDX (userId, status).
- CHK targetValue and targetUnit are both set or both null.

food_preferences: userId; preferenceType text; value text.
- FK userId -> user_profiles RESTRICT. UQ (userId, preferenceType, value).

user_allergies: userId; allergenName text; notes? text; createdAt ts.
- FK userId -> user_profiles RESTRICT.
- CHK allergenName <> 'other' OR notes contains non-blank text (the custom description).
- UQ (userId, allergenName) where allergenName <> 'other' (partial unique index).

workout_availability: userId; dayOfWeek int; startTime time; endTime time.
- FK userId -> user_profiles RESTRICT.
- CHK dayOfWeek between 1 and 7; startTime < endTime (a window cannot cross midnight).
- UQ (userId, dayOfWeek, startTime). Several windows per day are allowed; overlaps are rejected by the backend.

Food (Food Database module)

food_sources: sourceName text; sourceReference? text; sourceType food_source_type; accessedAt? date.

foods: name text; description? text; category text; sourceId? uuid; createdByUserId? uuid; isVerified bool (default false); createdAt ts; updatedAt ts.
- FK sourceId -> food_sources RESTRICT. FK createdByUserId -> user_profiles RESTRICT.
- CHK createdByUserId IS NULL OR isVerified = false.
- IDX name, category, createdByUserId.

food_nutrition: foodId; referenceQuantity dec(7,2); referenceUnit text (g or ml); calories dec(8,2); protein dec(7,2); carbohydrates dec(7,2); fat dec(7,2); fiber? dec(7,2); createdAt ts; updatedAt ts.
- FK foodId -> foods CASCADE. UQ foodId (one row per food). UQ (foodId, referenceUnit).
- CHK referenceQuantity > 0; calories, protein, carbohydrates, fat and fiber >= 0.

food_portions: foodId; referenceUnit text (g or ml); portionName text; quantity dec(7,2); unit text; referenceAmount dec(7,2).
- FK foodId -> foods CASCADE.
- FK (foodId, referenceUnit) -> food_nutrition (foodId, referenceUnit) NO ACTION. NO ACTION is used so that deleting a food, which cascades to both tables, succeeds.
- UQ (foodId, portionName). UQ (foodId, id).
- CHK quantity > 0; referenceAmount > 0.
- CHK unit NOT IN ('g','ml') OR (unit = referenceUnit AND referenceAmount = quantity).

favorite_foods: userId; foodId; createdAt ts.
- FK userId -> user_profiles RESTRICT. FK foodId -> foods CASCADE. UQ (userId, foodId).

Nutrition (Nutrition module)

meal_plans: userId; name text; description? text; startDate date; endDate? date; status meal_plan_status (default active); createdAt ts; updatedAt ts.
- FK userId -> user_profiles RESTRICT. UQ (userId, id). IDX (userId, status).
- CHK endDate >= startDate.

meals: userId; mealPlanId; name text; mealType meal_type; scheduledTime time; daysOfWeek int[] (default 1 to 7); createdAt ts.
- FK (userId, mealPlanId) -> meal_plans (userId, id) CASCADE. UQ (userId, id). IDX mealPlanId.
- CHK is_valid_weekday_set(daysOfWeek).

meal_entries: mealId; foodId; portionId; quantity dec(7,2); createdAt ts.
- FK mealId -> meals CASCADE. FK (foodId, portionId) -> food_portions (foodId, id) RESTRICT. IDX mealId.
- CHK quantity > 0.

meal_logs: mealId; logDate date; status meal_log_status; createdAt ts.
- FK mealId -> meals CASCADE. UQ (mealId, logDate).

food_logs: userId; foodId; portionId; quantity dec(7,2); consumedAt ts; mealType? meal_type; mealLogId? uuid; notes? text; foodNameSnapshot text; portionNameSnapshot text; caloriesSnapshot dec(8,2); proteinSnapshot dec(7,2); carbohydratesSnapshot dec(7,2); fatSnapshot dec(7,2); fiberSnapshot? dec(7,2); createdAt ts; updatedAt ts.
- FK userId -> user_profiles RESTRICT. FK (foodId, portionId) -> food_portions (foodId, id) RESTRICT. FK mealLogId -> meal_logs SET NULL.
- CHK quantity > 0; snapshots >= 0.
- IDX (userId, consumedAt), mealLogId.
- The snapshot columns freeze the food name, portion name and nutrient totals at logging time. They are recomputed by the backend only when the user edits that log.

Workout (Workout module)

exercises: name text; description text; category text; difficulty text; createdAt ts. UQ name.

workout_plans: userId; name text; description? text; createdAt ts; updatedAt ts.
- FK userId -> user_profiles RESTRICT. UQ (userId, id). IDX userId.

workout_plan_exercises: workoutPlanId; exerciseId; sets int; repetitions int (planned repetitions per set); restSeconds? int; sequence int.
- FK workoutPlanId -> workout_plans CASCADE. FK exerciseId -> exercises RESTRICT. UQ (workoutPlanId, sequence).
- CHK sets > 0; repetitions > 0; restSeconds >= 0; sequence >= 1.

workout_sessions: userId; workoutPlanId? uuid; scheduledAt? ts; startedAt? ts; completedAt? ts; status workout_session_status (default planned); createdAt ts; updatedAt ts.
- FK userId -> user_profiles RESTRICT.
- FK (userId, workoutPlanId) -> workout_plans (userId, id) RESTRICT. A session cannot reference another user's plan.
- UQ (userId, id). IDX (userId, scheduledAt), (userId, completedAt), workoutPlanId.
- CHK valid status and timestamp combinations (section 2.3.1).

workout_exercise_records: sessionId; exerciseId; setsCompleted int; repetitionsCompleted int (repetitions per set); weightKg? dec(6,2); createdAt ts.
- FK sessionId -> workout_sessions CASCADE. FK exerciseId -> exercises RESTRICT. UQ (sessionId, exerciseId).
- CHK setsCompleted >= 0; repetitionsCompleted >= 0; weightKg >= 0.
- One aggregate row per exercise per session. Per-set tracking can later be added as a child table without changing this one.

Notifications (Notifications module)

notification_preferences: userId; mealRemindersEnabled bool (default false); workoutRemindersEnabled bool (default false); quietHoursStart? time; quietHoursEnd? time; updatedAt ts.
- FK userId -> user_profiles RESTRICT. UQ userId.
- CHK quiet hours are both set or both null, and not equal. Quiet hours may cross midnight.
- When no row exists, the defaults (off) apply.

reminders: userId; reminderType reminder_type; title text; timeOfDay time; repeatDays int[]; startDate date; endDate? date; enabled bool (default false); mealId? uuid; workoutSessionId? uuid; createdAt ts; updatedAt ts.
- FK userId -> user_profiles RESTRICT.
- FK (userId, mealId) -> meals (userId, id) CASCADE.
- FK (userId, workoutSessionId) -> workout_sessions (userId, id) CASCADE.
- CHK is_valid_weekday_set(repeatDays); endDate >= startDate.
- CHK mealId only for meal reminders; workoutSessionId only for workout reminders; custom reminders have neither.
- IDX userId, mealId, workoutSessionId.

scheduled_reminders (occurrences): reminderId; scheduledAt ts; status occurrence_status (default pending); createdAt ts; updatedAt ts.
- FK reminderId -> reminders CASCADE. UQ (reminderId, scheduledAt). IDX (status, scheduledAt).
- There is no userId; the owner is derived from the reminder.

notification_deliveries: scheduledReminderId; providerReference? text; status delivery_status; attemptedAt ts; errorCode? text.
- FK scheduledReminderId -> scheduled_reminders CASCADE. IDX scheduledReminderId.

Progress (Progress module)

weight_records: userId; weightKg dec(5,2); recordedAt ts; createdAt ts.
- FK userId -> user_profiles RESTRICT. CHK weightKg > 0. IDX (userId, recordedAt).

2.3.1 Workout session status and timestamps

Status| scheduledAt| startedAt| completedAt
planned| required| empty| empty
completed| optional| optional| required; must not be before startedAt when startedAt is set
skipped or cancelled| required| empty| empty

Rescheduling a planned session changes scheduledAt. Completing a planned session keeps its scheduledAt. A workout recorded after the fact needs only completedAt. scheduledAt (the planned time) and startedAt (the actual start) are different concepts and are both kept.

2.3.2 Portion conversion

Every portion states its own size in the food's nutrition reference unit (g or ml) through the required referenceAmount, and its referenceUnit must equal the food's nutrition referenceUnit (enforced by the composite foreign key). No conversion is shared between foods.

Nutrient value for a logged or planned entry = nutrient value x (entry quantity x portion referenceAmount / nutrition referenceQuantity).

A portion measured directly in g or ml must use the food's reference unit and have referenceAmount equal to its quantity. A "100 g" portion therefore cannot exist for a food whose nutrition is stated per ml, because that would need an unknown density.

2.3.3 Weekday sets

A database function is_valid_weekday_set(integer[]) returns true only when the array has 1 to 7 values, every value is between 1 and 7, there are no duplicates and no NULL elements. It is declared IMMUTABLE, created before the first table that uses it, and used by meals.daysOfWeek and reminders.repeatDays. Weekdays use ISO numbering: 1 is Monday, 7 is Sunday. A meal with all seven days is a daily meal.

2.4 Reminder architecture

- A reminders row is the rule: title, time of day, selected weekdays, a date range, and an enabled flag that defaults to false. Reminders are disabled unless the user explicitly enables them.
- Reminder types are meal, workout and custom. A meal reminder may link to a meal, and a workout reminder may link to a workout session. Both links are optional, which also allows standalone meal and workout reminders. A custom reminder has no link.
- A one-off reminder has startDate equal to endDate. A recurring reminder has repeatDays and an optional endDate.
- Meal and workout links are real foreign keys. Deleting the meal or session deletes its reminder. The database guarantees that the target exists, matches the reminder type and belongs to the same user.
- When a meal or workout session is changed, the Nutrition or Workout module requests the update of the linked reminder through a Notifications module interface, in the same operation. Reminder data is not stored twice.
- A background job creates scheduled_reminders rows (occurrences) for a short rolling window ahead. The length of the window and the queue technology are decided with the job design (LLD.md section 11). The occurrence time is the local date plus timeOfDay in the user's time zone, converted to an exact moment.
- Duplicate occurrences are impossible because (reminderId, scheduledAt) is unique.
- No occurrences are created when the reminder is disabled, when the user has no timeZone, or when the master switch for its type is off. Meal and workout reminders also require the matching notification_preferences switch. Custom reminders use only their own enabled flag.
- Occurrences inside quiet hours are marked suppressed and are never sent late.
- Changing or disabling a reminder, changing its meal time, or changing the user's time zone cancels pending occurrences and regenerates them.
- Occurrence status values: pending, processed, cancelled, failed, suppressed. Each delivery attempt is stored in notification_deliveries. Delivery acceptance by a provider does not prove the user received the notification.
- Scheduling is kept separate from delivery, as API-SPECIFICATION.md section 8.8 requires.

2.5 Ownership rules

- Directly owned (userId): user_profiles (itself), fitness_goals, food_preferences, user_allergies, workout_availability, favorite_foods, meal_plans, meals, food_logs, workout_plans, workout_sessions, notification_preferences, reminders and weight_records.
- Owned through a parent: meal_entries and meal_logs (through meals), workout_plan_exercises (through workout plans), workout_exercise_records (through sessions), scheduled_reminders and notification_deliveries (through reminders).
- Shared catalogue, read-only for users in the MVP: food_sources, food_portions, food_nutrition, exercises, and foods without a creator. Seed data and migrations write them.
- A custom food (createdByUserId set) is visible only to its creator. Food queries return shared foods plus the requester's own foods.
- Enforced by the database: a meal belongs to its plan's owner; a reminder's meal and workout session belong to the reminder's user; a workout session's plan belongs to the session's user; a portion belongs to its food and matches its nutrition reference unit.
- Enforced by the backend, each with an automated test: a food log's mealLogId belongs to the same user; meal entries use only shared foods or the owner's custom foods; exercise records exist only for completed sessions; availability windows do not overlap; a food log's mealType matches its meal's type.
- Per ADR-002, every repository query on user-owned data filters by the owner taken from the verified token in the same query. A request for another user's resource returns 404.

2.6 Delete rules

- No foreign key from user_profiles to its data cascades. All are RESTRICT, so account deletion is an explicit later feature that follows the approved retention policy. The same applies to foods.createdByUserId.
- Cascades occur only inside a parent-child chain: meal plan to meals to entries and meal logs; workout plan to its exercises; session to exercise records; meal or session to its reminders; reminder to occurrences to deliveries; food to its nutrition, portions and favorites.
- A logged or planned food cannot be deleted (RESTRICT from food_logs and meal_entries to portions).
- food_logs.mealLogId is SET NULL, so food history survives when a meal or plan is removed.
- The workout session to workout plan link is RESTRICT. Deleting a workout plan is a two-step operation inside one backend transaction: clear workoutPlanId on its sessions, then delete the plan. A direct deletion of a plan that still has sessions is rejected by the database.
- The API's meal plan deletion archives the plan by default (status archived), because DATABASE-DESIGN.md section 17 requires previous plans to be preserved. A real deletion of plan data happens only for an explicit privacy request, and the cascade chain above supports it.
- There is no API deletion of workout sessions; a session is cancelled or skipped instead.

2.7 Database checks, functions and RLS in migrations

- Prisma cannot express CHECK constraints, the partial unique index on allergies, the weekday function or RLS. These are written as reviewed SQL inside the Prisma migrations.
- RLS is enabled on every table with no permissive policies, and the Supabase data API is turned off (ADR-002 section 3.3). The backend's runtime role bypasses RLS, so backend ownership checks are the enforcement.
- Hand-written constraints must be covered by automated tests that insert invalid data and expect rejection.

2.8 Allowed values

All values below are plain text validated in one documented, code-level list shared by the API validation and the seed validators. Adding a value is a code change, not a migration. If values ever need to be managed without a release, they can be moved to lookup tables later without breaking stored data. The list is also documented in a new file, docs/database/ALLOWED-VALUES.md, created during implementation.

Field| Allowed values
goalType| weight_loss, weight_gain, weight_maintenance, muscle_gain, general_fitness
Exercise difficulty| beginner, intermediate, advanced
Food category| grains_and_breads, legumes_and_pulses, vegetables, fruits, meat_and_poultry, fish_and_seafood, eggs, dairy, nuts_and_seeds, fats_and_oils, beverages, sweets_and_desserts, snacks_and_fast_food, prepared_dishes, condiments_and_sauces, other
Exercise category| strength, cardio, flexibility, mobility, balance, sports, other
Food preference type| dietary_pattern, cuisine, disliked_food
dietary_pattern values| omnivore, vegetarian, vegan, pescatarian, halal, kosher
cuisine values| pakistani, south_asian, middle_eastern, mediterranean, east_asian, western, other
disliked_food value| free text, not linked to the food catalogue
Allergen| milk, eggs, peanuts, tree_nuts, soy, wheat, fish, shellfish, sesame, other (other requires a custom description)
Portion unit| g, ml, piece, slice, cup, tbsp, tsp, bowl, serving
Nutrition reference unit| g, ml
activityLevel| Not decided. It is defined together with the calorie estimation formula.

2.9 Database roles and connections

- Two dedicated roles replace the use of the default "postgres" role by the backend.
- vitafixa_migrator owns the application tables, may create objects in the public schema, and is used only to apply migrations. In the development project it also has CREATEDB so that "prisma migrate dev" can create its temporary shadow database.
- vitafixa_app is the runtime role. It can read and write the application tables, cannot change the schema, has no access to the Supabase "auth" schema, and bypasses RLS (ADR-002). A default-privileges grant gives it access to tables later created by vitafixa_migrator.
- DATABASE_URL is the runtime connection: the Supabase transaction pooler (port 6543) with "pgbouncer=true", using the vitafixa_app role.
- DIRECT_URL is the migration connection: the direct connection string, or the session pooler on port 5432 if the network requires it, using the vitafixa_migrator role. The transaction pooler is never used for migrations.
- The Prisma datasource declares both: url from DATABASE_URL and directUrl from DIRECT_URL.
- TLS is required on both connections.
- Passwords are generated, stored only in environment variables or a secret manager, never committed, and .env.example contains placeholders only.
- The role creation SQL is a reviewed script that the project owner executes manually in the Supabase SQL editor. No agent creates roles. Roles and privileges must not be assumed to exist until the owner confirms them.
- After the roles work, the "postgres" credentials are removed from the backend configuration and the "postgres" password is rotated.
- Development, staging and production use separate Supabase projects. The Supabase service-role key is not part of the running backend configuration; it is needed only for account deletion, which is a later feature.

2.10 Migration strategy

- All schema changes are Prisma migrations committed to version control. Each migration has a single clear purpose.
- Changes are additive first. A column or table is never renamed or dropped in the same release that stops using it. Destructive changes require explicit approval.
- Migrations are authored with "prisma migrate dev" only against the current development Supabase project (new, empty, no production data). If the command offers to reset any project other than that one, the answer is no.
- Staging and production use only "prisma migrate deploy", with the vitafixa_migrator role.
- When a local PostgreSQL or a CI PostgreSQL service is available, migrations and constraint tests run there too. Until then, constraint tests run against the development project.
- Implementation order, each with tests and review before the next:
  1. Prisma datasource update (directUrl) and the reviewed role script.
  2. Profile tables.
  3. Food tables.
  4. Nutrition tables, including the weekday function.
  5. Workout tables.
  6. Progress table.
  7. Notification tables.
  8. Seed data.
- Seed data is reviewed and version controlled. It uses fixed UUIDs so it can be re-run safely, and only reviewed catalogue rows are marked verified. Seed data is loaded with the migration role. The source of the Pakistani and international food data and its licensing must be recorded in food_sources.
- Required tests: migrations apply to an empty database; invalid data is rejected by each CHECK, unique and foreign key rule; the weekday function accepts and rejects the cases in section 2.3.3 (including NULL elements); RLS denies the client-facing roles; ownership tests return 404 for another user's data on every user-owned endpoint.

2.11 API behavior resolutions

- Reminder endpoints keep their shape and gain the type "custom", optional mealId and workoutSessionId, optional start and end dates, and enabled defaulting to false. The in-app notification inbox ("mark as read") is deferred; it is not in the PRD. FR-NOT-007 (respond to reminders) is deferred.
- Goals: the combined goal view saves a fitness goal row (replace archives the previous active goal), stores the weight target in kilograms and updates the profile activity level. Daily calorie and macro targets are computed on demand once the formula is chosen and are not stored.
- The workout session keeps both scheduledAt and startedAt (section 2.3.1). The unused daysPerWeek field is dropped.
- The meal example uses daysOfWeek (a list) instead of dayOfWeek, and includes mealType. Weekly meal schedules are an MVP requirement because the API already carries the day.
- Food endpoints require authentication because custom foods are private.
- Profile weight is saved as a weight_records entry, not as a profile column.

3. Alternatives Considered

Area| Selected| Alternatives
Reminder target| Typed foreign keys with same-user enforcement| One polymorphic relatedEntityId without database checks
Standalone reminders| One reminders rule table with optional links| Reminder switches on meals and sessions only
Recurrence| Weekday list plus date range| Cron-style rules; one row per day
Weekday storage| integer[] with a validating function| One row per day; bitmask
Portion conversion| Required referenceAmount per portion plus composite unit link| Optional gram equivalent; shared conversion tables
Allowed values| Validated text in one code list| Enums for all values; lookup tables
Workout plan delete| RESTRICT with a two-step transaction| SET NULL with a trigger
Database roles| Separate runtime and migration roles| Single role; default postgres role
Migration authoring| Development Supabase project| Local PostgreSQL (not yet installed)

4. Consequences

Positive

- Strong integrity for ownership, units and reminders enforced by the database.
- Most future features are additive: repeating schedules by weekday, per-set workout records, micronutrients, new reminder types, new categories or goal types, progress goals, research content and AI usage tables.
- Safe, reviewable, version-controlled migrations with separated privileges.

Trade-offs and limitations

- Prisma validation of the composite relations with optional members must be confirmed with "prisma validate" at implementation. If Prisma rejects one, that foreign key is written in migration SQL and Prisma keeps a simple relation.
- Several rules rely on the backend and tests (section 2.5). The database does not guarantee that every food has a nutrition row and a base portion; creation transactions and seed validators do.
- A food that is in use cannot be deleted, and a food's reference unit cannot change while it has portions.
- Plan deletion needs a two-step operation. A hard delete of a meal plan cascades its meals and meal logs; only the backend's archive-by-default behavior protects that history.
- Portion referenceAmount accuracy depends on seed and custom-entry data quality; the database checks only sign and unit consistency.
- Allowed values are validated in code, not by the database.
- The migration approach uses the development project until a local or CI PostgreSQL exists.

5. Items Still Open

1. Length of the reminder rolling window, queue technology, and the handling of occurrences missed while the job was unavailable.
2. Whether only one active fitness goal per user is enforced.
3. Calorie estimation formula, its input fields (such as sex) and the activityLevel values.
4. Account deletion and data retention policy.
5. Access control for the health endpoints "/health/ready" and "/health/live".
6. Error response format (LLD.md section 8 and API-SPECIFICATION.md section 6 differ).
7. Web and mobile session storage, access token lifetime and email verification (ADR-002 section 6).
8. Source and licensing of the initial food and exercise catalogues.
9. Whether to add archiving for foods in use.

6. Documentation Impact

ADR-001 section 7 items "Prisma connection configuration with Supabase", "Database migration ownership and workflow" and "Database security and Row Level Security policies" are resolved by this ADR (together with ADR-002). Hosting and deployment configuration remains open. ADR-001 itself is not changed by this ADR.

7. Documentation Conflicts and Required Updates

The existing documents have not been edited. Updating them requires separate approval and is planned as one documentation-only commit after this ADR. The exact updates are:

Document and section| Conflict| Required update
PRD 4.2 (FR-PRO-010)| "Workout availability" is undefined.| Define it as weekly time windows, several per day, each with a start and end time.
PRD 4.5 (FR-MEAL-010)| Repeating schedules are only a "should".| State that selected weekdays are an MVP requirement.
PRD 4.8| No custom reminders, recurrence or default state.| Add custom reminders, recurrence on selected days, reminders disabled by default, quiet hours that skip reminders instead of delaying them. Mark FR-NOT-007 as a later feature.
PRD 4.1| Registration, login, logout and recovery are phrased as backend functions.| Add a note that Supabase Auth provides them and the backend verifies tokens (ADR-002).
API 5 and 8.1| Health "ready" and "live" are "Internal/authorized" without a mechanism.| Keep open until decided; note default-deny and @Public for "/health" (ADR-002).
API 8.2| Profile example has weightKg and no timeZone or activityLevel.| Add timeZone and activityLevel; state that weight creates a weight record.
API 8.3| Goal example combines primaryGoal, targetWeightKg and activityLevel; allergies are free text.| Document the mapping in section 2.11; list allowed goal types and allergen codes.
API 8.4| Foods are "Public or authenticated".| Require authentication; document portion fields referenceAmount and referenceUnit.
API 8.5| Meal example has dayOfWeek and no mealType; DELETE plan implies hard deletion.| Use daysOfWeek (list) and mealType; state that DELETE archives by default.
API 8.6| No endpoints to complete, skip or replace a meal.| Add meal log endpoints; allow mealType and mealLogId on food logs.
API 8.7| Session has startedAt only; workout plan has daysPerWeek; no availability endpoints.| Add scheduledAt, keep startedAt and completedAt, remove daysPerWeek, add workout availability endpoints, describe plan deletion.
API 8.8| Reminder type lacks custom; inbox has no requirement.| Add custom, optional links and dates, enabled default false; remove or defer the inbox endpoints.
API 6 and LLD 8| Different error response structures.| Choose one structure (still open).
DATABASE-DESIGN 3, 4| Entity list and ERD omit Reminder, WorkoutAvailability and MealLog.| Add them and the new relationships.
DATABASE-DESIGN 5.1| heightValue and heightUnit; no timeZone or displayName.| heightCm, timeZone and displayName.
DATABASE-DESIGN 5.4| Allergies are free text.| Standard allergen list with a custom description for "other".
DATABASE-DESIGN 6.2, 6.3| gramEquivalent is optional; several nutrition rows per food.| Required referenceAmount and referenceUnit; one nutrition row per food.
DATABASE-DESIGN 7.2, 7.4| Meal lacks userId and daysOfWeek; FoodLog lacks mealType, mealLogId and snapshots.| Add them as specified in section 2.3.
DATABASE-DESIGN 8.4, 8.5| WorkoutSession has scheduledAt only; weight has a unit column.| Add startedAt, optional timestamps and the status rules; use weightKg.
DATABASE-DESIGN 9.1, 9.2| timeZone sits in NotificationPreference; ScheduledReminder uses relatedEntityId and userId.| Move timeZone to the profile; add Reminder; occurrences link to a reminder.
DATABASE-DESIGN 3.6, 10.2, 11| ProgressGoal and Research tables are listed as initial entities.| Mark them as deferred.
DATABASE-DESIGN 12, 13, 15| UUIDs, units and indexes are recommendations or options.| Record the approved conventions and index list.
DATABASE-DESIGN 16| Expects per-user RLS policies.| Describe RLS deny-by-default with the data API off (ADR-002 and this ADR).
LLD 2 and TECHNICAL-ARCHITECTURE 7| Folder tree shows "docs/decisions/"; the ADRs are in "docs/architecture/DECISIONS/".| Correct the path.
LLD 5.1| Identity lists register, authenticate and log out.| Supabase Auth owns them; Identity holds token verification, the guard and the Supabase adapter.
LLD 5.6 (Notifications)| Conceptual models lack Reminder.| Add Reminder as the rule and ScheduledReminder as the occurrence.
LLD 9| No database role or connection guidance.| Add the two roles and DATABASE_URL and DIRECT_URL.
TECHNICAL-ARCHITECTURE 8| Lists "/api/v1/auth".| Remove it.
TECHNICAL-ARCHITECTURE 2.4 and 9| RLS "additional protection" is vague; entity list is incomplete.| Reference ADR-002 and this ADR.
SECURITY-DESIGN 5.1| Logout "must invalidate" the session.| Note the access token expiry limitation and the recheck for sensitive operations (ADR-002).
SECURITY-DESIGN 5.3 and 11| Session strategy undecided; "JWT-related secrets".| Note the Bearer-only API and that no JWT secret is stored.
SECURITY-DESIGN 7.1 and 7.3| Per-user RLS policies; generic database access.| Align with RLS deny-by-default and the two database roles.
HLD 6.4| Meal reminder flow does not mention the reminder rule.| Add the Reminder rule and occurrence steps.
TESTING-STRATEGY 7| No schema or migration tests.| Add migration, constraint, RLS and ownership tests (section 2.10).
ADR-001 7| Lists items now resolved.| Add a forward note: amended by ADR-002 and ADR-003.

8. Review Conditions

This decision should be reviewed if direct client access to the database is introduced, if the number of reminder types grows beyond what optional links handle simply, if a local or CI PostgreSQL changes the migration workflow, if production load requires partitioning or a separate job service, or if the retention policy changes the deletion rules.

---

End of ADR-003

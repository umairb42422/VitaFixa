import { Module } from '@nestjs/common';
import { HealthModule } from './common/health/health.module';
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { FoodDatabaseModule } from './modules/food-database/food-database.module';
import { IdentityModule } from './modules/identity/identity.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { ProgressModule } from './modules/progress/progress.module';
import { ResearchCentreModule } from './modules/research-centre/research-centre.module';
import { UserProfileModule } from './modules/user-profile/user-profile.module';
import { WorkoutModule } from './modules/workout/workout.module';

@Module({
  imports: [
    HealthModule,
    IdentityModule,
    UserProfileModule,
    NutritionModule,
    FoodDatabaseModule,
    WorkoutModule,
    NotificationsModule,
    ProgressModule,
    AiAssistantModule,
    ResearchCentreModule,
  ],
})
export class AppModule {}

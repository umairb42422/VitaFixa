import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { AiAssistantModule } from '../src/modules/ai-assistant/ai-assistant.module';
import { FoodDatabaseModule } from '../src/modules/food-database/food-database.module';
import { IdentityModule } from '../src/modules/identity/identity.module';
import { NotificationsModule } from '../src/modules/notifications/notifications.module';
import { NutritionModule } from '../src/modules/nutrition/nutrition.module';
import { ProgressModule } from '../src/modules/progress/progress.module';
import { ResearchCentreModule } from '../src/modules/research-centre/research-centre.module';
import { UserProfileModule } from '../src/modules/user-profile/user-profile.module';
import { WorkoutModule } from '../src/modules/workout/workout.module';

describe('AppModule', () => {
  beforeAll(() => {
    process.env.SUPABASE_URL = 'https://test-project.supabase.co';
  });

  it('compiles and registers all nine business modules', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const imports: unknown[] = Reflect.getMetadata('imports', AppModule);
    for (const m of [
      IdentityModule, UserProfileModule, NutritionModule, FoodDatabaseModule, WorkoutModule,
      NotificationsModule, ProgressModule, AiAssistantModule, ResearchCentreModule,
    ]) {
      expect(imports).toContain(m);
    }
    expect(moduleRef).toBeDefined();
  });
});

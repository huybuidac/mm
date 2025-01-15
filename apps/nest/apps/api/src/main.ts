import { NestFactory } from '@nestjs/core'
import { ApiModule } from './api.module'
import { setupNestApp, setupSwaggerUI } from '@app/core/setup-nest-app'

async function bootstrap() {
  const app = await NestFactory.create(ApiModule)
  await setupNestApp(app)
  setupSwaggerUI(app)
  await app.listen(process.env.port ?? 3000)
}

bootstrap()

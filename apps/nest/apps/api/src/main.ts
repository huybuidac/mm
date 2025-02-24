import { NestFactory } from '@nestjs/core'
import { ApiModule } from './api.module'
import { bootstrapServerless, setupNestApp, setupSwaggerUI } from '@app/core/setup-nest-app'
import { Handler } from 'express'
import type { Context } from 'aws-lambda'

const localDev = process.env.LOCAL_DEV === 'true'

if (localDev) {
  async function bootstrap() {
    const app = await NestFactory.create(ApiModule)
    await setupNestApp(app)
    setupSwaggerUI(app)
    await app.listen(process.env.port ?? 3000)
    console.log(`Server is running at http://localhost:${process.env.port ?? 3000}/docs`)
  }

  bootstrap()
}

let server: Handler

export const handler = async (event: any, context: Context, callback) => {
  server = server ?? (await bootstrapServerless(ApiModule, 'api'))

  return server(event, context as any, callback) as any
}

import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);
  setupSwaggerUI(app);
  await app.listen(process.env.port ?? 3000);
}

function setupSwaggerUI(app: INestApplication, route = 'docs') {
  const config = new DocumentBuilder()
    .setTitle('Median')
    .setDescription('The Median API description')
    .setVersion('0.1')
    .addBearerAuth()
    .setExternalDoc('Postman Collection', `docs-json`)
    .addBearerAuth({ type: 'http' }, 'refresh')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: false,
  });
  SwaggerModule.setup(route, app, document, { useGlobalPrefix: true });
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';
import { runPreMigrations } from './pre-migrations';

async function bootstrap() {
  // Ejecutar migraciones previas a la sincronización de base de datos
  await runPreMigrations();

  const app = await NestFactory.create(AppModule);

  // Asegurar la existencia del directorio uploads
  const uploadDir = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Servir archivos estáticos de uploads
  app.use('/uploads', express.static(uploadDir));

  app.enableCors(); // Fundamental para React
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Mall Multi-Tenant API')
    .setDescription(
      'API REST para la arquitectura Multi-Tenant del sistema Mall',
    )
    .setVersion('1.0')
    .addGlobalParameters({
      in: 'header',
      name: 'x-tenant-id',
      required: false,
      description:
        'El ID del tenant actual (Legacy, ahora usamos subdominio o token)',
    })
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Introduce el token JWT (access_token)',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}
bootstrap();

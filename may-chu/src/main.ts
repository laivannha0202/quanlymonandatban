import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function khoiDong(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
  app.use(helmet());

  const frontendOrigins = config
    .get<string>('FRONTEND_URL', 'http://localhost:5173')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  app.enableCors({
    origin: frontendOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: { target: false, value: false },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Quản lý nhà hàng')
    .setDescription('REST API cho khách hàng và quản trị nhà hàng')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const taiLieu = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/tai-lieu', app, taiLieu, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(config.get<string>('PORT', '8080'));
  await app.listen(port, '0.0.0.0');
}

void khoiDong();

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { CustomValidationPipe } from './common/pipes/validation.pipe.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Thiết lập tiền tố toàn cục cho API
  app.setGlobalPrefix('api/v1');

  // Cấu hình Global Validation Pipe
  app.useGlobalPipes(new CustomValidationPipe());

  // Cấu hình CORS
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
  app.enableCors({
    credentials: true,
    origin: webOrigin.split(',').map((origin) => origin.trim()),
  });

  // Kích hoạt shutdown hooks
  app.enableShutdownHooks();

  // Khởi tạo tài liệu OpenAPI / Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('BrewLite API Specification')
    .setDescription('Tài liệu đặc tả RESTful API cho ứng dụng đặt cà phê BrewLite')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT Authorization',
        description: 'Nhập JWT Access Token (Bearer Token)',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');

  logger.log(`Ứng dụng Backend BrewLite đang chạy tại: http://localhost:${port}/api/v1`);
  logger.log(`Tài liệu Swagger API đang sẵn sàng tại: http://localhost:${port}/api/docs`);
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(
    'Khởi động ứng dụng thất bại:',
    error instanceof Error ? error.stack : String(error),
  );
  process.exitCode = 1;
});

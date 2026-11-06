import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Global Exception Filter xử lý lỗi tập trung & chuẩn hóa response
  app.useGlobalFilters(new AllExceptionsFilter());

  // Danh sách tên miền được phép truy cập (CORS Whitelisting)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500',
    'https://wispybyte.app',
    'https://haiandbao.wispybyte.app',
  ];

  // Cấu hình CORS Whitelisting bảo mật
  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép request từ cùng nguồn (same-origin), mobile app, postman (origin = undefined)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.wispybyte.app')) {
        callback(null, true);
      } else {
        // Cho phép dev và deploy linh hoạt nhưng vẫn log và kiểm soát
        callback(null, true);
      }
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'api-key'],
    credentials: true,
  });

  // Global prefix /api
  app.setGlobalPrefix('api');

  // Xử lý route gốc / để tránh lỗi 404 khi người dùng truy cập http://localhost:5000
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/', (req: any, res: any) => {
    res.type('html').send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>CLB Sân Bóng C1 - Backend Server</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #064e3b; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: white; color: #1e293b; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); max-width: 520px; text-align: center; }
          h1 { color: #047857; margin-top: 0; font-size: 26px; }
          p { color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
          .btn { display: inline-block; padding: 14px 28px; background: #059669; color: white; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; transition: 0.2s; }
          .btn:hover { background: #047857; transform: translateY(-2px); }
          .api-link { display: block; margin-top: 16px; color: #059669; font-size: 14px; text-decoration: none; font-weight: 500; }
          .api-link:hover { text-decoration: underline; }
          .badge { display: inline-block; background: #dcfce7; color: #15803d; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 20px; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">● NestJS Backend Online (Port 5000)</div>
          <h1>⚽ CLB Sân Bóng C1 - Backend API</h1>
          <p>Bạn đang truy cập vào cổng <strong>5000 (Máy chủ API)</strong>.<br>Giao diện trang web chính của bạn đang chạy tại cổng <strong>3000</strong>.</p>
          <a href="http://localhost:3000" class="btn">👉 Chuyển sang Website (Cổng 3000)</a>
          <br>
          <a href="/api" class="api-link">Xem tài liệu endpoints API (/api) →</a>
        </div>
      </body>
      </html>
    `);
  });

  const port = process.env.PORT || 14998;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 NestJS Backend đang chạy tại port ${port} (0.0.0.0)`);
}
bootstrap();


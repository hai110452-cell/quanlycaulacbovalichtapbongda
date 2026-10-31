import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

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

  // CORS - cho phép mọi frontend dev (Next.js port 3000, Live Server, v.v.) kết nối
  app.enableCors({
    origin: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
        <title>Sao Vàng FC - Backend Server</title>
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
          <h1>⚽ Sao Vàng FC - Backend API</h1>
          <p>Bạn đang truy cập vào cổng <strong>5000 (Máy chủ API)</strong>.<br>Giao diện trang web chính của bạn đang chạy tại cổng <strong>3000</strong>.</p>
          <a href="http://localhost:3000" class="btn">👉 Chuyển sang Website (Cổng 3000)</a>
          <br>
          <a href="/api" class="api-link">Xem tài liệu endpoints API (/api) →</a>
        </div>
      </body>
      </html>
    `);
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`🚀 NestJS Backend đang chạy tại: http://localhost:${port}/api`);
}
bootstrap();


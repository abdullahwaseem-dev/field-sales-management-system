import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { CONFIG, type Config } from './config';

export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: process.env.NODE_ENV === 'test' ? ['error'] : undefined });
  const config = app.get<Config>(CONFIG);
  app.use(helmet());
  app.set('trust proxy', 1);
  app.enableCors({ origin: config.PORTAL_ORIGIN.split(','), credentials: false, maxAge: 600 });
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'p/:slug'] });
  app.enableShutdownHooks();
  return app;
}

if (require.main === module) {
  void (async () => {
    const app = await createApp();
    const config = app.get<Config>(CONFIG);
    await app.listen(config.PORT, '0.0.0.0');
    new Logger('SFMS').log(`API listening on http://localhost:${config.PORT}/api/v1`);
  })();
}

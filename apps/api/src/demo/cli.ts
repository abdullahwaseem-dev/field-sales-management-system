// Rebuilds the public demo's activity: `node dist/demo/cli.js [days]` against DATABASE_URL (DEMO_MODE=true).
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DemoService } from '../modules/demo/demo';

async function main() {
  if (process.env.DEMO_MODE !== 'true') throw new Error('Refusing to run: DEMO_MODE must be true (this writes simulated activity)');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  const started = Date.now();
  const result = await app.get(DemoService).backfill(new Date(), Number(process.argv[2] ?? 21));
  console.log(`✔ demo backfilled: ${result.steps} steps for ${result.reps} reps in ${Math.round((Date.now() - started) / 1000)}s`);
  await app.close();
}
void main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { Controller, Get, Inject, Logger, Module, Param, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../../common/auth/principal';
import { notFound } from '../../common/errors';
import { CONFIG, type Config } from '../../config';

const STYLES = new Set(['alidade_smooth', 'alidade_smooth_dark']);
const MAX_CACHED = 1500; // ~20–40 MB of PNG tiles

/**
 * Map tile proxy. The Stadia Maps API key stays on the server (keys are for non-browser apps), so
 * the portal works on any internal host or IP without registering a domain. Tiles are cached in
 * memory and by browsers to save quota.
 */
@Controller('tiles')
export class TilesController {
  private readonly log = new Logger('Tiles');
  private readonly cache = new Map<string, Buffer>();

  constructor(@Inject(CONFIG) private readonly config: Config) {}

  @Public()
  @Get(':style/:z/:x/:file')
  @Throttle({ default: { limit: 2000, ttl: 60_000 } })
  async tile(@Param('style') style: string, @Param('z') z: string, @Param('x') x: string, @Param('file') file: string, @Res() res: Response) {
    const m = /^(\d{1,7})(@2x)?\.png$/.exec(file);
    if (!STYLES.has(style) || !/^\d{1,2}$/.test(z) || !/^\d{1,7}$/.test(x) || !m || Number(z) > 20) throw notFound();
    const key = `${style}/${z}/${x}/${file}`;
    let body = this.cache.get(key);
    if (!body) {
      const url = `https://tiles.stadiamaps.com/tiles/${key}${this.config.STADIA_API_KEY ? `?api_key=${encodeURIComponent(this.config.STADIA_API_KEY)}` : ''}`;
      const upstream = await fetch(url);
      if (!upstream.ok) {
        this.log.warn(`upstream ${upstream.status} for ${key}`);
        return res.status(upstream.status === 404 ? 404 : 502).end();
      }
      body = Buffer.from(await upstream.arrayBuffer());
      if (this.cache.size >= MAX_CACHED) this.cache.delete(this.cache.keys().next().value!); // drop oldest
      this.cache.set(key, body);
    } else {
      this.cache.delete(key); // refresh LRU position
      this.cache.set(key, body);
    }
    res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800, immutable', 'Cross-Origin-Resource-Policy': 'same-site' });
    return res.send(body);
  }
}

@Module({ controllers: [TilesController] })
export class TilesModule {}

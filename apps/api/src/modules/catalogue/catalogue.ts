import { Body, Controller, Get, Header, HttpCode, Inject, Injectable, Module, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { sql } from 'kysely';
import { z } from 'zod';
import { CurrentUser, type Principal, Public } from '../../common/auth/principal';
import { FieldCipher } from '../../common/crypto';
import { notFound } from '../../common/errors';
import { Zod } from '../../common/validation';
import { CONFIG, type Config } from '../../config';
import { type Db, KYSELY } from '../../db/database';

/** FR-MKT-01..03: browse the published catalogue, share, log every share. */
@Injectable()
export class CatalogueService {
  private readonly cipher: FieldCipher;

  constructor(@Inject(KYSELY) private readonly db: Db, @Inject(CONFIG) private readonly config: Config) {
    this.cipher = new FieldCipher(config.JWT_SECRET);
  }

  categories() {
    return this.db.selectFrom('product_category').select(['category_id', 'name_en', 'name_ar']).where('status', '=', 'active').orderBy('sort_order').execute();
  }

  private published() {
    return this.db
      .selectFrom('product as p')
      .where('p.status', '=', 'published')
      .where((eb) => eb.or([eb('p.valid_from', 'is', null), eb('p.valid_from', '<=', sql<string>`current_date`)]))
      .where((eb) => eb.or([eb('p.valid_to', 'is', null), eb('p.valid_to', '>=', sql<string>`current_date`)]));
  }

  async list(q: { categoryId?: string; type?: 'product' | 'offer' | 'promo'; q?: string }) {
    let query = this.published().select([
      'p.product_id', 'p.item_type', 'p.category_id', 'p.name_en', 'p.name_ar', 'p.description_en', 'p.description_ar', 'p.valid_to', 'p.share_slug', 'p.published_at',
      (eb) => eb.selectFrom('product_media as m').select('m.storage_key').whereRef('m.product_id', '=', 'p.product_id').orderBy('m.sort_order').limit(1).as('image'),
    ]);
    if (q.categoryId) query = query.where('p.category_id', '=', q.categoryId);
    if (q.type) query = query.where('p.item_type', '=', q.type);
    if (q.q) {
      const like = `%${q.q.trim()}%`;
      query = query.where((eb) => eb.or([eb('p.name_en', 'ilike', like), eb('p.name_ar', 'ilike', like)]));
    }
    const rows = await query.orderBy('p.published_at', 'desc').execute();
    return rows.map((r) => ({ ...r, shareUrl: this.shareUrl(r.share_slug) }));
  }

  async detail(id: string) {
    const p = await this.published().selectAll('p').where('p.product_id', '=', id).executeTakeFirst();
    if (!p) throw notFound();
    const media = await this.db.selectFrom('product_media').selectAll().where('product_id', '=', id).orderBy('sort_order').execute();
    return { ...p, media, shareUrl: this.shareUrl(p.share_slug) };
  }

  /** Idempotent per shareId (safe to retry from the offline queue). Recipient is encrypted at rest. */
  async logShare(user: Principal, productId: string, b: { shareId: string; channel: 'whatsapp' | 'sms' | 'email' | 'link' | 'other'; recipient?: string; sharedAt: Date }) {
    const p = await this.published().select(['p.share_slug']).where('p.product_id', '=', productId).executeTakeFirst();
    if (!p) throw notFound();
    await this.db
      .insertInto('share_event')
      .values({ share_id: b.shareId, employee_id: user.employeeId, product_id: productId, channel: b.channel, recipient: b.recipient ? this.cipher.encrypt(b.recipient) : null, shared_at: b.sharedAt })
      .onConflict((oc) => oc.column('share_id').doNothing())
      .execute();
    return { shareId: b.shareId, shareUrl: this.shareUrl(p.share_slug) };
  }

  shareUrl(slug: string) {
    return `${this.config.PUBLIC_BASE_URL}/p/${slug}`;
  }

  async publicPage(slug: string) {
    return this.published().select(['p.name_en', 'p.name_ar', 'p.description_en', 'p.description_ar', 'p.valid_to']).where('p.share_slug', '=', slug).executeTakeFirst();
  }
}

const ListQuery = z.object({ categoryId: z.uuid().optional(), type: z.enum(['product', 'offer', 'promo']).optional(), q: z.string().max(100).optional() });
const ShareBody = z.object({
  shareId: z.uuid(),
  channel: z.enum(['whatsapp', 'sms', 'email', 'link', 'other']),
  recipient: z.string().trim().max(200).optional(),
  sharedAt: z.coerce.date(),
});

@Controller('catalogue')
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}

  @Get('categories')
  categories() {
    return this.catalogue.categories();
  }

  @Get()
  list(@Query(new Zod(ListQuery)) q: z.infer<typeof ListQuery>) {
    return this.catalogue.list(q);
  }

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogue.detail(id);
  }

  @Post(':id/shares')
  @HttpCode(200)
  share(@CurrentUser() user: Principal, @Param('id', ParseUUIDPipe) id: string, @Body(new Zod(ShareBody)) b: z.infer<typeof ShareBody>) {
    return this.catalogue.logShare(user, id, b);
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Public landing page behind shared links (no login): bilingual product card. */
@Controller('p')
export class SharePageController {
  constructor(private readonly catalogue: CatalogueService) {}

  @Public()
  @Get(':slug')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async page(@Param('slug') slug: string) {
    const p = await this.catalogue.publicPage(slug);
    if (!p) throw notFound();
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.name_en)} · ZONA</title><style>
body{margin:0;font-family:system-ui,sans-serif;background:#F9FAFC;color:#161D29}main{max-width:36rem;margin:0 auto;padding:24px 16px}
article{background:#fff;border:1px solid #E3E6EC;border-radius:14px;padding:20px;margin-bottom:16px}h1{font-size:22px;margin:0 0 8px}p{line-height:1.6;margin:0}
[lang=ar]{direction:rtl;line-height:1.8}@media (prefers-color-scheme:dark){body{background:#090F1C;color:#F2F3F7}article{background:#0F1725;border-color:#2D3645}}
</style></head><body><main>
<article><h1>${esc(p.name_en)}</h1><p>${esc(p.description_en)}</p></article>
<article lang="ar" dir="rtl"><h1>${esc(p.name_ar)}</h1><p>${esc(p.description_ar)}</p></article>
</main></body></html>`;
  }
}

@Module({ controllers: [CatalogueController, SharePageController], providers: [CatalogueService] })
export class CatalogueModule {}

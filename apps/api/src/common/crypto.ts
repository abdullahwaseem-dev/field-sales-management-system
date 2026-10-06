import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
export const randomToken = () => randomBytes(32).toString('base64url');
export const sixDigitCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0');
export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * AES-256-GCM for personal data stored at rest at the application layer (e.g. a customer's phone
 * number in a share log). Key: DATA_KEY (base64, 32 bytes) or, in development, derived from the JWT
 * secret. Output: "v1.<iv>.<tag>.<ciphertext>" (base64url).
 */
export class FieldCipher {
  private readonly key: Buffer;
  constructor(secret: string) {
    this.key = Buffer.from(hkdfSync('sha256', secret, 'sfms', 'field-cipher-v1', 32));
  }
  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const c = createCipheriv('aes-256-gcm', this.key, iv);
    const body = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
    return ['v1', iv, c.getAuthTag(), body].map((p) => (typeof p === 'string' ? p : p.toString('base64url'))).join('.');
  }
  decrypt(token: string): string {
    const [v, iv, tag, body] = token.split('.');
    if (v !== 'v1' || !iv || !tag || !body) throw new Error('Unsupported ciphertext');
    const d = createDecipheriv('aes-256-gcm', this.key, Buffer.from(iv, 'base64url'));
    d.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([d.update(Buffer.from(body, 'base64url')), d.final()]).toString('utf8');
  }
}

#!/usr/bin/env node
/**
 * i18n build — one ICU MessageFormat source per locale (messages/*.json) → portal + mobile.
 *
 *   dist/en.json, dist/ar.json                          FormatJS catalogues (portal)
 *   apps/mobile/lib/l10n/app_en.arb, app_ar.arb         Flutter gen-l10n input (placeholders typed)
 *   REVIEW.md                                           Arabic strings flagged for native review
 *
 * Gates (exit 1): missing/extra keys between locales, ICU syntax errors, plural messages that do not
 * cover every CLDR category for the locale (Arabic: zero/one/two/few/many/other), placeholder names
 * that differ between locales.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, TYPE } from '@formatjs/icu-messageformat-parser';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = join(here, '..');
const repo = join(pkg, '..', '..');
const LOCALES = ['en', 'ar'];
const PLURAL_CATEGORIES = { en: ['one', 'other'], ar: ['zero', 'one', 'two', 'few', 'many', 'other'] };

const normalise = (entry) => (typeof entry === 'string' ? { message: entry } : entry);
const source = Object.fromEntries(LOCALES.map((l) => [l, Object.fromEntries(
  Object.entries(JSON.parse(readFileSync(join(pkg, 'messages', `${l}.json`), 'utf8')))
    .filter(([k]) => !k.startsWith('$'))
    .map(([k, v]) => [k, normalise(v)]),
)]));

const errors = [];
const keys = Object.keys(source.en);
for (const l of LOCALES) {
  const have = new Set(Object.keys(source[l]));
  for (const k of keys) if (!have.has(k)) errors.push(`[${l}] missing key "${k}"`);
  for (const k of have) if (!source.en[k]) errors.push(`[${l}] extra key "${k}" (not in en)`);
}

/** Walk an ICU AST and collect argument names with the type Flutter needs. */
function collectArgs(ast, out = new Map(), locale, key) {
  for (const el of ast) {
    if (el.type === TYPE.argument) out.set(el.value, out.get(el.value) ?? 'String');
    if (el.type === TYPE.number) out.set(el.value, 'num');
    if (el.type === TYPE.plural) {
      out.set(el.value, 'int');
      const cats = Object.keys(el.options).filter((c) => !c.startsWith('='));
      const required = PLURAL_CATEGORIES[locale];
      const missing = required.filter((c) => !cats.includes(c));
      if (missing.length) errors.push(`[${locale}] "${key}": plural "${el.value}" is missing categories: ${missing.join(', ')}`);
      for (const opt of Object.values(el.options)) collectArgs(opt.value, out, locale, key);
    }
    if (el.type === TYPE.select) {
      out.set(el.value, 'String');
      for (const opt of Object.values(el.options)) collectArgs(opt.value, out, locale, key);
    }
    if (el.type === TYPE.tag) collectArgs(el.children, out, locale, key);
  }
  return out;
}

const args = {};
for (const l of LOCALES) {
  for (const k of keys) {
    const msg = source[l][k]?.message;
    if (msg == null) continue;
    try {
      const found = collectArgs(parse(msg, { ignoreTag: true }), new Map(), l, k);
      if (l === 'en') args[k] = found;
      else {
        const a = [...args[k].keys()].sort().join(','), b = [...found.keys()].sort().join(',');
        if (a !== b) errors.push(`[${l}] "${k}": placeholders {${b}} differ from en {${a}}`);
      }
    } catch (e) {
      errors.push(`[${l}] "${k}": ICU syntax error — ${e.message}`);
    }
  }
}

if (errors.length) {
  console.error(`\n✖ i18n validation failed (${errors.length}):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}

// Flutter's ICU parser has no "#" shorthand: rewrite "#" inside plural branches to "{arg}".
function toFlutter(message) {
  let out = '', depth = 0, pluralArg = [], i = 0;
  const pluralAt = /^\{\s*([A-Za-z_][\w]*)\s*,\s*plural\s*,/;
  while (i < message.length) {
    const ch = message[i];
    if (ch === "'") { out += ch; i++; continue; }
    if (ch === '{') {
      const m = message.slice(i).match(pluralAt);
      pluralArg.push({ depth, name: m ? m[1] : null });
      depth++;
    } else if (ch === '}') {
      depth--;
      if (pluralArg.length && pluralArg.at(-1).depth === depth) pluralArg.pop();
    } else if (ch === '#') {
      const active = [...pluralArg].reverse().find((p) => p.name);
      if (active) { out += `{${active.name}}`; i++; continue; }
    }
    out += ch;
    i++;
  }
  return out;
}

const camelKey = (k) => k.replace(/[._-]([a-zA-Z0-9])/g, (_, c) => c.toUpperCase());
const write = (file, content) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, content); };

for (const l of LOCALES) {
  write(join(pkg, 'dist', `${l}.json`), JSON.stringify(Object.fromEntries(keys.map((k) => [k, source[l][k].message])), null, 2) + '\n');
  const arb = { '@@locale': l, '@@x-generated': 'packages/i18n/scripts/build.mjs — edit packages/i18n/messages instead' };
  for (const k of keys) {
    const id = camelKey(k);
    arb[id] = toFlutter(source[l][k].message);
    if (l === 'en') {
      const meta = {};
      if (source.en[k].description) meta.description = source.en[k].description;
      if (args[k].size) meta.placeholders = Object.fromEntries([...args[k]].map(([n, t]) => [n, { type: t }]));
      arb[`@${id}`] = meta;
    }
  }
  write(join(repo, 'apps', 'mobile', 'lib', 'l10n', `app_${l}.arb`), JSON.stringify(arb, null, 2) + '\n');
}

const flagged = keys.filter((k) => source.ar[k].review);
write(join(pkg, 'REVIEW.md'), `# Arabic strings flagged for native-speaker review

GENERATED by \`packages/i18n/scripts/build.mjs\`. Each row is a string where the wording, terminology
or tone should be confirmed by a native Arabic speaker familiar with Saudi business usage before
release. To clear a flag, remove \`"review"\` from the entry in \`messages/ar.json\`.

| Key | English | Arabic | Why it is flagged |
|---|---|---|---|
${flagged.map((k) => `| \`${k}\` | ${source.en[k].message.replaceAll('|', '\\|')} | ${source.ar[k].message.replaceAll('|', '\\|')} | ${source.ar[k].review} |`).join('\n')}
`);

console.log(`✔ i18n built — ${keys.length} messages × ${LOCALES.length} locales, ICU + Arabic plural forms validated; ${flagged.length} Arabic strings flagged for review`);

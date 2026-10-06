import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { COMBOS, Section } from './combo';

/** Flutter golden-test renders of the mobile components, one per combination. */
export function MobileSection() {
  const { t } = useT();
  const [missing, setMissing] = useState(false);
  return (
    <Section id="mobile" title={t('ds.mobile')} description={missing ? t('ds.c.mobileMissing') : t('ds.c.mobileNote')}>
      <div className="grid gap-8 xl:grid-cols-2">
        {COMBOS.map((c) => (
          <figure key={c.key} className="m-0">
            <figcaption className="mb-2 text-label-sm text-fg-muted">{t(c.label)}</figcaption>
            <img
              src={`${import.meta.env.BASE_URL}ds/mobile/${c.key}.png`}
              alt={`${t('ds.mobile')} — ${t(c.label)}`}
              loading="lazy"
              onError={() => setMissing(true)}
              className="w-full rounded-xl border border-line bg-sunken"
            />
          </figure>
        ))}
      </div>
    </Section>
  );
}

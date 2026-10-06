import { ExternalLink, IdCard, KeyRound, Lock, Sparkles } from 'lucide-react';
import { useAuthMethods } from '@/app/demo';
import { type FormEvent, useState } from 'react';
import { useErrorText } from '@/app/page';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Logo } from '@/components/ui/logo';
import { useAuth } from '@/lib/auth';
import { useLocaleSettings, useT } from '@/lib/i18n';

export function LoginPage() {
  const { t } = useT();
  const { locale } = useLocaleSettings();
  const auth = useAuth();
  const errorText = useErrorText();
  const [id, setId] = useState('');
  const [secret, setSecret] = useState('');
  const [mode, setMode] = useState<'password' | 'code'>('password');
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const methods = useAuthMethods();
  const demo = methods.data?.demo;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(undefined);
    try {
      await fn();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'password') return run(() => auth.loginWithPassword(id.trim(), secret));
    if (!codeSent) return run(async () => { setDevCode(await auth.requestOtp(id.trim())); setCodeSent(true); });
    return run(() => auth.loginWithOtp(id.trim(), secret.trim()));
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo kind={locale === 'ar' ? 'wordmark-ar' : 'wordmark'} height={52} /></div>
        {demo ? (
          <section aria-labelledby="demo-title" className="mb-4 rounded-xl border border-brand bg-brand-subtle p-5">
            <h2 id="demo-title" className="flex items-center gap-2 text-subtitle text-fg"><Sparkles aria-hidden className="size-4 text-brand" />{t('demo.loginTitle')}</h2>
            <p className="mt-1 text-body text-fg-muted">{t('demo.loginBody')}</p>
            <Button className="mt-4 w-full" size="lg" loading={busy} onClick={() => run(() => auth.loginWithPassword(demo.adminId, demo.password))}>{t('demo.signIn')}</Button>
            <p className="mt-2 text-center text-caption text-fg-muted"><bdi dir="ltr">{t('demo.credentials', { id: demo.adminId, password: demo.password })}</bdi></p>
          </section>
        ) : null}
        <form onSubmit={submit} className="rounded-xl border border-line bg-surface p-6 shadow-md sm:p-8" noValidate>
          <h1 className="text-title-lg text-fg">{t('portal.signInTitle')}</h1>
          <p className="mt-1 text-body text-fg-muted">{t('portal.signInBody')}</p>
          <div className="mt-6 flex flex-col gap-4">
            <TextField label={t('field.employeeId')} icon={IdCard} ltrValue autoComplete="username" value={id} onChange={(e) => setId(e.target.value)} required />
            {mode === 'password' ? (
              <TextField label={t('field.password')} icon={Lock} ltrValue type="password" autoComplete="current-password" value={secret} onChange={(e) => setSecret(e.target.value)} required />
            ) : codeSent ? (
              <TextField label={t('auth.codeLabel')} icon={KeyRound} ltrValue inputMode="numeric" autoComplete="one-time-code" value={secret} onChange={(e) => setSecret(e.target.value)} hint={devCode ? t('auth.devCode', { code: devCode }) : t('auth.codeSent')} />
            ) : null}
            {error ? <p role="alert" className="text-body text-status-absent-fg">{error}</p> : null}
            <Button type="submit" size="lg" loading={busy} disabled={!id.trim()}>{mode === 'code' && !codeSent ? t('auth.sendCode') : t('auth.signIn')}</Button>
            {methods.data?.otp ? (
              <Button type="button" variant="ghost" onClick={() => { setMode(mode === 'password' ? 'code' : 'password'); setCodeSent(false); setSecret(''); setError(undefined); }}>
                {mode === 'password' ? t('auth.useCode') : t('auth.usePassword')}
              </Button>
            ) : methods.data ? <p className="text-center text-caption text-fg-muted">{t('auth.forgotAdmin')}</p> : null}
          </div>
        </form>
        {demo ? (
          <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-caption text-fg-muted">
            <a className="inline-flex items-center gap-1 text-brand-fg underline-offset-2 hover:underline" href={demo.ownerUrl} target="_blank" rel="noopener">{t('demo.builtBy')}<ExternalLink aria-hidden className="size-3" /></a>
            <a className="inline-flex items-center gap-1 text-brand-fg underline-offset-2 hover:underline" href={demo.repoUrl} target="_blank" rel="noopener">{t('demo.source')}<ExternalLink aria-hidden className="size-3" /></a>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ChangePasswordPage() {
  const { t } = useT();
  const auth = useAuth();
  const errorText = useErrorText();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4">
      <form
        className="w-full max-w-md rounded-xl border border-line bg-surface p-8 shadow-md"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(undefined);
          try { await auth.changePassword(current, next); } catch (err) { setError(errorText(err)); } finally { setBusy(false); }
        }}
      >
        <h1 className="text-title-lg text-fg">{t('auth.changeTitle')}</h1>
        <p className="mt-1 text-body text-fg-muted">{t('auth.changeBody')}</p>
        <div className="mt-6 flex flex-col gap-4">
          <TextField label={t('auth.currentPassword')} type="password" ltrValue value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          <TextField label={t('auth.newPassword')} type="password" ltrValue value={next} onChange={(e) => setNext(e.target.value)} hint={t('auth.passwordRule')} autoComplete="new-password" />
          {error ? <p role="alert" className="text-body text-status-absent-fg">{error}</p> : null}
          <Button type="submit" size="lg" loading={busy}>{t('auth.saveContinue')}</Button>
          <Button type="button" variant="ghost" onClick={() => void auth.logout()}>{t('auth.signOut')}</Button>
        </div>
      </form>
    </div>
  );
}

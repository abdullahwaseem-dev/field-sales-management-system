import { Copy, KeyRound } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { TextField } from '@/components/ui/field';
import { useT } from '@/lib/i18n';

export interface Credentials { employeeId: string; name: string; password: string; mustChange: boolean }
export interface PasswordChoice { password: string; mustChange: boolean }

/** A strong, readable password: letters and digits, no look-alikes (0/O, 1/l/I). */
export function generatePassword() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const pick = (set: string, n: number) => Array.from(crypto.getRandomValues(new Uint32Array(n)), (x) => set[x % set.length]).join('');
  return `Zona-${pick(letters, 4)}${pick(digits, 4)}${pick(letters, 2)}`;
}
export const isStrongPassword = (p: string) => p.length >= 10 && /[A-Za-z]/.test(p) && /[0-9]/.test(p);

/** Password the administrator sets for a rep: typed or generated, plus whether to force a change. */
export function PasswordFields({ value, onChange }: { value: PasswordChoice; onChange: (v: PasswordChoice) => void }) {
  const { t } = useT();
  const id = useId();
  const weak = value.password.length > 0 && !isStrongPassword(value.password);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <TextField
          className="flex-1" label={t('field.password')} icon={KeyRound} ltrValue autoComplete="new-password" spellCheck={false}
          value={value.password} onChange={(e) => onChange({ ...value, password: e.target.value })}
          hint={t('auth.passwordRule')} error={weak ? t('error.PASSWORD_WEAK') : undefined} required
        />
        <Button type="button" variant="secondary" className="mt-7" onClick={() => onChange({ ...value, password: generatePassword() })}>{t('cred.generate')}</Button>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id={id} checked={value.mustChange} onCheckedChange={(c) => onChange({ ...value, mustChange: c === true })} />
        <label htmlFor={id} className="text-body text-fg">{t('cred.askChange')}</label>
      </div>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="mb-1 text-label text-fg-muted">{label}</p>
      <div className="flex items-center gap-2">
        <code dir="ltr" className="flex-1 select-all rounded-md border border-line bg-sunken px-3 py-2 font-mono text-subtitle text-fg">{value}</code>
        <Button variant="secondary" onClick={() => void navigator.clipboard.writeText(value).then(() => setCopied(true))}>
          <Copy aria-hidden />{copied ? t('portal.copied') : t('portal.copy')}
        </Button>
      </div>
    </div>
  );
}

/** Shows sign-in details once, right after the administrator creates an account or resets a password. */
export function CredentialsDialog({ value, onClose }: { value: Credentials | null; onClose: () => void }) {
  const { t } = useT();
  return (
    <Dialog open={!!value} onOpenChange={(o) => !o && onClose()}>
      {value ? (
        <DialogContent title={t('cred.title')} description={t('cred.body', { name: value.name })} footer={<Button onClick={onClose}>{t('action.close')}</Button>}>
          <div className="flex flex-col gap-4">
            <CopyRow label={t('field.employeeId')} value={value.employeeId} />
            <CopyRow label={t('field.password')} value={value.password} />
            <p className="text-body text-fg-muted">{t(value.mustChange ? 'cred.mustChange' : 'cred.keep')}</p>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

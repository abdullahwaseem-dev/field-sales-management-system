import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Archive, Pencil, Plus, Send, Undo2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader, useErrorText } from '@/app/page';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { TextAreaField, TextField } from '@/components/ui/field';
import { SelectField } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { type MessageId, useFormat, useLocaleSettings, useT } from '@/lib/i18n';

interface Product {
  product_id: string; item_type: 'product' | 'offer' | 'promo'; category_id: string | null; category_en: string | null; category_ar: string | null;
  name_en: string; name_ar: string; description_en: string; description_ar: string; valid_from: string | null; valid_to: string | null;
  status: 'draft' | 'published' | 'archived'; shares: number;
}

function ProductForm({ initial, onDone }: { initial?: Product; onDone: () => void }) {
  const { t } = useT();
  const ar = useLocaleSettings().locale === 'ar';
  const { push } = useToast();
  const errorText = useErrorText();
  const qc = useQueryClient();
  const cats = useQuery({ queryKey: ['categories'], queryFn: () => api<{ category_id: string; name_en: string; name_ar: string }[]>('/admin/categories') });
  const [v, setV] = useState({
    itemType: initial?.item_type ?? 'product', categoryId: initial?.category_id ?? 'none', nameEn: initial?.name_en ?? '', nameAr: initial?.name_ar ?? '',
    descriptionEn: initial?.description_en ?? '', descriptionAr: initial?.description_ar ?? '', validFrom: initial?.valid_from ?? '', validTo: initial?.valid_to ?? '',
  });
  const set = (k: keyof typeof v) => (x: string) => setV((s) => ({ ...s, [k]: x }));
  const save = useMutation({
    mutationFn: () => {
      const body = { ...v, categoryId: v.categoryId === 'none' ? null : v.categoryId, validFrom: v.validFrom || null, validTo: v.validTo || null };
      return initial ? api(`/admin/products/${initial.product_id}`, { method: 'PATCH', body }) : api('/admin/products', { body });
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['products'] }); onDone(); },
    onError: (e) => push({ variant: 'danger', title: errorText(e) }),
  });
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <SelectField label={t('portal.itemType')} placeholder={t('portal.itemType')} value={v.itemType} onValueChange={set('itemType')} options={(['product', 'offer', 'promo'] as const).map((x) => ({ value: x, label: t(`portal.type.${x}`) }))} />
      <SelectField label={t('portal.category')} placeholder={t('portal.category')} value={v.categoryId} onValueChange={set('categoryId')} options={[{ value: 'none', label: '—' }, ...(cats.data ?? []).map((c) => ({ value: c.category_id, label: ar ? c.name_ar : c.name_en }))]} />
      <TextField label={t('portal.nameEn')} lang="en" value={v.nameEn} onChange={(e) => set('nameEn')(e.target.value)} required />
      <TextField label={t('portal.nameAr')} lang="ar" dir="rtl" value={v.nameAr} onChange={(e) => set('nameAr')(e.target.value)} required />
      <TextAreaField label={t('portal.descriptionEn')} lang="en" rows={4} value={v.descriptionEn} onChange={(e) => set('descriptionEn')(e.target.value)} />
      <TextAreaField label={t('portal.descriptionAr')} lang="ar" dir="rtl" rows={4} value={v.descriptionAr} onChange={(e) => set('descriptionAr')(e.target.value)} />
      <TextField label={t('portal.validFrom')} type="date" ltrValue value={v.validFrom} onChange={(e) => set('validFrom')(e.target.value)} optional />
      <TextField label={t('portal.validTo')} type="date" ltrValue value={v.validTo} onChange={(e) => set('validTo')(e.target.value)} optional />
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="ghost" onClick={onDone}>{t('action.cancel')}</Button>
        <Button type="submit" loading={save.isPending} disabled={!v.nameEn || !v.nameAr}>{t('action.save')}</Button>
      </div>
    </form>
  );
}

const STATUS_STYLE = { draft: 'bg-sunken text-fg-muted', published: 'bg-status-present-bg text-status-present-fg', archived: 'bg-sunken text-fg-disabled' };

export function MarketingPage() {
  const { t } = useT();
  const f = useFormat();
  const ar = useLocaleSettings().locale === 'ar';
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Product | 'new' | null>(null);
  const list = useQuery({ queryKey: ['products'], queryFn: () => api<Product[]>('/admin/products') });
  const setStatus = (p: Product, status: Product['status']) => api(`/admin/products/${p.product_id}/status`, { body: { status } }).then(() => qc.invalidateQueries({ queryKey: ['products'] }));
  const columns = useMemo<ColumnDef<Product, unknown>[]>(() => [
    { id: 'name', accessorFn: (r) => (ar ? r.name_ar : r.name_en), meta: { label: t('table.employee') }, header: t('portal.products'), cell: ({ row: { original: r } }) => <span><span className="block text-label text-fg">{ar ? r.name_ar : r.name_en}</span><span className="block max-w-md truncate text-caption text-fg-muted">{ar ? r.description_ar : r.description_en}</span></span> },
    { id: 'type', accessorFn: (r) => t(`portal.type.${r.item_type}` as MessageId), meta: { label: t('portal.itemType') }, header: t('portal.itemType') },
    { id: 'category', accessorFn: (r) => (ar ? r.category_ar : r.category_en) ?? '—', meta: { label: t('portal.category') }, header: t('portal.category') },
    { id: 'valid', accessorFn: (r) => r.valid_to ?? '', meta: { label: t('portal.validTo'), numeric: true }, header: t('portal.validTo'), cell: ({ row: { original: r } }) => (r.valid_to ? f.day(r.valid_to) : '—') },
    { id: 'shares', accessorFn: (r) => Number(r.shares), meta: { label: t('portal.shares'), numeric: true }, header: t('portal.shares'), cell: ({ getValue }) => f.number(getValue() as number) },
    { id: 'status', accessorKey: 'status', meta: { label: t('portal.status') }, header: t('portal.status'), cell: ({ row: { original: r } }) => <span className={cn('rounded-full px-2.5 py-0.5 text-label-sm', STATUS_STYLE[r.status])}>{t(`portal.content.${r.status}` as MessageId)}</span> },
  ], [ar, f, t]);
  return (
    <>
      <PageHeader title={t('nav.marketing')} description={t('portal.products')} actions={<Button onClick={() => setEdit('new')}><Plus aria-hidden />{t('portal.newProduct')}</Button>} />
      <DataTable
        data={list.data ?? []}
        loading={list.isLoading}
        columns={columns}
        getRowId={(r) => r.product_id}
        rowLabel={(r) => (ar ? r.name_ar : r.name_en)}
        searchText={(r) => `${r.name_en} ${r.name_ar}`}
        caption={t('portal.products')}
        maxHeight="calc(100dvh - 16rem)"
        rowActions={(row) => (
          <>
            <DropdownMenuItem onSelect={() => setEdit(row.original)}><Pencil aria-hidden />{t('portal.editProduct')}</DropdownMenuItem>
            {row.original.status !== 'published' ? <DropdownMenuItem onSelect={() => void setStatus(row.original, 'published')}><Send aria-hidden />{t('portal.publish')}</DropdownMenuItem> : <DropdownMenuItem onSelect={() => void setStatus(row.original, 'draft')}><Undo2 aria-hidden />{t('portal.unpublish')}</DropdownMenuItem>}
            {row.original.status !== 'archived' ? <DropdownMenuItem tone="danger" onSelect={() => void setStatus(row.original, 'archived')}><Archive aria-hidden />{t('portal.archive')}</DropdownMenuItem> : null}
          </>
        )}
      />
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        {edit ? <DialogContent title={edit === 'new' ? t('portal.newProduct') : t('portal.editProduct')} className="max-w-2xl"><ProductForm initial={edit === 'new' ? undefined : edit} onDone={() => setEdit(null)} /></DialogContent> : null}
      </Dialog>
    </>
  );
}

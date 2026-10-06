import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type Row,
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3, Ellipsis, SearchX, Search } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from './dropdown-menu';
import { EmptyState, SkeletonRows } from './states';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    /** Header label (also used in the column picker). */
    label: string;
    /** Numeric/time columns align to the inline end and use tabular figures. */
    numeric?: boolean;
    /** Hidden from the column picker (selection, actions). */
    fixed?: boolean;
    /** Phantom use of the generics so the augmentation matches TanStack's declaration. */
    _types?: [TData, TValue];
  }
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  getRowId: (row: T) => string;
  /** Text matched by the global search (name, ID, team…). */
  searchText: (row: T) => string;
  rowLabel: (row: T) => string;
  rowActions?: (row: Row<T>) => ReactNode;
  bulkActions?: (rows: T[]) => ReactNode;
  caption: string;
  loading?: boolean;
  maxHeight?: string;
}

export function DataTable<T>({ data, columns, getRowId, searchText, rowLabel, rowActions, bulkActions, caption, loading, maxHeight = '28rem' }: DataTableProps<T>) {
  const { t } = useT();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const allColumns = useMemo<ColumnDef<T, unknown>[]>(() => [
    {
      id: '_select',
      meta: { label: t('action.selectAll'), fixed: true },
      enableSorting: false,
      header: ({ table }) => (
        <Checkbox
          aria-label={t('action.selectAll')}
          checked={table.getIsAllRowsSelected() ? true : table.getIsSomeRowsSelected() ? 'indeterminate' : false}
          onCheckedChange={(v) => table.toggleAllRowsSelected(v === true)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox aria-label={t('action.selectRow', { name: rowLabel(row.original) })} checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(v === true)} />
      ),
    },
    ...columns,
    ...(rowActions
      ? [{
          id: '_actions',
          meta: { label: t('action.actions'), fixed: true },
          enableSorting: false,
          header: () => <span className="sr-only">{t('action.actions')}</span>,
          cell: ({ row }) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`${t('action.actions')}: ${rowLabel(row.original)}`}>
                  <Ellipsis aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>{rowActions(row)}</DropdownMenuContent>
            </DropdownMenu>
          ),
        } satisfies ColumnDef<T, unknown>]
      : []),
  ], [columns, rowActions, rowLabel, t]);

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting, globalFilter, rowSelection, columnVisibility },
    getRowId,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _id, value: string) => searchText(row.original).toLocaleLowerCase().includes(value.toLocaleLowerCase()),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const selected = table.getSelectedRowModel().rows.map((r) => r.original);
  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
        {selected.length > 0 ? (
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <span className="text-label text-fg" aria-live="polite">{t('table.selected', { count: selected.length })}</span>
            {bulkActions?.(selected)}
          </div>
        ) : (
          <label className="relative flex-1 min-w-48">
            <span className="sr-only">{t('field.searchLabel')}</span>
            <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-(--zona-size-icon-sm) -translate-y-1/2 text-fg-muted" />
            <input
              type="search"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              className="h-9 w-full max-w-80 rounded-md border border-line bg-canvas ps-9 pe-3 text-body text-fg placeholder:text-fg-muted focus-visible:outline-2 focus-visible:outline-focus"
            />
          </label>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              <Columns3 aria-hidden />
              {t('action.columns')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{t('action.columns')}</DropdownMenuLabel>
            {table.getAllLeafColumns().filter((c) => !c.columnDef.meta?.fixed).map((c) => (
              <DropdownMenuCheckboxItem key={c.id} checked={c.getIsVisible()} onCheckedChange={(v) => c.toggleVisibility(v === true)}>
                {c.columnDef.meta?.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-auto" style={{ maxHeight }}>
        {loading ? (
          <div className="p-4"><SkeletonRows rows={5} /></div>
        ) : (
          <table className="w-full border-separate border-spacing-0 text-body">
            <caption className="sr-only">{caption}</caption>
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => {
                    const meta = h.column.columnDef.meta;
                    const sort = h.column.getIsSorted();
                    const SortIcon = sort === 'asc' ? ArrowUp : sort === 'desc' ? ArrowDown : ChevronsUpDown;
                    return (
                      <th
                        key={h.id}
                        scope="col"
                        aria-sort={sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : undefined}
                        className={cn(
                          'sticky top-0 z-10 h-10 whitespace-nowrap border-b border-line bg-sunken px-3 text-start text-label-sm text-fg-muted',
                          meta?.numeric && 'text-end',
                          (h.column.id === '_select' || h.column.id === '_actions') && 'w-12',
                        )}
                      >
                        {h.column.getCanSort() ? (
                          <button
                            type="button"
                            onClick={h.column.getToggleSortingHandler()}
                            className={cn('-mx-1.5 inline-flex h-8 items-center gap-1 rounded-sm px-1.5 hover:text-fg focus-visible:outline-2 focus-visible:outline-focus', meta?.numeric && 'flex-row-reverse')}
                          >
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            <SortIcon aria-hidden className={cn('size-3.5', !sort && 'opacity-60')} />
                            <span className="sr-only">{sort === 'asc' ? t('table.sortAsc') : sort === 'desc' ? t('table.sortDesc') : t('table.notSorted')}</span>
                          </button>
                        ) : (
                          flexRender(h.column.columnDef.header, h.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} data-selected={row.getIsSelected() || undefined} className="group hover:bg-canvas data-selected:bg-brand-subtle">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        'h-14 whitespace-nowrap border-b border-line px-3 align-middle text-fg group-last:border-b-0',
                        cell.column.columnDef.meta?.numeric && 'text-end tabular-nums',
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && rows.length === 0 ? <EmptyState icon={SearchX} title={t('state.noResults')} body={t('state.noResultsBody')} /> : null}
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-caption text-fg-muted">
        <span>{t('table.rows', { count: rows.length })}</span>
      </div>
    </div>
  );
}

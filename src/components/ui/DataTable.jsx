import { useState } from 'react';
import { Search } from 'lucide-react';

/**
 * Komponen Tabel Reusable (DataTable) — Patuh DESIGN-SYSTEM.md
 * Fitur:
 * - Pencarian langsung saat mengetik (tanpa tombol Cari & tanpa tombol Reset)
 * - Kolom pencarian memiliki padding/jarak ikon yang rapi (tidak menabrak teks)
 * - Sortir klik pada header kolom (sortable: true)
 * - Pagination otomatis di bagian bawah tabel
 * - Empty state kustom beserta slot aksi (emptyAction)
 */
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyText = 'Belum ada data ditemukan.',
  emptyAction = null,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari data...',
  filterSlot = null,
  pageSize = 10,
  serverPagination = null, // { currentPage, totalPages, totalItems, onPageChange }
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [clientPage, setClientPage] = useState(1);

  const showToolbar = typeof onSearchChange === 'function' || filterSlot;

  const handleSort = (col) => {
    if (!col.sortable) return;
    setSortConfig((prev) => {
      if (prev.key === col.key) {
        return {
          key: col.key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key: col.key, direction: 'asc' };
    });
  };

  // Urutkan data berdasarkan kolom yang dipilih
  const sortedData = (() => {
    if (!sortConfig.key) return data;
    const targetCol = columns.find((c) => c.key === sortConfig.key);
    if (!targetCol) return data;

    return [...data].sort((a, b) => {
      const valA =
        typeof targetCol.sortValue === 'function'
          ? targetCol.sortValue(a)
          : a[sortConfig.key] ?? '';
      const valB =
        typeof targetCol.sortValue === 'function'
          ? targetCol.sortValue(b)
          : b[sortConfig.key] ?? '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  })();

  // Hitung Pagination (dukung Server-Side maupun Client-Side)
  const isServerPaginated = Boolean(serverPagination);
  const totalItems = isServerPaginated
    ? serverPagination.totalItems
    : sortedData.length;
  const totalPages = isServerPaginated
    ? Math.max(1, serverPagination.totalPages)
    : Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = isServerPaginated
    ? Math.min(serverPagination.currentPage, totalPages)
    : Math.min(clientPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedData = isServerPaginated
    ? sortedData
    : sortedData.slice(startIndex, startIndex + pageSize);

  const changePage = (nextPage) => {
    if (isServerPaginated && serverPagination.onPageChange) {
      serverPagination.onPageChange(nextPage);
    } else {
      setClientPage(nextPage);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
      {/* Toolbar Pencarian (Dengan Padding p-lg & Jarak Ikon-Input gap-sm) */}
      {showToolbar && (
        <div className="p-lg border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-md">
          {typeof onSearchChange === 'function' && (
            <div className="w-full max-w-[420px] min-h-[48px] px-lg py-xs bg-white border border-border rounded-md flex items-center gap-sm focus-within:border-primary transition-colors">
              <Search size={16} strokeWidth={2} className="text-text-disabled shrink-0" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue || ''}
                onChange={(e) => {
                  changePage(1);
                  onSearchChange(e.target.value);
                }}
                className="w-full bg-transparent border-none text-sm text-text placeholder:text-text-disabled focus:outline-none"
              />
            </div>
          )}

          {filterSlot && <div className="flex items-center gap-sm">{filterSlot}</div>}
        </div>
      )}

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-background border-b border-border text-text-secondary text-xs font-semibold uppercase tracking-wider">
              {columns.map((col) => {
                const isSorted = sortConfig.key === col.key;
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => handleSort(col)}
                    className={`py-md px-lg select-none ${
                      col.sortable
                        ? 'cursor-pointer hover:text-navy transition-colors'
                        : ''
                    } ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-flex items-center gap-xs ${
                        col.align === 'right' ? 'justify-end' : ''
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="inline-flex flex-col text-text-disabled">
                          {isSorted ? (
                            sortConfig.direction === 'asc' ? (
                              <span className="text-primary font-bold">&#9650;</span>
                            ) : (
                              <span className="text-primary font-bold">&#9660;</span>
                            )
                          ) : (
                            <span className="opacity-50">&#8693;</span>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  className="py-xxl px-lg text-center text-text-secondary"
                >
                  Memuat data...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  className="py-xxl px-lg text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-md">
                    <p className="text-sm text-text-secondary">{emptyText}</p>
                    {emptyAction && (
                      <div className="flex flex-wrap items-center justify-center gap-sm">
                        {emptyAction}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const absoluteIndex = startIndex + idx;
                return (
                  <tr
                    key={row.id ?? absoluteIndex}
                    className="hover:bg-background/60 transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`py-md px-lg ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        }`}
                      >
                        {typeof col.render === 'function'
                          ? col.render(row, absoluteIndex)
                          : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      {!loading && totalItems > 0 && (
        <div className="p-lg border-t border-border bg-surface flex flex-col sm:flex-row items-center justify-between gap-md text-xs text-text-secondary">
          <div>
            Menampilkan{' '}
            <strong className="text-text">{startIndex + 1}</strong>
            {' '}&ndash;{' '}
            <strong className="text-text">
              {Math.min(startIndex + pageSize, totalItems)}
            </strong>{' '}
            dari <strong className="text-text">{totalItems}</strong> data
          </div>

          <div className="flex items-center gap-xs">
            <button
              type="button"
              onClick={() => changePage(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
              className="min-h-[36px] px-md py-xs rounded-sm border border-border bg-surface hover:bg-background disabled:opacity-50 text-text text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>

            <span className="px-md py-xs font-semibold text-navy">
              Halaman {safePage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => changePage(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
              className="min-h-[36px] px-md py-xs rounded-sm border border-border bg-surface hover:bg-background disabled:opacity-50 text-text text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

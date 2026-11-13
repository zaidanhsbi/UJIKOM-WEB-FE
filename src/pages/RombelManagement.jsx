import { useState, useRef, useEffect } from 'react';
import { Plus, Upload, ChevronDown } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import AlertBanner from '../components/ui/AlertBanner';
import FormSelect from '../components/ui/FormSelect';
import SubjectImportModal from '../features/subjects/SubjectImportModal';
import {
  fetchRombelsApi,
  createRombelApi,
  bulkImportRombelsApi,
  updateRombelApi,
  deleteRombelApi,
} from '../services/rombel.service';
import {
  parseRombelImportFile,
  downloadRombelExcelTemplate,
  downloadRombelWordTemplate,
} from '../utils/entityImportParser';
import { useDebounce } from '../hooks/useDebounce';
import { useAcademicYears } from '../hooks/useAcademicYears';

/** Halaman manajemen data rombongan belajar (rombel) oleh Admin. */
export default function RombelManagement({
  user,
  currentPath,
  onNavigate,
  onLogout,
}) {
  const { uniqueAcademicYears, activeAcademicYear } = useAcademicYears({
    onUnauthorized: onLogout,
  });
  const [rombels, setRombels] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pageBanner, setPageBanner] = useState(null);

  const [importDropdownOpen, setImportDropdownOpen] = useState(false);
  const importDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importingFile, setImportingFile] = useState(false);
  const [selectedImportFileName, setSelectedImportFileName] = useState('');
  const [importModalBanner, setImportModalBanner] = useState(null);
  const [importRowResults, setImportRowResults] = useState([]);
  const [importSummary, setImportSummary] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingRombelId, setEditingRombelId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formAcademicYearId, setFormAcademicYearId] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [formErrorGeneral, setFormErrorGeneral] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const restrictedMode = user?.license?.is_restricted || false;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        importDropdownRef.current &&
        !importDropdownRef.current.contains(event.target)
      ) {
        setImportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadRombels = async (keyword = debouncedSearch, targetPage = page) => {
    setLoading(true);
    try {
      const res = await fetchRombelsApi(keyword, {
        page: targetPage,
        perPage: 10,
      });
      const items = res.items || res.data || [];
      setRombels(items);
      setPaginationMeta({
        current_page: res.meta?.current_page || 1,
        last_page: res.meta?.last_page || 1,
        total: res.meta?.total ?? items.length,
      });
    } catch (err) {
      if (err.status === 401) {
        onLogout();
        return;
      }
      setPageBanner({
        variant: 'error',
        message: err.message || 'Gagal memuat data kelas / rombel.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRombels(debouncedSearch, page);
  }, [debouncedSearch, page]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingRombelId(null);
    setFormName('');
    setFormAcademicYearId(
      activeAcademicYear?.id ? String(activeAcademicYear.id) : ''
    );
    setFormErrors({});
    setFormErrorGeneral('');
    setIsModalOpen(true);
  };

  const openEditModal = (rombel) => {
    setModalMode('edit');
    setEditingRombelId(rombel.id);
    setFormName(rombel.name || '');
    const ayId =
      rombel.academic_year_id ||
      (typeof rombel.academic_year === 'object' && rombel.academic_year?.id) ||
      activeAcademicYear?.id ||
      '';
    setFormAcademicYearId(ayId ? String(ayId) : '');
    setFormErrors({});
    setFormErrorGeneral('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
  };

  const handleSaveRombel = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setFormErrorGeneral('');

    const normalizedName = formName.trim();
    if (!normalizedName) {
      setFormErrors({ name: ['Nama kelas / rombel wajib diisi.'] });
      return;
    }

    setSubmitting(true);
    try {
      const academicYearIdPayload =
        formAcademicYearId ||
        (activeAcademicYear?.id ? String(activeAcademicYear.id) : '');
      if (modalMode === 'add') {
        const res = await createRombelApi({
          name: normalizedName,
          academic_year_id: academicYearIdPayload,
        });
        setPageBanner({
          variant: 'success',
          message: res.message || 'Kelas / Rombel berhasil ditambahkan.',
        });
      } else {
        const res = await updateRombelApi(editingRombelId, {
          name: normalizedName,
          academic_year_id: academicYearIdPayload,
        });
        setPageBanner({
          variant: 'success',
          message: res.message || 'Kelas / Rombel berhasil diperbarui.',
        });
      }
      setIsModalOpen(false);
      await loadRombels(debouncedSearch, page);
    } catch (err) {
      if (err.status === 401) {
        onLogout();
        return;
      }
      if (err.errors) {
        setFormErrors(err.errors);
      }
      setFormErrorGeneral(err.message || 'Gagal menyimpan kelas / rombel.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRombel = async (rombel) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus kelas "${rombel.name}"?`
    );
    if (!confirmed) return;

    try {
      const res = await deleteRombelApi(rombel.id);
      setPageBanner({
        variant: 'success',
        message: res.message || 'Kelas / Rombel berhasil dihapus.',
      });
      await loadRombels(debouncedSearch, page);
    } catch (err) {
      if (err.status === 401) {
        onLogout();
        return;
      }
      setPageBanner({
        variant: 'error',
        message: err.message || 'Gagal menghapus kelas / rombel.',
      });
    }
  };

  const openImportModal = () => {
    setImportDropdownOpen(false);
    setSelectedImportFileName('');
    setImportModalBanner(null);
    setImportRowResults([]);
    setImportSummary(null);
    setIsImportModalOpen(true);
  };

  const closeImportModal = () => {
    if (importingFile) return;
    setIsImportModalOpen(false);
  };

  const handleDownloadExcelTemplate = () => {
    downloadRombelExcelTemplate(activeAcademicYear?.name || '2026/2027');
  };

  const handleDownloadWordTemplate = () => {
    downloadRombelWordTemplate();
  };

  const handleTriggerFileBrowser = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setSelectedImportFileName(file.name);
    setImportModalBanner(null);
    setImportRowResults([]);
    setImportSummary(null);
    setImportingFile(true);

    try {
      const parseResult = await parseRombelImportFile(file);

      if (parseResult.rowResults.length === 0) {
        setImportModalBanner({
          variant: 'error',
          title: 'Validasi File Gagal',
          message:
            parseResult.errors[0] ||
            'File tidak sesuai dengan struktur template Kelas / Rombel.',
          details: parseResult.errors.slice(1),
        });
        return;
      }

      if (parseResult.summary.errorCount > 0) {
        setImportRowResults(parseResult.rowResults);
        setImportSummary({
          imported: 0,
          skipped: parseResult.summary.skippedCount,
          errors: parseResult.summary.errorCount,
        });
        setImportModalBanner({
          variant: 'error',
          title: 'Terdapat Baris Error',
          message: `Ditemukan ${parseResult.summary.errorCount} baris tidak valid pada "${file.name}". Perbaiki baris yang ditandai Error di bawah ini lalu unggah kembali.`,
        });
        return;
      }

      if (parseResult.rombels.length === 0) {
        setImportRowResults(parseResult.rowResults);
        setImportSummary({
          imported: 0,
          skipped: parseResult.summary.skippedCount,
          errors: 0,
        });
        setImportModalBanner({
          variant: 'warning',
          title: 'Semua Baris Dilewati',
          message: `Seluruh ${parseResult.summary.skippedCount} baris kelas sudah terdaftar di sekolah Anda.`,
        });
        return;
      }

      const res = await bulkImportRombelsApi(
        parseResult.rombels,
        activeAcademicYear?.id || null
      );
      setImportRowResults(res.results || []);
      setImportSummary(res.summary || null);
      setImportModalBanner({
        variant: 'success',
        message: res.message || 'Import kelas / rombel selesai.',
      });
      await loadRombels(debouncedSearch, page);
    } catch (err) {
      if (err.status === 401) {
        onLogout();
        return;
      }
      setImportModalBanner({
        variant: 'error',
        message: err.message || 'Gagal mengimpor file kelas / rombel.',
      });
    } finally {
      setImportingFile(false);
    }
  };

  const columns = [
    {
      key: 'no',
      header: 'No',
      width: '72px',
      render: (_, index) => (
        <span className="font-medium text-text-secondary">{index + 1}</span>
      ),
    },
    {
      key: 'name',
      header: 'Nama Kelas / Rombel',
      render: (row) => (
        <span className="font-semibold text-text">{row.name}</span>
      ),
    },
    {
      key: 'academic_year',
      header: 'Tahun Ajaran',
      width: '180px',
      render: (row) => {
        const ay = row.academic_year;
        const label =
          typeof ay === 'object' && ay !== null
            ? ay.name
            : ay || '2026/2027';
        return (
          <span className="inline-block px-md py-xs rounded-pill bg-background border border-border text-text text-xs font-semibold">
            {label}
          </span>
        );
      },
    },
    {
      key: 'students_count',
      header: 'Jumlah Siswa',
      width: '180px',
      render: (row) => (
        <span className="inline-block px-md py-xs rounded-pill bg-soft-blue text-navy text-xs font-semibold">
          {row.students_count ?? 0} Siswa
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      width: '180px',
      render: (row) => (
        <div className="inline-flex items-center justify-end gap-xs">
          <button
            type="button"
            onClick={() => openEditModal(row)}
            disabled={restrictedMode}
            className="min-h-[36px] px-md py-xs rounded-sm border border-light-blue text-primary hover:bg-soft-blue text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDeleteRombel(row)}
            disabled={restrictedMode}
            className="min-h-[36px] px-md py-xs rounded-sm bg-alert-danger-bg hover:bg-coral text-alert-danger-text hover:text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Hapus
          </button>
        </div>
      ),
    },
  ];

  const emptyStateButtons = (
    <>
      <button
        type="button"
        onClick={openAddModal}
        disabled={restrictedMode}
        className="min-h-[36px] px-lg py-xs rounded-sm bg-primary hover:bg-blue disabled:bg-text-disabled text-white text-xs font-semibold inline-flex items-center gap-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        <span>+ Tambah Kelas / Rombel</span>
      </button>
      <button
        type="button"
        onClick={openImportModal}
        disabled={restrictedMode}
        className="min-h-[36px] px-lg py-xs rounded-sm border border-border bg-surface hover:bg-background text-navy text-xs font-semibold inline-flex items-center gap-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        <span>Import Excel (.xlsx)</span>
      </button>
    </>
  );

  const filteredRombels = selectedAcademicYear
    ? rombels.filter((r) => {
        const ay = r.academic_year;
        const yearName =
          typeof ay === 'object' && ay !== null ? ay.name : ay || '2026/2027';
        return yearName === selectedAcademicYear;
      })
    : rombels;

  return (
    <AdminLayout
      user={user}
      currentPath={currentPath}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileSelected}
        className="hidden"
        aria-label="Unggah file Excel Kelas / Rombel"
      />

      <div className="flex flex-col gap-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
          <div>
            <h1 className="text-xl font-bold text-text leading-tight">
              Data Kelas / Rombel
            </h1>
            <p className="text-sm text-text-secondary mt-xs">
              Kelola daftar kelas / rombongan belajar dan tahun ajaran
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-sm shrink-0">
            <div className="relative" ref={importDropdownRef}>
              <button
                type="button"
                onClick={() => setImportDropdownOpen((prev) => !prev)}
                disabled={restrictedMode}
                className="min-h-[48px] px-lg bg-surface hover:bg-background border border-border text-navy font-semibold text-sm rounded-md transition-colors inline-flex items-center justify-center gap-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={16} strokeWidth={2} className="shrink-0" />
                <span>Import</span>
                <ChevronDown size={16} strokeWidth={2} className="shrink-0" />
              </button>

              {importDropdownOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-xs z-40 w-[240px] bg-surface border border-border rounded-md shadow-md p-xs flex flex-col gap-xxs">
                  <button
                    type="button"
                    onClick={openImportModal}
                    className="w-full text-left px-md py-sm rounded-sm text-sm text-text hover:bg-background font-medium cursor-pointer"
                  >
                    Import Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="w-full text-left px-md py-sm rounded-sm text-sm text-text hover:bg-background font-medium cursor-pointer"
                  >
                    Unduh Template Excel (.xlsx)
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={openAddModal}
              disabled={restrictedMode}
              className="min-h-[48px] px-xl bg-primary hover:bg-blue disabled:bg-text-disabled text-white font-semibold text-sm rounded-md transition-colors inline-flex items-center justify-center gap-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <Plus size={16} strokeWidth={2.2} className="shrink-0" />
              <span>Tambah Rombel</span>
            </button>
          </div>
        </div>

        {pageBanner && (
          <AlertBanner
            variant={pageBanner.variant}
            message={pageBanner.message}
            onClose={() => setPageBanner(null)}
          />
        )}

        <DataTable
          columns={columns}
          data={filteredRombels}
          loading={loading}
          emptyText="Belum ada data kelas / rombel ditemukan."
          emptyAction={emptyStateButtons}
          searchValue={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Ketik untuk mencari nama kelas / rombel..."
          filterSlot={
            <div className="flex items-center gap-sm">
              <label
                htmlFor="filter-rombel-year"
                className="text-xs font-semibold text-text-secondary shrink-0"
              >
                Tahun Ajaran:
              </label>
              <select
                id="filter-rombel-year"
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="h-[46px] px-md bg-white border border-border rounded-md text-md text-text focus:outline-none focus:border-primary cursor-pointer transition-colors"
              >
                <option value="">Semua Tahun</option>
                {uniqueAcademicYears.map((ay) => (
                  <option key={ay.id} value={ay.name}>
                    {ay.name}{ay.is_active ? ' - Aktif' : ''}
                  </option>
                ))}
              </select>
            </div>
          }
          pageSize={10}
          serverPagination={{
            currentPage: paginationMeta.current_page,
            totalPages: paginationMeta.last_page,
            totalItems: paginationMeta.total,
            onPageChange: handlePageChange,
          }}
        />
      </div>

      <SubjectImportModal
        isOpen={isImportModalOpen}
        title="Import Kelas / Rombel (Excel .xlsx)"
        step1Description={
          <>
            Gunakan format tabel standar agar sistem mengenali kolom{' '}
            <code>Nama Kelas / Rombel</code>.
          </>
        }
        step2Title="Langkah 2: Isi Data Kelas / Rombel"
        step2Description={
          <>
            Pastikan setiap <strong>Nama Kelas / Rombel</strong> unik dan belum
            terdaftar di sekolah Anda.
          </>
        }
        codeColumnLabel=""
        nameColumnLabel="Nama Kelas / Rombel"
        importingFile={importingFile}
        restrictedMode={restrictedMode}
        selectedImportFileName={selectedImportFileName}
        importModalBanner={importModalBanner}
        onClearModalBanner={() => setImportModalBanner(null)}
        importRowResults={importRowResults}
        importSummary={importSummary}
        onClose={closeImportModal}
        onDownloadExcelTemplate={handleDownloadExcelTemplate}
        onTriggerFileBrowser={handleTriggerFileBrowser}
      />

      <Modal
        isOpen={isModalOpen}
        title={
          modalMode === 'add' ? 'Tambah Kelas / Rombel' : 'Edit Kelas / Rombel'
        }
        onClose={closeModal}
      >
        <div className="flex flex-col gap-md">
          {formErrorGeneral && (
            <AlertBanner
              variant="error"
              message={formErrorGeneral}
              onClose={() => setFormErrorGeneral('')}
            />
          )}

          <form
            onSubmit={handleSaveRombel}
            className="flex flex-col gap-md"
            noValidate
          >
            <div>
              <label
                htmlFor="rombel-name"
                className="block text-sm font-semibold text-navy mb-xs"
              >
                Nama Kelas / Rombel
              </label>
              <input
                id="rombel-name"
                type="text"
                placeholder="Contoh: XII RPL 1"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={submitting}
                required
                className="w-full min-h-[48px] px-lg py-sm bg-white border border-border rounded-md text-sm text-text placeholder:text-text-disabled focus:outline-none focus:border-primary"
              />
              {formErrors.name && (
                <p className="mt-xxs text-xs font-medium text-error">
                  {formErrors.name[0]}
                </p>
              )}
            </div>

            <FormSelect
              id="rombel-academic-year"
              label="Tahun Ajaran"
              value={formAcademicYearId}
              onChange={(e) => setFormAcademicYearId(e.target.value)}
              options={uniqueAcademicYears.map((ay) => ({
                value: String(ay.id),
                label: `${ay.name}${ay.is_active ? ' - Aktif' : ''}`,
              }))}
              disabled={submitting}
              required
            />

            <div className="mt-md flex items-center justify-end gap-sm">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="min-h-[44px] px-lg rounded-md border border-border bg-surface hover:bg-background text-sm font-semibold text-text-secondary cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[44px] px-xl rounded-md bg-primary hover:bg-blue disabled:bg-text-disabled text-white text-sm font-semibold cursor-pointer"
              >
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </AdminLayout>
  );
}

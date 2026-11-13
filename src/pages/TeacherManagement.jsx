import { useState, useRef, useEffect } from 'react';
import { Upload, ChevronDown, Plus, FileSpreadsheet, FileText } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/ui/DataTable';
import AlertBanner from '../components/ui/AlertBanner';
import SubjectImportModal from '../features/subjects/SubjectImportModal';
import TeacherFormModal from '../features/teachers/TeacherFormModal';
import { fetchSubjectsApi } from '../services/subject.service';
import { fetchRombelsApi } from '../services/rombel.service';
import {
  fetchTeachersApi,
  createTeacherApi,
  bulkImportTeachersApi,
  updateTeacherApi,
  deleteTeacherApi,
} from '../services/teacher.service';
import {
  parseTeacherImportFile,
  downloadTeacherExcelTemplate,
  downloadTeacherWordTemplate,
} from '../utils/entityImportParser';
import { useDebounce } from '../hooks/useDebounce';

const EMPTY_FORM = { username: '', name: '', password: '', subjectIds: [], rombelIds: [] };

function BadgeList({ items, emptyText }) {
  if (!items || items.length === 0) {
    return <span className="text-xs text-text-disabled">{emptyText}</span>;
  }
  return (
    <div className="flex flex-wrap gap-xxs">
      {items.map((item) => (
        <span
          key={item.id}
          className="inline-block px-md py-xs rounded-pill bg-soft-blue text-navy text-xs font-semibold"
        >
          {item.name}
        </span>
      ))}
    </div>
  );
}

/** Halaman manajemen data guru oleh Admin. */
export default function TeacherManagement({
  user,
  restrictedMode,
  currentPath = '/admin/guru',
  onNavigate,
  onLogout,
}) {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pageBanner, setPageBanner] = useState(null);

  // Dropdown Import di Header
  const [importDropdownOpen, setImportDropdownOpen] = useState(false);
  const importDropdownRef = useRef(null);

  // Modal Impor 3 Langkah
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importingFile, setImportingFile] = useState(false);
  const [selectedImportFileName, setSelectedImportFileName] = useState('');
  const [importModalBanner, setImportModalBanner] = useState(null);
  const [importRowResults, setImportRowResults] = useState([]);
  const [importSummary, setImportSummary] = useState(null);
  const fileInputRef = useRef(null);

  // Modal Tambah / Edit Guru
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [rombelOptions, setRombelOptions] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [formErrorGeneral, setFormErrorGeneral] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        importDropdownRef.current &&
        !importDropdownRef.current.contains(e.target)
      ) {
        setImportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadTeachers = async (keyword = debouncedSearch, targetPage = page) => {
    setLoading(true);
    try {
      const res = await fetchTeachersApi(keyword, {
        page: targetPage,
        perPage: 10,
      });
      setTeachers(res.items);
      setPaginationMeta(res.meta);
    } catch (err) {
      setPageBanner({
        variant: 'error',
        title: 'Gagal Memuat Data',
        message: err.message || 'Gagal memuat daftar guru.',
      });
      if (err.status === 401 && onLogout) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchTeachersApi(debouncedSearch, { page, perPage: 10 })
      .then((res) => {
        if (isMounted) {
          setTeachers(res.items);
          setPaginationMeta(res.meta);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setPageBanner({
          variant: 'error',
          title: 'Gagal Memuat Data',
          message: err.message || 'Gagal memuat daftar guru.',
        });
        if (err.status === 401 && onLogout) {
          onLogout();
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, page, onLogout]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
    setLoading(true);
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    setLoading(true);
  };

  // Opsi mapel & kelas dimuat saat modal dibuka agar selalu data terbaru
  const loadFormOptions = async () => {
    try {
      const [subjects, rombels] = await Promise.all([
        fetchSubjectsApi(''),
        fetchRombelsApi(''),
      ]);
      setSubjectOptions(subjects.map((s) => ({ id: s.id, label: s.name })));
      setRombelOptions(rombels.map((r) => ({ id: r.id, label: r.name })));
    } catch (err) {
      setFormErrorGeneral(err.message || 'Gagal memuat daftar mapel dan kelas.');
    }
  };

  const openFormModal = (mode, teacher = null) => {
    setModalMode(mode);
    setEditingTeacherId(teacher?.id ?? null);
    setForm(
      teacher
        ? {
            username: teacher.username || '',
            name: teacher.name || '',
            password: teacher.password_plain || '',
            subjectIds: (teacher.subjects || []).map((s) => s.id),
            rombelIds: (teacher.rombels || []).map((r) => r.id),
          }
        : EMPTY_FORM
    );
    setFormErrors({});
    setFormErrorGeneral('');
    setIsModalOpen(true);
    loadFormOptions();
  };

  const openAddModal = () => openFormModal('add');
  const openEditModal = (teacher) => openFormModal('edit', teacher);

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleItem = (field, id) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(id)
        ? prev[field].filter((x) => x !== id)
        : [...prev[field], id],
    }));
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setFormErrorGeneral('');

    if (!form.username.trim() || !form.name.trim()) {
      setFormErrorGeneral('Username / NUPTK dan Nama Guru wajib diisi.');
      return;
    }

    if (modalMode === 'add' && !form.password.trim()) {
      setFormErrorGeneral('Password wajib diisi untuk guru baru.');
      return;
    }

    setSubmitting(true);
    try {
      const res =
        modalMode === 'add'
          ? await createTeacherApi(form)
          : await updateTeacherApi(editingTeacherId, form);
      setPageBanner({
        variant: 'success',
        message:
          res.message ||
          (modalMode === 'add'
            ? 'Data guru berhasil ditambahkan.'
            : 'Data guru berhasil diperbarui.'),
      });
      setIsModalOpen(false);
      await loadTeachers(debouncedSearch, page);
    } catch (err) {
      if (err.errors && Object.keys(err.errors).length > 0) {
        setFormErrors(err.errors);
      }
      setFormErrorGeneral(err.message || 'Terjadi kesalahan saat menyimpan data guru.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (teacher) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus akun guru "${teacher.username}"?`
    );
    if (!confirmed) return;

    try {
      const res = await deleteTeacherApi(teacher.id);
      setPageBanner({
        variant: 'success',
        message: res.message || 'Data guru berhasil dihapus.',
      });
      await loadTeachers(debouncedSearch, page);
    } catch (err) {
      setPageBanner({
        variant: 'error',
        title: 'Gagal Menghapus',
        message: err.message || 'Gagal menghapus data guru.',
      });
    }
  };

  // Impor & Template
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

  const handleTriggerFileBrowser = () => {
    if (restrictedMode || importingFile) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleDownloadExcelTemplate = async () => {
    setImportDropdownOpen(false);
    try {
      await downloadTeacherExcelTemplate();
    } catch {
      setPageBanner({
        variant: 'error',
        message: 'Gagal mengunduh file template Excel Guru.',
      });
    }
  };

  const handleDownloadWordTemplate = () => {
    setImportDropdownOpen(false);
    try {
      downloadTeacherWordTemplate();
    } catch {
      setPageBanner({
        variant: 'error',
        message: 'Gagal mengunduh file template Word Guru.',
      });
    }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingFile(true);
    setSelectedImportFileName(file.name);
    setImportModalBanner(null);
    setImportRowResults([]);
    setImportSummary(null);

    try {
      const currentTeachers = await fetchTeachersApi('');
      const parseResult = await parseTeacherImportFile(file, currentTeachers);

      if (parseResult.rowResults.length === 0) {
        setImportModalBanner({
          variant: 'error',
          title: 'Validasi File Gagal',
          message:
            parseResult.errors[0] ||
            'File tidak sesuai dengan struktur template Guru.',
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

      if (parseResult.teachers.length === 0) {
        setImportRowResults(parseResult.rowResults);
        setImportSummary({
          imported: 0,
          skipped: parseResult.summary.skippedCount,
          errors: 0,
        });
        setImportModalBanner({
          variant: 'warning',
          title: 'Semua Baris Dilewati',
          message: `Seluruh ${parseResult.summary.skippedCount} baris NUPTK / Username guru sudah terdaftar di sekolah Anda.`,
        });
        return;
      }

      const response = await bulkImportTeachersApi(parseResult.teachers);
      const importedCount =
        response.imported_count ?? parseResult.summary.validCount;
      const skippedCount = parseResult.summary.skippedCount;

      const finalResults = parseResult.rowResults.map((r) =>
        r.status === 'berhasil'
          ? { ...r, reason: 'Berhasil disimpan ke database.' }
          : r
      );

      setImportRowResults(finalResults);
      setImportSummary({
        imported: importedCount,
        skipped: skippedCount,
        errors: 0,
      });

      setImportModalBanner({
        variant: skippedCount > 0 ? 'warning' : 'success',
        title: 'Impor Selesai',
        message: `${importedCount} guru berhasil diimpor, ${skippedCount} dilewati.`,
      });

      setPageBanner({
        variant: skippedCount > 0 ? 'warning' : 'success',
        message:
          skippedCount > 0
            ? `${importedCount} guru berhasil diimpor dari "${file.name}" (${skippedCount} baris dilewati karena NUPTK/Username sudah ada).`
            : `${importedCount} guru berhasil diimpor dari "${file.name}".`,
      });

      await loadTeachers(debouncedSearch, page);
    } catch (err) {
      const rowErrors = err.errors?.rows || [];
      setImportModalBanner({
        variant: 'error',
        title: 'Impor Gagal',
        message:
          err.message || 'Terjadi kesalahan saat menyimpan hasil impor.',
        details: rowErrors,
      });
    } finally {
      setImportingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const columns = [
    {
      key: 'no',
      header: 'No',
      width: '64px',
      render: (_, index) => (
        <span className="font-medium text-text-secondary">{index + 1}</span>
      ),
    },
    {
      key: 'username',
      header: 'Username / NUPTK',
      width: '170px',
      render: (row) => (
        <span className="inline-block px-md py-xs rounded-pill bg-soft-blue text-navy text-xs font-semibold">
          {row.username}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Nama Guru',
      render: (row) => (
        <span className="font-semibold text-text">{row.name}</span>
      ),
    },
    {
      key: 'password',
      header: 'Password',
      width: '140px',
      render: (row) => (
        <span className="inline-block px-md py-xs rounded-sm bg-alert-warning-bg text-alert-warning-text text-xs font-semibold">
          {row.password_plain || 'password'}
        </span>
      ),
    },
    {
      key: 'subjects',
      header: 'Mata Pelajaran',
      render: (row) => (
        <BadgeList items={row.subjects} emptyText="Belum diatur" />
      ),
    },
    {
      key: 'rombels',
      header: 'Kelas / Rombel',
      render: (row) => (
        <BadgeList items={row.rombels} emptyText="Belum diatur" />
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: '190px',
      align: 'right',
      render: (row) => (
        <div className="inline-flex items-center justify-end gap-sm">
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
            onClick={() => handleDeleteTeacher(row)}
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
        <span>+ Tambah Guru</span>
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
        aria-label="Unggah file Excel (.xlsx) Data Guru"
      />

      <div className="flex flex-col gap-xl">
        {/* 1. Header: Judul & Deskripsi di Kiri, Dropdown "Import" & "+ Tambah Guru" di Kanan */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
          <div>
            <h1 className="text-xl font-bold text-text leading-tight">
              Data Guru
            </h1>
            <p className="text-sm text-text-secondary mt-xs">
              Kelola akun guru pengampu (NUPTK / Username, Nama Lengkap, dan Password)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-sm shrink-0">
            <div className="relative" ref={importDropdownRef}>
              <button
                type="button"
                onClick={() => setImportDropdownOpen((prev) => !prev)}
                disabled={restrictedMode}
                className="min-h-[48px] px-lg bg-surface hover:bg-background border border-border text-navy font-semibold text-sm rounded-md transition-colors inline-flex items-center justify-center gap-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-expanded={importDropdownOpen}
                aria-haspopup="true"
              >
                <Upload size={16} strokeWidth={2} className="shrink-0" />
                <span>Import</span>
                <ChevronDown size={16} strokeWidth={2} className="shrink-0" />
              </button>

              {importDropdownOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-xs z-40 w-[260px] bg-surface border border-border rounded-md shadow-md p-xs flex flex-col gap-xxs">
                  <button
                    type="button"
                    onClick={openImportModal}
                    className="w-full min-h-[40px] px-md py-xs rounded-sm hover:bg-soft-blue text-navy text-xs font-semibold text-left flex items-center gap-sm transition-colors cursor-pointer"
                  >
                    <Upload size={16} strokeWidth={2} className="text-primary shrink-0" />
                    <span>Unggah Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="w-full min-h-[40px] px-md py-xs rounded-sm hover:bg-soft-blue text-navy text-xs font-semibold text-left flex items-center gap-sm transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet size={16} strokeWidth={2} className="text-navy shrink-0" />
                    <span>Download Template Excel (.xlsx)</span>
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
              <span>Tambah Guru</span>
            </button>
          </div>
        </div>

        {/* 2. Banner Status / Error Inline */}
        {pageBanner && (
          <AlertBanner
            variant={pageBanner.variant}
            title={pageBanner.title}
            message={pageBanner.message}
            details={pageBanner.details}
            onClose={() => setPageBanner(null)}
          />
        )}

        {/* 3. Tabel Data Guru */}
        <DataTable
          columns={columns}
          data={teachers}
          loading={loading}
          emptyText="Belum ada data guru ditemukan."
          emptyAction={emptyStateButtons}
          searchValue={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Ketik untuk mencari NUPTK / Username atau nama guru..."
          pageSize={10}
          serverPagination={{
            currentPage: paginationMeta.current_page,
            totalPages: paginationMeta.last_page,
            totalItems: paginationMeta.total,
            onPageChange: handlePageChange,
          }}
        />
      </div>

      {/* Modal Impor 3 Langkah */}
      <SubjectImportModal
        isOpen={isImportModalOpen}
        title="Import Data Guru (Excel .xlsx)"
        step1Description={
          <>
            Gunakan format tabel standar agar sistem mengenali kolom{' '}
            <code>NUPTK / Username</code>, <code>Nama Guru</code>, dan{' '}
            <code>Password</code>.
          </>
        }
        step2Title="Langkah 2: Isi Data Guru"
        step2Description={
          <>
            Pastikan setiap <strong>NUPTK / Username</strong> unik. Jika kolom{' '}
            <strong>Password</strong> dikosongkan, password otomatis disamakan
            dengan NUPTK / Username.
          </>
        }
        codeColumnLabel="NUPTK / Username"
        nameColumnLabel="Nama Guru"
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

      {/* Modal Tambah / Edit Guru */}
      <TeacherFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        form={form}
        onFieldChange={handleFieldChange}
        onToggleItem={handleToggleItem}
        subjectOptions={subjectOptions}
        rombelOptions={rombelOptions}
        errors={formErrors}
        errorGeneral={formErrorGeneral}
        onClearErrorGeneral={() => setFormErrorGeneral('')}
        submitting={submitting}
        onSubmit={handleSaveTeacher}
        onClose={closeModal}
      />
    </AdminLayout>
  );
}


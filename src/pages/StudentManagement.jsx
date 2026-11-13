import { useState, useRef, useEffect } from 'react';
import { Upload, ChevronDown, Plus, FileSpreadsheet, FileText, ArrowUpRight } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import AlertBanner from '../components/ui/AlertBanner';
import FormSelect from '../components/ui/FormSelect';
import SubjectImportModal from '../features/subjects/SubjectImportModal';
import { fetchRombelsApi } from '../services/rombel.service';
import {
  fetchStudentsApi,
  createStudentApi,
  bulkImportStudentsApi,
  updateStudentApi,
  deleteStudentApi,
  promoteStudentsApi,
  toggleStudentActiveApi,
} from '../services/student.service';
import {
  parseStudentImportFile,
  downloadStudentExcelTemplate,
  downloadStudentWordTemplate,
} from '../utils/entityImportParser';
import { useDebounce } from '../hooks/useDebounce';
import { useAcademicYears } from '../hooks/useAcademicYears';

/** Halaman manajemen data siswa, impor massal, dan kenaikan kelas. */
export default function StudentManagement({
  user,
  restrictedMode,
  currentPath = '/admin/siswa',
  onNavigate,
  onLogout,
}) {
  const { uniqueAcademicYears, activeAcademicYear } = useAcademicYears({
    onUnauthorized: onLogout,
  });
  const [students, setStudents] = useState([]);
  const [rombels, setRombels] = useState([]);
  const [selectedRombelId, setSelectedRombelId] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
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

  // Modal Tambah / Edit Siswa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [formNisn, setFormNisn] = useState('');
  const [formName, setFormName] = useState('');
  const [formRombelId, setFormRombelId] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [formErrorGeneral, setFormErrorGeneral] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteSourceRombelId, setPromoteSourceRombelId] = useState('');
  const [promoteAction, setPromoteAction] = useState('promote');
  const [promoteTargetRombelId, setPromoteTargetRombelId] = useState('');
  const [promoteError, setPromoteError] = useState('');
  const [promoting, setPromoting] = useState(false);

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

  const refreshRombelOptions = async () => {
    try {
      const list = await fetchRombelsApi('');
      setRombels(list);
    } catch {
      // Abaikan jika gagal memuat opsi dropdown
    }
  };

  const loadStudents = async (
    keyword = debouncedSearch,
    rombelFilter = selectedRombelId,
    targetPage = page
  ) => {
    setLoading(true);
    try {
      const res = await fetchStudentsApi({
        search: keyword,
        rombelId: rombelFilter,
        page: targetPage,
        perPage: 10,
      });
      setStudents(res.items);
      setPaginationMeta(res.meta);
    } catch (err) {
      setPageBanner({
        variant: 'error',
        title: 'Gagal Memuat Data',
        message: err.message || 'Gagal memuat daftar siswa.',
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
    fetchRombelsApi('')
      .then((list) => {
        if (isMounted) setRombels(list);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchStudentsApi({
      search: debouncedSearch,
      rombelId: selectedRombelId,
      page,
      perPage: 10,
    })
      .then((res) => {
        if (isMounted) {
          setStudents(res.items);
          setPaginationMeta(res.meta);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setPageBanner({
          variant: 'error',
          title: 'Gagal Memuat Data',
          message: err.message || 'Gagal memuat daftar siswa.',
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
  }, [debouncedSearch, selectedRombelId, page, onLogout]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
    setLoading(true);
  };

  const handleRombelFilterChange = (e) => {
    setSelectedRombelId(e.target.value);
    setPage(1);
    setLoading(true);
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    setLoading(true);
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingStudentId(null);
    setFormNisn('');
    setFormName('');
    setFormRombelId(
      selectedRombelId || (rombels[0]?.id ? String(rombels[0].id) : '')
    );
    setFormPassword('');
    setFormErrors({});
    setFormErrorGeneral('');
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setModalMode('edit');
    setEditingStudentId(student.id);
    setFormNisn(student.nisn || '');
    setFormName(student.name || '');
    setFormRombelId(student.rombel_id ? String(student.rombel_id) : '');
    setFormPassword(student.password_plain || '');
    setFormErrors({});
    setFormErrorGeneral('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setFormErrorGeneral('');

    if (!formNisn.trim() || !formName.trim() || !formRombelId) {
      setFormErrorGeneral('NISN, Nama Lengkap, dan Kelas / Rombel wajib diisi.');
      return;
    }

    if (modalMode === 'add' && !formPassword.trim()) {
      setFormErrorGeneral('Kata sandi wajib diisi untuk siswa baru.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'add') {
        const res = await createStudentApi({
          nisn: formNisn,
          name: formName,
          rombel_id: formRombelId,
          password: formPassword,
        });
        setPageBanner({
          variant: 'success',
          message: res.message || 'Data siswa berhasil ditambahkan.',
        });
      } else {
        const res = await updateStudentApi(editingStudentId, {
          nisn: formNisn,
          name: formName,
          rombel_id: formRombelId,
          password: formPassword,
        });
        setPageBanner({
          variant: 'success',
          message: res.message || 'Data siswa berhasil diperbarui.',
        });
      }

      setIsModalOpen(false);
      await loadStudents(debouncedSearch, selectedRombelId, page);
    } catch (err) {
      if (err.errors && Object.keys(err.errors).length > 0) {
        setFormErrors(err.errors);
      }
      setFormErrorGeneral(
        err.message || 'Terjadi kesalahan saat menyimpan data siswa.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (student) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus akun siswa "${student.name}" (NISN: ${student.nisn})?`
    );
    if (!confirmed) return;

    try {
      const res = await deleteStudentApi(student.id);
      setPageBanner({
        variant: 'success',
        message: res.message || 'Data siswa berhasil dihapus.',
      });
      await loadStudents(debouncedSearch, selectedRombelId, page);
    } catch (err) {
      setPageBanner({
        variant: 'error',
        title: 'Gagal Menghapus',
        message: err.message || 'Gagal menghapus data siswa.',
      });
    }
  };

  const handleToggleActive = async (student) => {
    try {
      const res = await toggleStudentActiveApi(student.id);
      setPageBanner({
        variant: 'success',
        message: res.message || 'Status siswa berhasil diperbarui.',
      });
      await loadStudents(debouncedSearch, selectedRombelId, page);
    } catch (err) {
      if (err.status === 401) {
        onLogout();
        return;
      }
      setPageBanner({
        variant: 'error',
        message: err.message || 'Gagal mengubah status siswa.',
      });
    }
  };

  const openPromoteModal = () => {
    setPromoteSourceRombelId(rombels[0]?.id ? String(rombels[0].id) : '');
    setPromoteTargetRombelId(rombels[1]?.id ? String(rombels[1].id) : '');
    setPromoteAction('promote');
    setPromoteError('');
    setIsPromoteModalOpen(true);
  };

  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    setPromoteError('');
    if (!promoteSourceRombelId) {
      setPromoteError('Pilih kelas asal terlebih dahulu.');
      return;
    }
    if (promoteAction === 'promote' && !promoteTargetRombelId) {
      setPromoteError('Pilih kelas tujuan terlebih dahulu.');
      return;
    }

    setPromoting(true);
    try {
      const res = await promoteStudentsApi({
        source_rombel_id: promoteSourceRombelId,
        action: promoteAction,
        target_rombel_id:
          promoteAction === 'promote' ? promoteTargetRombelId : null,
      });
      setPageBanner({
        variant: 'success',
        message: res.message || 'Proses kenaikan kelas berhasil.',
      });
      setIsPromoteModalOpen(false);
      await loadStudents(debouncedSearch, selectedRombelId, page);
    } catch (err) {
      if (err.status === 401) {
        onLogout();
        return;
      }
      setPromoteError(
        err.message || 'Gagal memproses kenaikan kelas / kelulusan.'
      );
    } finally {
      setPromoting(false);
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
      await downloadStudentExcelTemplate(activeAcademicYear?.name || '2026/2027');
    } catch {
      setPageBanner({
        variant: 'error',
        message: 'Gagal mengunduh file template Excel Siswa.',
      });
    }
  };

  const handleDownloadWordTemplate = () => {
    setImportDropdownOpen(false);
    try {
      downloadStudentWordTemplate();
    } catch {
      setPageBanner({
        variant: 'error',
        message: 'Gagal mengunduh file template Word Siswa.',
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
      const currentStudents = await fetchStudentsApi({
        search: '',
        rombelId: '',
      });
      const parseResult = await parseStudentImportFile(file, currentStudents);

      if (parseResult.rowResults.length === 0) {
        setImportModalBanner({
          variant: 'error',
          title: 'Validasi File Gagal',
          message:
            parseResult.errors[0] ||
            'File tidak sesuai dengan struktur template Siswa.',
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

      if (parseResult.students.length === 0) {
        setImportRowResults(parseResult.rowResults);
        setImportSummary({
          imported: 0,
          skipped: parseResult.summary.skippedCount,
          errors: 0,
        });
        setImportModalBanner({
          variant: 'warning',
          title: 'Semua Baris Dilewati',
          message: `Seluruh ${parseResult.summary.skippedCount} baris NISN siswa sudah terdaftar di sekolah Anda.`,
        });
        return;
      }

      const response = await bulkImportStudentsApi(
        parseResult.students,
        activeAcademicYear?.id || null
      );
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
        message: `${importedCount} siswa berhasil diimpor, ${skippedCount} dilewati.`,
      });

      setPageBanner({
        variant: skippedCount > 0 ? 'warning' : 'success',
        message:
          skippedCount > 0
            ? `${importedCount} siswa berhasil diimpor dari "${file.name}" (${skippedCount} baris dilewati karena NISN sudah ada).`
            : `${importedCount} siswa berhasil diimpor dari "${file.name}".`,
      });

      await refreshRombelOptions();
      await loadStudents(debouncedSearch, selectedRombelId, page);
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
      key: 'nisn',
      header: 'NISN',
      width: '160px',
      render: (row) => (
        <span className="inline-block px-md py-xs rounded-pill bg-soft-blue text-navy text-xs font-semibold">
          {row.nisn}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Nama Siswa',
      render: (row) => (
        <span className="font-semibold text-text">{row.name}</span>
      ),
    },
    {
      key: 'academic_year',
      header: 'Tahun Ajaran',
      width: '160px',
      render: (row) => {
        const ay = row.academic_year || row.rombel?.academic_year;
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
      key: 'is_active',
      header: 'Status',
      width: '120px',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleToggleActive(row)}
          disabled={restrictedMode}
          title="Klik untuk ubah status aktif/nonaktif"
          className={`inline-block px-md py-xs rounded-pill text-xs font-semibold cursor-pointer transition-colors ${
            row.is_active !== false
              ? 'bg-mint/20 text-text hover:bg-mint/30'
              : 'bg-background border border-border text-text-secondary hover:bg-border/40'
          }`}
        >
          {row.is_active !== false ? 'Aktif' : 'Nonaktif'}
        </button>
      ),
    },
    {
      key: 'rombel',
      header: 'Kelas / Rombel',
      width: '170px',
      render: (row) => (
        <span className="inline-block px-md py-xs rounded-pill bg-soft-blue text-navy text-xs font-semibold">
          {row.rombel?.name || '-'}
        </span>
      ),
    },
    {
      key: 'password',
      header: 'Password',
      width: '170px',
      render: (row) => (
        <span className="inline-block px-md py-xs rounded-sm bg-alert-warning-bg text-alert-warning-text text-xs font-semibold">
          {row.password_plain || 'password'}
        </span>
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
            onClick={() => handleDeleteStudent(row)}
            disabled={restrictedMode}
            className="min-h-[36px] px-md py-xs rounded-sm bg-alert-danger-bg hover:bg-coral text-alert-danger-text hover:text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Hapus
          </button>
        </div>
      ),
    },
  ];

  const rombelFilterDropdown = (
    <div className="flex items-center gap-sm w-full sm:w-auto">
      <label
        htmlFor="filter-rombel"
        className="text-xs font-semibold text-text-secondary shrink-0"
      >
        Filter Kelas:
      </label>
      <select
        id="filter-rombel"
        value={selectedRombelId}
        onChange={handleRombelFilterChange}
        className="h-[46px] px-md bg-white border border-border rounded-md text-md text-text focus:outline-none focus:border-primary cursor-pointer transition-colors"
      >
        <option value="">Semua Rombel</option>
        {rombels.map((rombel) => (
          <option key={rombel.id} value={rombel.id}>
            {rombel.name}
          </option>
        ))}
      </select>
      <label
        htmlFor="filter-student-year"
        className="text-xs font-semibold text-text-secondary shrink-0"
      >
        Tahun Ajaran:
      </label>
      <select
        id="filter-student-year"
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
  );

  const emptyStateButtons = (
    <>
      <button
        type="button"
        onClick={openAddModal}
        disabled={restrictedMode}
        className="min-h-[36px] px-lg py-xs rounded-sm bg-primary hover:bg-blue disabled:bg-text-disabled text-white text-xs font-semibold inline-flex items-center gap-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        <span>+ Tambah Siswa</span>
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
        aria-label="Unggah file Excel (.xlsx) Data Siswa"
      />

      <div className="flex flex-col gap-xl">
        {/* 1. Header: Judul & Deskripsi di Kiri, Dropdown "Import" & "+ Tambah Siswa" di Kanan */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
          <div>
            <h1 className="text-xl font-bold text-text leading-tight">
              Data Siswa
            </h1>
            <p className="text-sm text-text-secondary mt-xs">
              Kelola akun peserta ujian (NISN, Nama, Kelas / Rombel, dan Password)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-sm shrink-0">
            <button
              type="button"
              onClick={openPromoteModal}
              disabled={restrictedMode || rombels.length === 0}
              className="min-h-[48px] px-lg bg-surface hover:bg-background border border-border text-navy font-semibold text-sm rounded-md transition-colors inline-flex items-center justify-center gap-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUpRight size={16} strokeWidth={2} className="shrink-0" />
              <span>Naik Kelas / Lulus</span>
            </button>
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
              <span>Tambah Siswa</span>
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

        {/* 3. Tabel Data Siswa + Filter Rombel */}
        <DataTable
          columns={columns}
          data={
            selectedAcademicYear
              ? students.filter((s) => {
                  const ay = s.academic_year || s.rombel?.academic_year;
                  const yearName =
                    typeof ay === 'object' && ay !== null
                      ? ay.name
                      : ay || '2026/2027';
                  return yearName === selectedAcademicYear;
                })
              : students
          }
          loading={loading}
          emptyText="Belum ada data siswa ditemukan."
          emptyAction={emptyStateButtons}
          searchValue={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Ketik untuk mencari NISN atau nama siswa..."
          filterSlot={rombelFilterDropdown}
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
        title="Import Data Siswa (Excel .xlsx)"
        step1Description={
          <>
            Gunakan format tabel standar agar sistem mengenali kolom{' '}
            <code>NISN</code>, <code>Nama Siswa</code>,{' '}
            <code>Kelas / Rombel</code>, dan <code>Password</code>.
          </>
        }
        step2Title="Langkah 2: Isi Data Siswa"
        step2Description={
          <>
            Pastikan setiap <strong>NISN</strong> unik. Jika kolom{' '}
            <strong>Kelas / Rombel</strong> belum ada di sistem, kelas akan
            otomatis dibuatkan. Jika <strong>Password</strong> dikosongkan,
            password otomatis disamakan dengan NISN.
          </>
        }
        codeColumnLabel="NISN"
        nameColumnLabel="Nama Siswa (Kelas)"
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

      {/* Modal Tambah / Edit Siswa */}
      <Modal
        isOpen={isModalOpen}
        title={modalMode === 'add' ? 'Tambah Siswa Baru' : 'Edit Data Siswa'}
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
            onSubmit={handleSaveStudent}
            className="flex flex-col gap-md"
            noValidate
          >
            <div>
              <label
                htmlFor="student-nisn"
                className="block text-sm font-semibold text-navy mb-xs"
              >
                NISN
              </label>
              <input
                id="student-nisn"
                type="text"
                placeholder="Contoh: 0081234501"
                value={formNisn}
                onChange={(e) => setFormNisn(e.target.value)}
                disabled={submitting}
                required
                className="w-full min-h-[48px] px-lg py-sm bg-white border border-border rounded-md text-sm text-text placeholder:text-text-disabled focus:outline-none focus:border-primary"
              />
              {formErrors.nisn && (
                <p className="mt-xxs text-xs font-medium text-error">
                  {formErrors.nisn[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="student-name"
                className="block text-sm font-semibold text-navy mb-xs"
              >
                Nama Lengkap Siswa
              </label>
              <input
                id="student-name"
                type="text"
                placeholder="Contoh: Ahmad Fauzi"
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

            <div>
              <label
                htmlFor="student-rombel"
                className="block text-sm font-semibold text-navy mb-xs"
              >
                Pilih Kelas / Rombel
              </label>
              <select
                id="student-rombel"
                value={formRombelId}
                onChange={(e) => setFormRombelId(e.target.value)}
                disabled={submitting}
                required
                className="w-full min-h-[48px] px-lg py-sm bg-white border border-border rounded-md text-sm text-text focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="">-- Pilih Kelas / Rombel --</option>
                {rombels.map((rombel) => (
                  <option key={rombel.id} value={rombel.id}>
                    {rombel.name}
                  </option>
                ))}
              </select>
              {formErrors.rombel_id && (
                <p className="mt-xxs text-xs font-medium text-error">
                  {formErrors.rombel_id[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="student-password"
                className="block text-sm font-semibold text-navy mb-xs"
              >
                Password Login Siswa
              </label>
              <input
                id="student-password"
                type="text"
                placeholder="Contoh: 123456"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                disabled={submitting}
                required={modalMode === 'add'}
                className="w-full min-h-[48px] px-lg py-sm bg-white border border-border rounded-md text-sm text-text placeholder:text-text-disabled focus:outline-none focus:border-primary"
              />
              {formErrors.password && (
                <p className="mt-xxs text-xs font-medium text-error">
                  {formErrors.password[0]}
                </p>
              )}
            </div>

            <div className="mt-md flex items-center justify-end gap-sm">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="min-h-[48px] px-lg rounded-md border border-border bg-surface hover:bg-background text-text-secondary text-sm font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[48px] px-xl rounded-md bg-primary hover:bg-blue disabled:bg-text-disabled text-white text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting
                  ? 'Menyimpan...'
                  : modalMode === 'add'
                  ? 'Simpan Siswa'
                  : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal Naik Kelas & Kelulusan Massal */}
      <Modal
        isOpen={isPromoteModalOpen}
        title="Kenaikan Kelas & Kelulusan Massal"
        onClose={() => !promoting && setIsPromoteModalOpen(false)}
      >
        <div className="flex flex-col gap-md">
          {promoteError && (
            <AlertBanner
              variant="error"
              message={promoteError}
              onClose={() => setPromoteError('')}
            />
          )}

          <form
            onSubmit={handlePromoteSubmit}
            className="flex flex-col gap-md"
            noValidate
          >
            <FormSelect
              id="promote-source-rombel"
              label="Kelas Asal"
              value={promoteSourceRombelId}
              onChange={(e) => setPromoteSourceRombelId(e.target.value)}
              options={rombels.map((r) => ({
                value: String(r.id),
                label: r.name,
              }))}
              disabled={promoting}
              required
            />

            <FormSelect
              id="promote-action"
              label="Tindakan"
              value={promoteAction}
              onChange={(e) => setPromoteAction(e.target.value)}
              options={[
                {
                  value: 'promote',
                  label: 'Naik Kelas (Pindahkan Semua Siswa Aktif ke Kelas Tujuan)',
                },
                {
                  value: 'graduate',
                  label: 'Luluskan Kelas XII (Nonaktifkan Akun Siswa)',
                },
              ]}
              disabled={promoting}
              required
            />

            {promoteAction === 'promote' && (
              <FormSelect
                id="promote-target-rombel"
                label="Kelas Tujuan"
                value={promoteTargetRombelId}
                onChange={(e) => setPromoteTargetRombelId(e.target.value)}
                options={rombels.map((r) => ({
                  value: String(r.id),
                  label: r.name,
                }))}
                disabled={promoting}
                required
              />
            )}

            <p className="text-xs text-text-secondary">
              {promoteAction === 'promote'
                ? 'Semua siswa aktif di kelas asal akan dipindahkan sekaligus ke kelas tujuan beserta tahun ajarannya.'
                : 'Semua siswa aktif di kelas asal akan diubah statusnya menjadi Nonaktif (Lulus). Riwayat nilai ujian tetap tersimpan dan kuota lisensi kembali tersedia.'}
            </p>

            <div className="mt-md flex items-center justify-end gap-sm">
              <button
                type="button"
                onClick={() => setIsPromoteModalOpen(false)}
                disabled={promoting}
                className="min-h-[44px] px-lg rounded-md border border-border bg-surface hover:bg-background text-text-secondary text-sm font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={promoting}
                className="min-h-[44px] px-xl rounded-md bg-primary hover:bg-blue disabled:bg-text-disabled text-white text-sm font-semibold cursor-pointer"
              >
                {promoting ? 'Memproses...' : 'Proses Massal'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </AdminLayout>
  );
}

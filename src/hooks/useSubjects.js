import { useState, useEffect, useRef } from 'react';
import {
  fetchSubjectsApi,
  createSubjectApi,
  bulkImportSubjectsApi,
  updateSubjectApi,
  deleteSubjectApi,
} from '../services/subject.service';
import {
  parseSubjectImportFile,
  downloadSubjectExcelTemplate,
  downloadSubjectWordTemplate,
} from '../utils/subjectFileParser';
import { useDebounce } from './useDebounce';

/**
 * Custom hook untuk seluruh state dan operasi CRUD + Impor halaman Mata Pelajaran.
 */
export function useSubjects({ restrictedMode, onLogout }) {
  const [subjects, setSubjects] = useState([]);
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

  // State Modal Tambah / Edit Manual
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [formErrorGeneral, setFormErrorGeneral] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // State Modal Impor (Langkah 1-3 + Hasil Per Baris)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importingFile, setImportingFile] = useState(false);
  const [selectedImportFileName, setSelectedImportFileName] = useState('');
  const [importModalBanner, setImportModalBanner] = useState(null);
  const [importRowResults, setImportRowResults] = useState([]);
  const [importSummary, setImportSummary] = useState(null);
  const fileInputRef = useRef(null);

  const loadSubjects = async (keyword = debouncedSearch, targetPage = page) => {
    setLoading(true);
    try {
      const res = await fetchSubjectsApi(keyword, {
        page: targetPage,
        perPage: 10,
      });
      setSubjects(res.items);
      setPaginationMeta(res.meta);
    } catch (err) {
      setPageBanner({
        variant: 'error',
        title: 'Gagal Memuat Data',
        message: err.message || 'Gagal memuat daftar mata pelajaran.',
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
    fetchSubjectsApi(debouncedSearch, { page, perPage: 10 })
      .then((res) => {
        if (isMounted) {
          setSubjects(res.items);
          setPaginationMeta(res.meta);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setPageBanner({
          variant: 'error',
          title: 'Gagal Memuat Data',
          message: err.message || 'Gagal memuat daftar mata pelajaran.',
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

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
    setLoading(true);
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    setLoading(true);
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingSubjectId(null);
    setFormCode('');
    setFormName('');
    setFormErrors({});
    setFormErrorGeneral('');
    setIsModalOpen(true);
  };

  const openEditModal = (subject) => {
    setModalMode('edit');
    setEditingSubjectId(subject.id);
    setFormCode(subject.code || '');
    setFormName(subject.name || '');
    setFormErrors({});
    setFormErrorGeneral('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setFormErrorGeneral('');

    const normalizedCode = formCode.trim().toUpperCase();
    const normalizedName = formName.trim();

    if (!normalizedCode || !normalizedName) {
      setFormErrorGeneral('Kode Mapel dan Nama Mapel wajib diisi.');
      return;
    }

    const duplicate = subjects.find(
      (s) =>
        String(s.code || '').toUpperCase() === normalizedCode &&
        s.id !== editingSubjectId
    );
    if (duplicate) {
      setFormErrors({
        code: [`Kode mata pelajaran "${normalizedCode}" sudah digunakan.`],
      });
      setFormErrorGeneral(
        `Kode mata pelajaran "${normalizedCode}" sudah digunakan oleh "${duplicate.name}".`
      );
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'add') {
        const res = await createSubjectApi({
          code: normalizedCode,
          name: normalizedName,
        });
        setPageBanner({
          variant: 'success',
          message: res.message || 'Mata pelajaran berhasil ditambahkan.',
        });
      } else {
        const res = await updateSubjectApi(editingSubjectId, {
          code: normalizedCode,
          name: normalizedName,
        });
        setPageBanner({
          variant: 'success',
          message: res.message || 'Mata pelajaran berhasil diperbarui.',
        });
      }

      setIsModalOpen(false);
      await loadSubjects(debouncedSearch);
    } catch (err) {
      if (err.errors && Object.keys(err.errors).length > 0) {
        setFormErrors(err.errors);
      }
      setFormErrorGeneral(
        err.message || 'Terjadi kesalahan saat menyimpan data.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subject) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus mata pelajaran "${subject.name}" (${subject.code})?`
    );
    if (!confirmed) return;

    try {
      const res = await deleteSubjectApi(subject.id);
      setPageBanner({
        variant: 'success',
        message: res.message || 'Mata pelajaran berhasil dihapus.',
      });
      await loadSubjects(debouncedSearch);
    } catch (err) {
      setPageBanner({
        variant: 'error',
        title: 'Gagal Menghapus',
        message: err.message || 'Gagal menghapus mata pelajaran.',
      });
    }
  };

  const openImportModal = () => {
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
    try {
      await downloadSubjectExcelTemplate();
    } catch {
      setPageBanner({
        variant: 'error',
        message: 'Gagal mengunduh file template Excel.',
      });
    }
  };

  const handleDownloadWordTemplate = () => {
    try {
      downloadSubjectWordTemplate();
    } catch {
      setPageBanner({
        variant: 'error',
        message: 'Gagal mengunduh file template Word.',
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
      const currentSubjects = await fetchSubjectsApi('');
      const parseResult = await parseSubjectImportFile(file, currentSubjects);

      if (parseResult.rowResults.length === 0) {
        setImportModalBanner({
          variant: 'error',
          title: 'Validasi File Gagal',
          message:
            parseResult.errors[0] ||
            'File tidak sesuai dengan struktur template.',
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

      if (parseResult.subjects.length === 0) {
        setImportRowResults(parseResult.rowResults);
        setImportSummary({
          imported: 0,
          skipped: parseResult.summary.skippedCount,
          errors: 0,
        });
        setImportModalBanner({
          variant: 'warning',
          title: 'Semua Baris Dilewati',
          message: `Seluruh ${parseResult.summary.skippedCount} baris kode mapel sudah terdaftar di sekolah Anda.`,
        });
        return;
      }

      const response = await bulkImportSubjectsApi(parseResult.subjects);
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
        message: `${importedCount} mata pelajaran berhasil diimpor, ${skippedCount} dilewati.`,
      });

      setPageBanner({
        variant: skippedCount > 0 ? 'warning' : 'success',
        message:
          skippedCount > 0
            ? `${importedCount} mata pelajaran berhasil diimpor dari "${file.name}" (${skippedCount} baris dilewati karena kode sudah ada).`
            : `${importedCount} mata pelajaran berhasil diimpor dari "${file.name}".`,
      });

      await loadSubjects(debouncedSearch);
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

  return {
    subjects,
    search,
    setSearch: handleSearchChange,
    paginationMeta,
    handlePageChange,
    loading,
    pageBanner,
    setPageBanner,
    isModalOpen,
    modalMode,
    formCode,
    setFormCode,
    formName,
    setFormName,
    formErrors,
    formErrorGeneral,
    setFormErrorGeneral,
    submitting,
    openAddModal,
    openEditModal,
    closeModal,
    handleSaveSubject,
    handleDeleteSubject,
    isImportModalOpen,
    importingFile,
    selectedImportFileName,
    importModalBanner,
    setImportModalBanner,
    importRowResults,
    importSummary,
    fileInputRef,
    openImportModal,
    closeImportModal,
    handleTriggerFileBrowser,
    handleDownloadExcelTemplate,
    handleDownloadWordTemplate,
    handleFileSelected,
  };
}

import { useState, useRef, useEffect } from 'react';
import { Upload, ChevronDown, Plus, FileSpreadsheet, FileText } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/ui/DataTable';
import AlertBanner from '../components/ui/AlertBanner';
import SubjectFormModal from '../features/subjects/SubjectFormModal';
import SubjectImportModal from '../features/subjects/SubjectImportModal';
import { useSubjects } from '../hooks/useSubjects';

/** Halaman manajemen data mata pelajaran oleh Admin. */
export default function SubjectManagement({
  user,
  restrictedMode,
  currentPath = '/admin/mata-pelajaran',
  onNavigate,
  onLogout,
}) {
  const {
    subjects,
    search,
    setSearch,
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
  } = useSubjects({ restrictedMode, onLogout });

  const [importDropdownOpen, setImportDropdownOpen] = useState(false);
  const importDropdownRef = useRef(null);

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
      key: 'code',
      header: 'Kode Mapel',
      width: '200px',
      render: (row) => (
        <span className="inline-block px-md py-xs rounded-pill bg-soft-blue text-navy text-xs font-semibold">
          {row.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Nama Mapel',
      render: (row) => (
        <span className="font-semibold text-text">{row.name}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: '200px',
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
            onClick={() => handleDeleteSubject(row)}
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
        <span>+ Tambah Mapel</span>
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
        aria-label="Unggah file Excel (.xlsx) Mata Pelajaran"
      />

      <div className="flex flex-col gap-xl">
        {/* 1. Header: Judul & Deskripsi di Kiri, Dropdown "Import" & "+ Tambah Mapel" di Kanan */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
          <div>
            <h1 className="text-xl font-bold text-text leading-tight">
              Mata Pelajaran
            </h1>
            <p className="text-sm text-text-secondary mt-xs">
              Kelola daftar kode dan nama mata pelajaran untuk sekolah Anda
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
                    onClick={() => {
                      setImportDropdownOpen(false);
                      openImportModal();
                    }}
                    className="w-full min-h-[40px] px-md py-xs rounded-sm hover:bg-soft-blue text-navy text-xs font-semibold text-left flex items-center gap-sm transition-colors cursor-pointer"
                  >
                    <Upload size={16} strokeWidth={2} className="text-primary shrink-0" />
                    <span>Unggah Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImportDropdownOpen(false);
                      handleDownloadExcelTemplate();
                    }}
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
              <span>Tambah Mapel</span>
            </button>
          </div>
        </div>

        {/* 2. Banner Status / Error Inline di Halaman */}
        {pageBanner && (
          <AlertBanner
            variant={pageBanner.variant}
            title={pageBanner.title}
            message={pageBanner.message}
            details={pageBanner.details}
            onClose={() => setPageBanner(null)}
          />
        )}

        {/* 3. Tabel Mata Pelajaran */}
        <DataTable
          columns={columns}
          data={subjects}
          loading={loading}
          emptyText="Belum ada data mata pelajaran ditemukan."
          emptyAction={emptyStateButtons}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Ketik untuk mencari kode atau nama mata pelajaran..."
          pageSize={10}
          serverPagination={{
            currentPage: paginationMeta.current_page,
            totalPages: paginationMeta.last_page,
            totalItems: paginationMeta.total,
            onPageChange: handlePageChange,
          }}
        />
      </div>

      {/* Modal Impor 3 Langkah + Hasil Per Baris */}
      <SubjectImportModal
        isOpen={isImportModalOpen}
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

      {/* Modal Tambah / Edit Manual */}
      <SubjectFormModal
        isOpen={isModalOpen}
        modalMode={modalMode}
        formCode={formCode}
        onChangeCode={setFormCode}
        formName={formName}
        onChangeName={setFormName}
        formErrors={formErrors}
        formErrorGeneral={formErrorGeneral}
        onClearErrorGeneral={() => setFormErrorGeneral('')}
        submitting={submitting}
        onClose={closeModal}
        onSubmit={handleSaveSubject}
      />
    </AdminLayout>
  );
}

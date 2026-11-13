import { useState } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import AlertBanner from '../components/ui/AlertBanner';
import { useAcademicYears } from '../hooks/useAcademicYears';

/** Halaman manajemen tahun ajaran untuk Admin. */
export default function AcademicYearManagement({
  user,
  currentPath,
  onNavigate,
  onLogout,
}) {
  const {
    academicYears,
    loading,
    error,
    createAcademicYear,
    updateAcademicYear,
    setActiveAcademicYear,
    deleteAcademicYear,
  } = useAcademicYears({ onUnauthorized: onLogout });

  const [pageBanner, setPageBanner] = useState(null);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formSemester, setFormSemester] = useState('Ganjil');
  const [formIsActive, setFormIsActive] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const restrictedMode = user?.license?.is_restricted || false;

  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setFormName('');
    setFormSemester('Ganjil');
    setFormIsActive(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (row) => {
    setModalMode('edit');
    setEditingId(row.id);
    setFormName(row.name || '');
    setFormSemester(row.semester || 'Ganjil');
    setFormIsActive(Boolean(row.is_active));
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    const normalizedName = formName.trim();
    if (!normalizedName) {
      setFormError('Tahun ajaran wajib diisi (contoh: 2026/2027).');
      return;
    }

    const match = /^(\d{4})\/(\d{4})$/.exec(normalizedName);
    if (!match || Number(match[2]) !== Number(match[1]) + 1) {
      setFormError(
        'Format tahun ajaran harus XXXX/YYYY dengan selisih 1 tahun (contoh: 2026/2027).'
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: normalizedName,
        semester: formSemester,
        is_active: formIsActive,
      };
      if (modalMode === 'add') {
        const res = await createAcademicYear(payload);
        setPageBanner({
          variant: 'success',
          message: res.message || 'Tahun ajaran berhasil ditambahkan.',
        });
      } else {
        const res = await updateAcademicYear(editingId, payload);
        setPageBanner({
          variant: 'success',
          message: res.message || 'Tahun ajaran berhasil diperbarui.',
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      if (err.status === 401) {
        onLogout();
        return;
      }
      setFormError(err.message || 'Gagal menyimpan tahun ajaran.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetActive = async (row) => {
    try {
      const res = await setActiveAcademicYear(row.id);
      setPageBanner({
        variant: 'success',
        message: res.message || 'Tahun ajaran berhasil diaktifkan.',
      });
    } catch (err) {
      if (err.status === 401) {
        onLogout();
        return;
      }
      setPageBanner({
        variant: 'error',
        message: err.message || 'Gagal mengaktifkan tahun ajaran.',
      });
    }
  };

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus tahun ajaran "${row.name} (${row.semester})"?`
    );
    if (!confirmed) return;

    try {
      const res = await deleteAcademicYear(row.id);
      setPageBanner({
        variant: 'success',
        message: res.message || 'Tahun ajaran berhasil dihapus.',
      });
    } catch (err) {
      if (err.status === 401) {
        onLogout();
        return;
      }
      setPageBanner({
        variant: 'error',
        message: err.message || 'Gagal menghapus tahun ajaran.',
      });
    }
  };

  const filteredData = search.trim()
    ? academicYears.filter(
        (y) =>
          y.name.toLowerCase().includes(search.toLowerCase()) ||
          y.semester.toLowerCase().includes(search.toLowerCase())
      )
    : academicYears;

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
      key: 'name',
      header: 'Tahun Ajaran',
      render: (row) => (
        <span className="font-semibold text-text">{row.name}</span>
      ),
    },
    {
      key: 'semester',
      header: 'Semester',
      width: '140px',
      render: (row) => (
        <span className="inline-block px-md py-xs rounded-pill bg-soft-blue text-navy text-xs font-semibold">
          {row.semester}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      width: '140px',
      render: (row) =>
        row.is_active ? (
          <span className="inline-flex items-center gap-xxs px-md py-xs rounded-pill bg-mint/20 text-text text-xs font-semibold">
            <CheckCircle2 size={14} />
            Aktif
          </span>
        ) : (
          <span className="inline-block px-md py-xs rounded-pill bg-background border border-border text-text-secondary text-xs font-semibold">
            Tidak Aktif
          </span>
        ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      width: '280px',
      render: (row) => (
        <div className="inline-flex items-center justify-end gap-xs">
          {!row.is_active && (
            <button
              type="button"
              onClick={() => handleSetActive(row)}
              disabled={restrictedMode}
              className="min-h-[36px] px-md py-xs rounded-sm bg-mint/20 hover:bg-mint text-text text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Jadikan Aktif
            </button>
          )}
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
            onClick={() => handleDelete(row)}
            disabled={restrictedMode || row.is_active}
            className="min-h-[36px] px-md py-xs rounded-sm bg-alert-danger-bg hover:bg-coral text-alert-danger-text hover:text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hapus
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout
      user={user}
      currentPath={currentPath}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="flex flex-col gap-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
          <div>
            <h1 className="text-xl font-bold text-text leading-tight">
              Tahun Ajaran
            </h1>
            <p className="text-sm text-text-secondary mt-xs">
              Kelola master tahun ajaran dan semester aktif sekolah
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            disabled={restrictedMode}
            className="min-h-[48px] px-xl bg-primary hover:bg-blue disabled:bg-text-disabled text-white font-semibold text-sm rounded-md transition-colors inline-flex items-center justify-center gap-sm cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            <Plus size={16} strokeWidth={2.2} className="shrink-0" />
            <span>Tambah Tahun Ajaran</span>
          </button>
        </div>

        {(pageBanner || error) && (
          <AlertBanner
            variant={pageBanner?.variant || 'error'}
            message={pageBanner?.message || error}
            onClose={() => setPageBanner(null)}
          />
        )}

        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          emptyText="Belum ada data tahun ajaran."
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari tahun ajaran atau semester..."
          pageSize={10}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        title={
          modalMode === 'add' ? 'Tambah Tahun Ajaran' : 'Edit Tahun Ajaran'
        }
        onClose={closeModal}
      >
        <div className="flex flex-col gap-md">
          {formError && (
            <AlertBanner
              variant="error"
              message={formError}
              onClose={() => setFormError('')}
            />
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-md" noValidate>
            <div>
              <label
                htmlFor="ay-name"
                className="block text-sm font-semibold text-navy mb-xs"
              >
                Tahun Ajaran
              </label>
              <input
                id="ay-name"
                type="text"
                placeholder="Contoh: 2026/2027"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={submitting}
                required
                className="w-full min-h-[48px] px-lg py-sm bg-white border border-border rounded-md text-sm text-text placeholder:text-text-disabled focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="ay-semester"
                className="block text-sm font-semibold text-navy mb-xs"
              >
                Semester
              </label>
              <select
                id="ay-semester"
                value={formSemester}
                onChange={(e) => setFormSemester(e.target.value)}
                disabled={submitting}
                className="w-full min-h-[48px] px-lg py-sm bg-white border border-border rounded-md text-sm text-text focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>

            <label className="inline-flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                disabled={submitting}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm font-medium text-text">
                Jadikan Tahun Ajaran Aktif
              </span>
            </label>

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

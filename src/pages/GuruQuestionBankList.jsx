import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  User,
  FileText,
  Pencil,
  Trash2,
  Eye,
  Copy,
  Lock,
  Globe,
  FolderOpen,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import Modal from '../components/ui/Modal';
import AlertBanner from '../components/ui/AlertBanner';
import { GURU_MENUS } from '../config/navigation';
import {
  fetchQuestionBanks,
  createQuestionBank,
  updateQuestionBank,
  deleteQuestionBank,
  duplicateQuestionBank,
} from '../services/guru.service';

/** Halaman daftar bank soal milik Guru. */
export default function GuruQuestionBankList({
  user,
  currentPath = '/guru/bank-soal',
  onNavigate,
  onLogout,
}) {
  const [tab, setTab] = useState('private');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [banks, setBanks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rombels, setRombels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState({ type: '', message: '' });

  // Modal Create/Edit
  const [formOpen, setFormOpen] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject_id: '',
    grade: '10',
    visibility: 'private',
  });
  const [submitting, setSubmitting] = useState(false);

  // Modal Delete
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Modal Duplicate
  const [duplicateTarget, setDuplicateTarget] = useState(null);
  const [duplicateName, setDuplicateName] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchQuestionBanks({
        tab,
        subject_id: subjectFilter,
        grade: gradeFilter,
        search,
      });
      setBanks(res.question_banks || []);
      setSubjects(res.subjects || []);
      setRombels(res.rombels || []);
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Gagal memuat daftar bank soal.' });
    } finally {
      setLoading(false);
    }
  }, [tab, subjectFilter, gradeFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadData]);

  const openCreateModal = () => {
    setEditingBank(null);
    setFormData({
      name: '',
      subject_id: subjects[0]?.id ? String(subjects[0].id) : '',
      grade: rombels[0]?.name || '',
      visibility: 'private',
    });
    setFormOpen(true);
  };

  const openEditModal = (bank) => {
    setEditingBank(bank);
    setFormData({
      name: bank.name,
      subject_id: String(bank.subject_id),
      grade: bank.grade,
      visibility: bank.visibility,
    });
    setFormOpen(true);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        subject_id: Number(formData.subject_id),
      };
      if (editingBank) {
        await updateQuestionBank(editingBank.id, payload);
        setBanner({ type: 'success', message: 'Paket soal berhasil diperbarui.' });
      } else {
        await createQuestionBank(payload);
        setBanner({ type: 'success', message: 'Paket soal baru berhasil dibuat.' });
      }
      setFormOpen(false);
      loadData();
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Gagal menyimpan paket soal.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      await deleteQuestionBank(deleteTarget.id);
      setBanner({ type: 'success', message: 'Paket soal berhasil dihapus.' });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Gagal menghapus paket soal.' });
      setDeleteTarget(null);
    } finally {
      setSubmitting(false);
    }
  };

  const openDuplicateModal = (bank) => {
    setDuplicateTarget(bank);
    setDuplicateName(`Salinan - ${bank.name}`);
  };

  const handleConfirmDuplicate = async (e) => {
    e.preventDefault();
    if (!duplicateTarget) return;
    try {
      setSubmitting(true);
      await duplicateQuestionBank(duplicateTarget.id, duplicateName);
      setBanner({ type: 'success', message: 'Paket berhasil disalin ke Bank Saya.' });
      setDuplicateTarget(null);
      setTab('private');
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Gagal menyalin paket soal.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout
      user={user}
      currentPath={currentPath}
      onNavigate={onNavigate}
      onLogout={onLogout}
      menus={GURU_MENUS}
      headerTitle="Kelola Bank Soal"
      settingsPath="/guru/profil"
    >
      <div className="flex flex-col gap-lg w-full">
        {banner.message && (
          <AlertBanner
            variant={banner.type}
            message={banner.message}
            onClose={() => setBanner({ type: '', message: '' })}
          />
        )}

        {/* Header & Tombol Utama */}
        <div className="flex flex-wrap items-center justify-between gap-md">
          <div>
            <h1 className="text-xl font-bold text-text leading-tight">
              Bank Soal & Paket Ujian
            </h1>
            <p className="text-sm text-text-secondary mt-xxs">
              Kelola wadah paket soal pribadi atau ambil paket yang dibagikan guru lain di sekolah.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="min-h-[48px] px-xl bg-primary hover:bg-blue text-white font-semibold text-sm rounded-md transition-colors inline-flex items-center justify-center gap-sm cursor-pointer"
          >
            <Plus size={20} strokeWidth={1.5} />
            <span>Paket Baru</span>
          </button>
        </div>

        {/* 2 Tab: Bank Saya vs Bank Sekolah */}
        <div className="flex items-center gap-sm border-b border-border">
          <button
            type="button"
            onClick={() => setTab('private')}
            className={`min-h-[44px] px-lg py-sm text-md font-semibold border-b-2 transition-colors cursor-pointer ${
              tab === 'private'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text'
            }`}
          >
            Bank Saya
          </button>
          <button
            type="button"
            onClick={() => setTab('school')}
            className={`min-h-[44px] px-lg py-sm text-md font-semibold border-b-2 transition-colors cursor-pointer ${
              tab === 'school'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text'
            }`}
          >
            Bank Sekolah
          </button>
        </div>

        {/* Filter Bar: Mapel, Kelas, Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="min-h-[48px] px-md rounded-md border border-border bg-surface text-md text-text"
            aria-label="Filter Mata Pelajaran"
          >
            <option value="">Semua Mata Pelajaran</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="min-h-[48px] px-md rounded-md border border-border bg-surface text-md text-text"
            aria-label="Filter Kelas"
          >
            <option value="">Semua Kelas</option>
            {rombels.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-md top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama paket soal..."
              className="w-full min-h-[48px] pl-[40px] pr-md rounded-md border border-border bg-surface text-md text-text"
            />
          </div>
        </div>

        {/* Grid Cards */}
        {loading ? (
          <div className="py-xxl text-center text-md text-text-secondary">
            Memuat paket soal...
          </div>
        ) : banks.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-xxl flex flex-col items-center justify-center text-center gap-sm">
            <FolderOpen size={36} className="text-text-disabled" strokeWidth={1.6} />
            <p className="text-md font-semibold text-text">
              {tab === 'private'
                ? 'Belum ada paket soal di Bank Saya'
                : 'Belum ada paket soal yang dibagikan di Bank Sekolah'}
            </p>
            <p className="text-sm text-text-secondary">
              {tab === 'private'
                ? 'Klik "+ Paket Baru" untuk membuat wadah paket soal pertama Anda.'
                : 'Guru lain belum membagikan paket soal dengan visibilitas Sekolah.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {banks.map((bank) => (
              <div
                key={bank.id}
                className="bg-surface border border-border rounded-lg p-lg flex flex-col justify-between gap-md"
              >
                <div className="flex flex-col gap-sm">
                  <div className="flex items-start justify-between gap-sm">
                    <h3 className="text-lg font-bold text-text leading-snug">
                      {bank.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-xs px-sm py-xxs rounded-pill text-xs font-semibold shrink-0 ${
                        bank.visibility === 'school'
                          ? 'bg-soft-blue text-primary'
                          : 'bg-background border border-border text-text-secondary'
                      }`}
                    >
                      {bank.visibility === 'school' ? (
                        <>
                          <Globe size={12} />
                          <span>Sekolah</span>
                        </>
                      ) : (
                        <>
                          <Lock size={12} />
                          <span>Privat</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-sm text-xs text-text-secondary">
                    <span className="inline-flex items-center gap-xs">
                      <BookOpen size={14} />
                      {bank.subject?.name || '-'}
                    </span>
                    <span>•</span>
                    <span>Kelas {bank.grade}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-text-secondary pt-xs border-t border-border">
                    <span className="inline-flex items-center gap-xs">
                      <FileText size={15} />
                      <strong className="text-text">{bank.questions_count}</strong> Soal
                    </span>
                    <span className="inline-flex items-center gap-xs truncate max-w-[140px]">
                      <User size={14} />
                      {bank.owner_name}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                {tab === 'private' ? (
                  <div className="flex items-center gap-sm pt-xs">
                    <button
                      type="button"
                      onClick={() => onNavigate?.(`/guru/bank-soal/${bank.id}`)}
                      className="flex-1 min-h-[36px] px-md rounded-sm bg-primary hover:bg-navy text-white text-sm font-semibold inline-flex items-center justify-center gap-xs cursor-pointer transition-colors"
                    >
                      <Eye size={15} />
                      <span>Detail</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(bank)}
                      className="min-h-[36px] px-md rounded-sm border border-border bg-surface hover:bg-background text-text text-sm font-semibold inline-flex items-center justify-center cursor-pointer transition-colors"
                      title="Edit Paket"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(bank)}
                      className="min-h-[36px] px-md rounded-sm border border-coral/40 bg-coral/10 hover:bg-coral text-coral hover:text-white text-sm font-semibold inline-flex items-center justify-center cursor-pointer transition-colors"
                      title="Hapus Paket"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-sm pt-xs">
                    <button
                      type="button"
                      onClick={() => openDuplicateModal(bank)}
                      className="w-full min-h-[36px] px-md rounded-sm bg-primary hover:bg-navy text-white text-sm font-semibold inline-flex items-center justify-center gap-xs cursor-pointer transition-colors"
                    >
                      <Copy size={15} />
                      <span>Ambil ke Bank Saya</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Create / Edit Paket */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingBank ? 'Edit Paket Soal' : 'Buat Paket Soal Baru'}
      >
        <form onSubmit={handleSaveForm} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="text-sm font-semibold text-text">Nama Paket</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: UTS Matematika Ganjil"
              className="min-h-[48px] px-md rounded-md border border-border bg-surface text-md text-text"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-sm font-semibold text-text">Mata Pelajaran</label>
            <select
              required
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              className="min-h-[48px] px-md rounded-md border border-border bg-surface text-md text-text"
            >
              <option value="" disabled>
                Pilih Mata Pelajaran
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-sm font-semibold text-text">Kelas</label>
            <select
              required
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              className="min-h-[48px] px-md rounded-md border border-border bg-surface text-md text-text"
            >
              <option value="" disabled>
                Pilih Kelas
              </option>
              {rombels.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-sm font-semibold text-text">Visibilitas</label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
              className="min-h-[48px] px-md rounded-md border border-border bg-surface text-md text-text"
            >
              <option value="private">Privat (Hanya Saya)</option>
              <option value="school">Sekolah (Bagikan ke Guru Lain)</option>
            </select>
          </div>

          <div className="flex justify-end gap-sm pt-sm">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="min-h-[48px] px-lg rounded-md border border-border bg-surface text-text text-md font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[48px] px-xl rounded-md bg-primary hover:bg-navy text-white text-md font-semibold cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Paket Soal"
      >
        <div className="flex flex-col gap-md">
          <p className="text-md text-text">
            Apakah Anda yakin ingin menghapus paket soal{' '}
            <strong>{deleteTarget?.name}</strong>?
          </p>
          <div className="flex justify-end gap-sm">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="min-h-[48px] px-lg rounded-md border border-border bg-surface text-text text-md font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={submitting}
              className="min-h-[48px] px-xl rounded-md bg-coral text-white text-md font-semibold cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Duplikasi / Ambil ke Bank Saya */}
      <Modal
        isOpen={Boolean(duplicateTarget)}
        onClose={() => setDuplicateTarget(null)}
        title="Ambil ke Bank Saya"
      >
        <form onSubmit={handleConfirmDuplicate} className="flex flex-col gap-md">
          <p className="text-sm text-text-secondary">
            Paket ini akan disalin ke Bank Saya sebagai paket privat milik Anda.
          </p>
          <div className="flex flex-col gap-xs">
            <label className="text-sm font-semibold text-text">Nama Paket Salinan</label>
            <input
              type="text"
              required
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              className="min-h-[48px] px-md rounded-md border border-border bg-surface text-md text-text"
            />
          </div>
          <div className="flex justify-end gap-sm pt-sm">
            <button
              type="button"
              onClick={() => setDuplicateTarget(null)}
              className="min-h-[48px] px-lg rounded-md border border-border bg-surface text-text text-md font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[48px] px-xl rounded-md bg-primary hover:bg-navy text-white text-md font-semibold cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Menyalin...' : 'Salin Paket'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}

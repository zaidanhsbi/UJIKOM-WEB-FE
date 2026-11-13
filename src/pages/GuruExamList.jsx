import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Play,
  Square,
  Copy,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import AlertBanner from '../components/ui/AlertBanner';
import { GURU_MENUS } from '../config/navigation';
import {
  fetchExams,
  createExam,
  updateExam,
  deleteExam,
  startExam,
  finishExam,
} from '../services/guru.service';

const STATUS_BADGES = {
  draft: { label: 'Draf', cls: 'bg-background border border-border text-text-secondary' },
  scheduled: { label: 'Terjadwal', cls: 'bg-soft-blue text-primary' },
  ongoing: { label: 'Berlangsung', cls: 'bg-mint/20 text-text' },
  finished: { label: 'Selesai', cls: 'bg-yellow/20 text-text' },
};

function formatDateTime(iso) {
  if (!iso) return 'Fleksibel (Kapan saja)';
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Halaman daftar dan pengelolaan jadwal ujian oleh Guru. */
export default function GuruExamList({
  user,
  currentPath = '/guru/ujian',
  onNavigate,
  onLogout,
}) {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rombels, setRombels] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState({ type: '', message: '' });

  // Filters
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Wizard Modal
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [editingExam, setEditingExam] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [wizardError, setWizardError] = useState('');
  const [form, setForm] = useState({
    name: '',
    subject_id: '',
    rombel_ids: [],
    question_bank_id: '',
    starts_at: '',
    ends_at: '',
    duration_minutes: 60,
    shuffle_questions: false,
    shuffle_options: false,
  });

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchExams({
        search,
        subject_id: subjectFilter,
        status: statusFilter,
      });
      setExams(res.exams || []);
      setSubjects(res.subjects || []);
      setRombels(res.rombels || []);
      setBanks(res.question_banks || []);
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Gagal memuat daftar ujian.' });
    } finally {
      setLoading(false);
    }
  }, [search, subjectFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadData]);

  const openCreateWizard = () => {
    setEditingExam(null);
    setStep(1);
    setWizardError('');
    setForm({
      name: '',
      subject_id: subjects[0]?.id ? String(subjects[0].id) : '',
      rombel_ids: [],
      question_bank_id: banks[0]?.id ? String(banks[0].id) : '',
      starts_at: '',
      ends_at: '',
      duration_minutes: 60,
      shuffle_questions: false,
      shuffle_options: false,
    });
    setWizardOpen(true);
  };

  const openEditWizard = (exam) => {
    setEditingExam(exam);
    setStep(1);
    setWizardError('');
    setForm({
      name: exam.name,
      subject_id: String(exam.subject_id),
      rombel_ids: (exam.rombels || []).map((r) => r.id),
      question_bank_id: String(exam.question_bank_id),
      starts_at: exam.starts_at ? exam.starts_at.slice(0, 16) : '',
      ends_at: exam.ends_at ? exam.ends_at.slice(0, 16) : '',
      duration_minutes: exam.duration_minutes || 60,
      shuffle_questions: Boolean(exam.shuffle_questions),
      shuffle_options: Boolean(exam.shuffle_options),
    });
    setWizardOpen(true);
  };

  const toggleRombel = (rombelId) => {
    setForm((prev) => ({
      ...prev,
      rombel_ids: prev.rombel_ids.includes(rombelId)
        ? prev.rombel_ids.filter((id) => id !== rombelId)
        : [...prev.rombel_ids, rombelId],
    }));
  };

  const handleNextStep = () => {
    setWizardError('');
    if (step === 1) {
      if (!form.name.trim()) {
        setWizardError('Nama ujian wajib diisi.');
        return;
      }
      if (!form.subject_id) {
        setWizardError('Pilih mata pelajaran.');
        return;
      }
      if (form.rombel_ids.length === 0) {
        setWizardError('Pilih minimal satu kelas/rombel.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.question_bank_id) {
        setWizardError('Pilih paket soal terlebih dahulu.');
        return;
      }
      setStep(3);
    }
  };

  const handleSaveExam = async (action) => {
    try {
      setSubmitting(true);
      setWizardError('');
      const payload = {
        name: form.name.trim(),
        subject_id: Number(form.subject_id),
        rombel_ids: form.rombel_ids,
        question_bank_id: Number(form.question_bank_id),
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        duration_minutes: Number(form.duration_minutes) || 60,
        shuffle_questions: form.shuffle_questions,
        shuffle_options: form.shuffle_options,
        action,
      };

      if (editingExam) {
        await updateExam(editingExam.id, payload);
        setBanner({ type: 'success', message: 'Ujian berhasil diperbarui.' });
      } else {
        await createExam(payload);
        setBanner({
          type: 'success',
          message:
            action === 'publish'
              ? 'Ujian berhasil dipublikasikan dan siap dilaksanakan.'
              : 'Ujian berhasil disimpan sebagai draf.',
        });
      }
      setWizardOpen(false);
      loadData();
    } catch (err) {
      setWizardError(err.message || 'Gagal menyimpan ujian.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      await deleteExam(deleteTarget.id);
      setBanner({ type: 'success', message: 'Ujian berhasil dihapus.' });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Gagal menghapus ujian.' });
      setDeleteTarget(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyToken = (token) => {
    navigator.clipboard?.writeText(token);
    setBanner({ type: 'success', message: `Token ${token} disalin ke clipboard.` });
  };

  const handleStart = async (exam) => {
    try {
      await startExam(exam.id);
      setBanner({ type: 'success', message: `Ujian "${exam.name}" telah dimulai.` });
      loadData();
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Gagal memulai ujian.' });
    }
  };

  const handleFinish = async (exam) => {
    if (!window.confirm(`Akhiri ujian "${exam.name}" sekarang?`)) return;
    try {
      await finishExam(exam.id);
      setBanner({ type: 'success', message: `Ujian "${exam.name}" telah diakhiri.` });
      loadData();
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Gagal mengakhiri ujian.' });
    }
  };

  const selectedSubject = subjects.find((s) => String(s.id) === String(form.subject_id));
  const selectedBank = banks.find((b) => String(b.id) === String(form.question_bank_id));
  const selectedRombels = rombels.filter((r) => form.rombel_ids.includes(r.id));

  return (
    <AdminLayout
      user={user}
      currentPath={currentPath}
      onNavigate={onNavigate}
      onLogout={onLogout}
      menus={GURU_MENUS}
      headerTitle="Kelola Ujian"
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

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
          <div>
            <h1 className="text-xl font-bold text-text leading-tight">Daftar Ujian</h1>
            <p className="text-sm text-text-secondary mt-xs">
              Buat, jadwalkan, dan mulai ujian untuk rombel yang Anda ampu.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateWizard}
            className="min-h-[48px] px-xl bg-primary hover:bg-blue text-white font-semibold text-sm rounded-md transition-colors inline-flex items-center justify-center gap-sm cursor-pointer"
          >
            <Plus size={20} strokeWidth={1.5} className="shrink-0" />
            <span>Tambah Ujian</span>
          </button>
        </div>

        {/* Daftar Ujian */}
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Nama Ujian',
              sortable: true,
              render: (exam) => (
                <span className="font-semibold text-text">{exam.name}</span>
              ),
            },
            {
              key: 'subject',
              header: 'Mapel & Kelas',
              render: (exam) => (
                <div>
                  <div className="font-semibold text-text">{exam.subject?.name || '-'}</div>
                  <div className="text-xs text-text-secondary">
                    {(exam.rombels || []).map((r) => r.name).join(', ') || '-'}
                  </div>
                </div>
              ),
            },
            {
              key: 'question_bank_name',
              header: 'Paket Soal',
              render: (exam) => (
                <div>
                  <div className="text-text">{exam.question_bank_name}</div>
                  <div className="text-xs text-text-secondary">
                    {exam.questions_count} Soal
                  </div>
                </div>
              ),
            },
            {
              key: 'starts_at',
              header: 'Jadwal & Durasi',
              sortable: true,
              render: (exam) => (
                <div>
                  <div className="text-text">{formatDateTime(exam.starts_at)}</div>
                  {exam.ends_at && (
                    <div className="text-xs text-text-secondary">
                      s.d. {formatDateTime(exam.ends_at)}
                    </div>
                  )}
                  <div className="text-xs text-text-secondary">
                    {exam.duration_minutes} Menit
                  </div>
                </div>
              ),
            },
            {
              key: 'token',
              header: 'Token',
              render: (exam) =>
                exam.token ? (
                  <button
                    type="button"
                    onClick={() => handleCopyToken(exam.token)}
                    className="inline-flex items-center gap-xs px-sm py-xs rounded-sm bg-background border border-border font-mono text-xs font-bold text-text hover:bg-soft-blue cursor-pointer"
                    title="Salin Token"
                  >
                    <span>{exam.token}</span>
                    <Copy size={18} strokeWidth={1.5} />
                  </button>
                ) : (
                  '-'
                ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (exam) => {
                const badge = STATUS_BADGES[exam.status] || STATUS_BADGES.draft;
                return (
                  <span className={`px-sm py-xs rounded-pill text-xs font-semibold ${badge.cls}`}>
                    {badge.label}
                  </span>
                );
              },
            },
            {
              key: 'actions',
              header: 'Aksi',
              align: 'right',
              render: (exam) => (
                <div className="inline-flex items-center justify-end gap-xs">
                  {(exam.status === 'draft' || exam.status === 'scheduled') && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStart(exam)}
                        className="min-h-[36px] px-md py-xs rounded-sm bg-mint/20 hover:bg-mint text-text text-xs font-semibold inline-flex items-center gap-xs transition-colors cursor-pointer"
                        title="Mulai Ujian"
                      >
                        <Play size={18} strokeWidth={1.5} />
                        <span>Mulai</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditWizard(exam)}
                        className="min-h-[36px] px-md py-xs rounded-sm border border-light-blue text-primary hover:bg-soft-blue text-xs font-semibold transition-colors cursor-pointer"
                        title="Edit Ujian"
                      >
                        Edit
                      </button>
                    </>
                  )}
                  {exam.status === 'ongoing' && (
                    <button
                      type="button"
                      onClick={() => handleFinish(exam)}
                      className="min-h-[36px] px-md py-xs rounded-sm bg-alert-danger-bg hover:bg-coral text-alert-danger-text hover:text-white text-xs font-semibold inline-flex items-center gap-xs transition-colors cursor-pointer"
                      title="Akhiri Ujian"
                    >
                      <Square size={18} strokeWidth={1.5} />
                      <span>Akhiri</span>
                    </button>
                  )}
                  {exam.status !== 'ongoing' && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(exam)}
                      className="min-h-[36px] px-md py-xs rounded-sm bg-alert-danger-bg hover:bg-coral text-alert-danger-text hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                      title="Hapus Ujian"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          data={exams}
          loading={loading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari nama ujian..."
          emptyText="Belum ada ujian. Klik Tambah Ujian untuk membuat ujian baru menggunakan paket soal Anda."
          filterSlot={
            <div className="flex flex-wrap items-center gap-sm">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="min-h-[48px] px-md rounded-md border border-border bg-surface text-sm text-text"
              >
                <option value="">Semua Mata Pelajaran</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-h-[48px] px-md rounded-md border border-border bg-surface text-sm text-text"
              >
                <option value="">Semua Status</option>
                <option value="draft">Draf</option>
                <option value="scheduled">Terjadwal</option>
                <option value="ongoing">Berlangsung</option>
                <option value="finished">Selesai</option>
              </select>
            </div>
          }
        />
      </div>

      {/* Wizard 3 Langkah Modal */}
      <Modal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        title={editingExam ? 'Edit Ujian' : 'Buat Ujian Baru'}
        maxWidth="620px"
      >
        <div className="flex flex-col gap-lg">
          {wizardError && (
            <AlertBanner
              variant="error"
              message={wizardError}
              onClose={() => setWizardError('')}
            />
          )}

          {/* Stepper Indicator */}
          <div className="flex items-center justify-between text-xs font-semibold border-b border-border pb-sm">
            {[
              { num: 1, label: '1. Informasi Ujian' },
              { num: 2, label: '2. Pilih Paket Soal' },
              { num: 3, label: '3. Tinjau & Simpan' },
            ].map((s) => (
              <span
                key={s.num}
                className={step === s.num ? 'text-primary font-bold' : 'text-text-secondary'}
              >
                {s.label}
              </span>
            ))}
          </div>

          {step === 1 && (
            <div className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-sm font-semibold text-text">Nama Ujian</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: PTS Matematika Semester Ganjil"
                  className="min-h-[48px] px-md rounded-md border border-border bg-surface text-md text-text"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label className="text-sm font-semibold text-text">Mata Pelajaran</label>
                  <select
                    value={form.subject_id}
                    onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
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
                  <label className="text-sm font-semibold text-text">Durasi (Menit)</label>
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                    className="min-h-[48px] px-md rounded-md border border-border bg-surface text-md text-text"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-sm font-semibold text-text">Kelas / Rombel Peserta</label>
                <div className="flex flex-wrap gap-xs p-md rounded-md border border-border bg-background">
                  {rombels.map((r) => {
                    const checked = form.rombel_ids.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleRombel(r.id)}
                        className={`px-md py-xs rounded-pill border text-xs font-semibold cursor-pointer ${
                          checked
                            ? 'border-primary bg-soft-blue text-primary'
                            : 'border-border bg-surface text-text-secondary'
                        }`}
                      >
                        {r.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label className="text-sm font-semibold text-text">Waktu Mulai</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    className="min-h-[44px] px-md rounded-md border border-border bg-surface text-sm text-text"
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-sm font-semibold text-text">Waktu Selesai</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.ends_at}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                    className="min-h-[44px] px-md rounded-md border border-border bg-surface text-sm text-text"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="text-sm font-semibold text-text">Pilih Paket Soal</label>
                <div className="flex flex-col gap-sm max-h-[240px] overflow-y-auto">
                  {banks.length === 0 ? (
                    <p className="text-sm text-text-secondary">
                      Belum ada paket soal. Buat paket soal terlebih dahulu di menu Kelola Bank Soal.
                    </p>
                  ) : (
                    banks.map((b) => (
                      <label
                        key={b.id}
                        className={`p-md rounded-md border flex items-center justify-between cursor-pointer ${
                          String(form.question_bank_id) === String(b.id)
                            ? 'border-primary bg-soft-blue/50'
                            : 'border-border bg-surface'
                        }`}
                      >
                        <div className="flex items-center gap-sm">
                          <input
                            type="radio"
                            name="question_bank"
                            checked={String(form.question_bank_id) === String(b.id)}
                            onChange={() => setForm({ ...form, question_bank_id: String(b.id) })}
                          />
                          <div>
                            <div className="text-sm font-bold text-text">{b.name}</div>
                            <div className="text-xs text-text-secondary">
                              {b.subject_name} • Kelas {b.grade}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-primary">
                          {b.questions_count} Soal
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-sm pt-sm border-t border-border">
                <label className="inline-flex items-center gap-sm text-sm font-semibold text-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.shuffle_questions}
                    onChange={(e) => setForm({ ...form, shuffle_questions: e.target.checked })}
                  />
                  <span>Acak urutan soal untuk setiap siswa</span>
                </label>
                <label className="inline-flex items-center gap-sm text-sm font-semibold text-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.shuffle_options}
                    onChange={(e) => setForm({ ...form, shuffle_options: e.target.checked })}
                  />
                  <span>Acak pilihan jawaban (A-E)</span>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-md p-lg rounded-md bg-background border border-border text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Nama Ujian</span>
                <strong className="text-text">{form.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Mata Pelajaran</span>
                <strong className="text-text">{selectedSubject?.name || '-'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Kelas / Rombel</span>
                <strong className="text-text">
                  {selectedRombels.map((r) => r.name).join(', ') || '-'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Paket Soal</span>
                <strong className="text-text">
                  {selectedBank?.name || '-'} ({selectedBank?.questions_count || 0} Soal)
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Durasi</span>
                <strong className="text-text">{form.duration_minutes} Menit</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Pengacakan</span>
                <strong className="text-text">
                  {form.shuffle_questions ? 'Acak Soal' : 'Urut'}{' '}
                  {form.shuffle_options ? '• Acak Opsi' : ''}
                </strong>
              </div>
            </div>
          )}

          {/* Wizard Footer */}
          <div className="flex justify-between items-center pt-sm border-t border-border">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="min-h-[44px] px-lg rounded-md border border-border bg-surface text-text text-sm font-semibold inline-flex items-center gap-xs cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>Kembali</span>
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="min-h-[44px] px-xl rounded-md bg-primary hover:bg-navy text-white text-sm font-semibold inline-flex items-center gap-xs cursor-pointer"
              >
                <span>Lanjut</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <div className="flex gap-sm">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveExam('draft')}
                  className="min-h-[44px] px-lg rounded-md border border-border bg-surface text-text text-sm font-semibold cursor-pointer"
                >
                  Simpan Draf
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveExam('publish')}
                  className="min-h-[44px] px-xl rounded-md bg-primary hover:bg-navy text-white text-sm font-semibold cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan & Publikasikan'}
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Ujian"
      >
        <div className="flex flex-col gap-md">
          <p className="text-md text-text">
            Apakah Anda yakin ingin menghapus ujian <strong>{deleteTarget?.name}</strong>?
          </p>
          <div className="flex justify-end gap-sm">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="min-h-[44px] px-lg rounded-md border border-border bg-surface text-text text-sm font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={submitting}
              className="min-h-[44px] px-xl rounded-md bg-coral text-white text-sm font-semibold cursor-pointer"
            >
              {submitting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}

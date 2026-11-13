import { useCallback, useEffect, useState } from 'react';
import { Search, BarChart3, ChevronRight, Trash2 } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import AlertBanner from '../components/ui/AlertBanner';
import { GURU_MENUS } from '../config/navigation';
import { deleteRecap, fetchRecaps } from '../services/guru.service';

/** Halaman daftar rekapitulasi hasil ujian untuk Guru. */
export default function GuruRecapList({
  user,
  currentPath = '/guru/rekap-nilai',
  onNavigate,
  onLogout,
}) {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rombels, setRombels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [subjectFilter, setSubjectFilter] = useState('');
  const [rombelFilter, setRombelFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchRecaps({
        subject_id: subjectFilter,
        rombel_id: rombelFilter,
        date_from: dateFrom,
        date_to: dateTo,
        search,
      });
      setExams(res.exams || []);
      setSubjects(res.subjects || []);
      setRombels(res.rombels || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar rekap nilai.');
    } finally {
      setLoading(false);
    }
  }, [subjectFilter, rombelFilter, dateFrom, dateTo, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    const handleDelete = async (e, exam) => {
    e.stopPropagation();
    if (!window.confirm(`Hapus rekap ujian "${exam.name}"? Semua data nilai peserta akan ikut terhapus.`)) {
      return;
    }
    try {
      setError('');
      setSuccess('');
      await deleteRecap(exam.id);
      setSuccess(`Rekap ujian "${exam.name}" berhasil dihapus.`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Gagal menghapus rekap ujian.');
    }
  };

  return () => clearTimeout(timer);
  }, [loadData]);

  const handleDelete = async (e, exam) => {
    e.stopPropagation();
    if (!window.confirm(`Hapus rekap ujian "${exam.name}"? Semua data nilai peserta akan ikut terhapus.`)) {
      return;
    }
    try {
      setError('');
      setSuccess('');
      await deleteRecap(exam.id);
      setSuccess(`Rekap ujian "${exam.name}" berhasil dihapus.`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Gagal menghapus rekap ujian.');
    }
  };

  return (
    <AdminLayout
      user={user}
      currentPath={currentPath}
      onNavigate={onNavigate}
      onLogout={onLogout}
      menus={GURU_MENUS}
      headerTitle="Rekap Nilai"
      settingsPath="/guru/profil"
    >
      <div className="flex flex-col gap-lg w-full">
        {error && (
          <AlertBanner variant="error" message={error} onClose={() => setError('')} />
        )}
        {success && (
          <AlertBanner variant="success" message={success} onClose={() => setSuccess('')} />
        )}

        <div>
          <h1 className="text-xl font-bold text-text leading-tight">
            Rekap Nilai Ujian Selesai
          </h1>
          <p className="text-sm text-text-secondary mt-xxs">
            Pilih ujian yang telah selesai untuk melihat rekap nilai siswa dan analisis butir soal.
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-md">
          <div className="relative lg:col-span-2">
            <Search
              size={18}
              className="absolute left-md top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama ujian..."
              className="w-full min-h-[44px] pl-[40px] pr-md rounded-md border border-border bg-surface text-sm text-text"
            />
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="min-h-[44px] px-md rounded-md border border-border bg-surface text-sm text-text"
          >
            <option value="">Semua Mapel</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={rombelFilter}
            onChange={(e) => setRombelFilter(e.target.value)}
            className="min-h-[44px] px-md rounded-md border border-border bg-surface text-sm text-text"
          >
            <option value="">Semua Rombel</option>
            {rombels.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-xs">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full min-h-[44px] px-sm rounded-md border border-border bg-surface text-xs text-text"
              title="Dari tanggal"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full min-h-[44px] px-sm rounded-md border border-border bg-surface text-xs text-text"
              title="Sampai tanggal"
            />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="py-xxl text-center text-md text-text-secondary">
            Memuat daftar ujian selesai...
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-surface border border-border rounded-lg p-xxl flex flex-col items-center justify-center text-center gap-sm">
            <BarChart3 size={36} className="text-text-disabled" strokeWidth={1.6} />
            <p className="text-md font-semibold text-text">
              Belum ada ujian yang selesai
            </p>
            <p className="text-sm text-text-secondary">
              Rekap nilai akan muncul setelah Anda mengakhiri ujian di menu Kelola Ujian.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {exams.map((exam) => (
              <button
                key={exam.id}
                type="button"
                onClick={() => onNavigate?.(`/guru/rekap-nilai/${exam.id}`)}
                className="bg-surface border border-border hover:border-primary rounded-lg p-lg text-left flex flex-col justify-between gap-md cursor-pointer transition-colors"
              >
                <div className="flex flex-col gap-xs">
                  <div className="flex items-start justify-between gap-sm">
                    <h3 className="text-lg font-bold text-text">{exam.name}</h3>
                    <div className="flex items-center gap-xs shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, exam)}
                        title="Hapus Rekap"
                        className="p-xs rounded-md text-text-secondary hover:text-coral hover:bg-background transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                      <ChevronRight size={18} className="text-text-secondary" />
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary">
                    {exam.subject?.name || '-'} •{' '}
                    {(exam.rombels || []).map((r) => r.name).join(', ') || '-'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-sm border-t border-border text-sm">
                  <span className="text-text-secondary">
                    Peserta: <strong className="text-text">{exam.submissions_count}</strong>
                  </span>
                  <span className="text-text-secondary">
                    Rata-rata: <strong className="text-primary">{exam.average_score}</strong>
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

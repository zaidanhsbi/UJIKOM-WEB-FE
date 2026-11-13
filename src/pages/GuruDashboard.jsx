import { useEffect, useState } from 'react';
import {
  CalendarClock,
  FileText,
  Layers,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import StatCard from '../components/ui/StatCard';
import { GURU_MENUS } from '../config/navigation';
import { getGuruDashboardStats } from '../services/guru.service';

/** Halaman ringkasan dashboard untuk peran Guru. */
export default function GuruDashboard({
  user,
  currentPath = '/guru/beranda',
  onNavigate,
  onLogout,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadStats = async () => {
      try {
        setLoading(true);
        const res = await getGuruDashboardStats();
        if (active) {
          setData(res);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Gagal memuat data beranda guru.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadStats();
    return () => {
      active = false;
    };
  }, []);

  const teacherName = data?.teacher?.name || user?.name || 'Guru';
  const subjects = data?.teacher?.subjects || [];
  const rombels = data?.teacher?.rombels || [];
  const stats = data?.stats || { exams_today: 0, my_packages: 0, my_questions: 0 };
  const attentionItems = data?.attention_items || [];

  return (
    <AdminLayout
      user={user}
      currentPath={currentPath}
      onNavigate={onNavigate}
      onLogout={onLogout}
      menus={GURU_MENUS}
      headerTitle="Dashboard Guru"
      settingsPath="/guru/profil"
    >
      <div className="flex flex-col gap-xl w-full">
        {error && (
          <div className="bg-coral/15 border border-coral text-text rounded-md p-lg text-sm flex items-center gap-sm">
            <AlertCircle size={18} className="text-coral shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Header Selamat Datang (tanpa card, seragam dengan Beranda Admin) */}
        <section className="flex flex-col gap-sm">
          <div>
            <h1 className="text-xl font-bold text-text leading-tight">
              Beranda
            </h1>
            <p className="text-sm text-text-secondary mt-xxs">
              Selamat datang, {teacherName}. 
            </p>
          </div>

          <div className="flex flex-col gap-sm pt-xs">
            <div className="flex flex-wrap items-center gap-sm">
              <span className="text-xs font-semibold text-text-secondary min-w-[110px]">
                Mata Pelajaran:
              </span>
              {loading ? (
                <span className="text-xs text-text-disabled">Memuat...</span>
              ) : subjects.length > 0 ? (
                subjects.map((subject) => (
                  <span
                    key={subject.id}
                    className="inline-flex items-center px-md py-xs rounded-pill bg-soft-blue text-primary text-xs font-semibold"
                  >
                    {subject.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-text-disabled">
                  Belum ada mata pelajaran ditugaskan
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-sm">
              <span className="text-xs font-semibold text-text-secondary min-w-[110px]">
                Rombel Diampu:
              </span>
              {loading ? (
                <span className="text-xs text-text-disabled">Memuat...</span>
              ) : rombels.length > 0 ? (
                rombels.map((rombel) => (
                  <span
                    key={rombel.id}
                    className="inline-flex items-center px-md py-xs rounded-pill bg-background border border-border text-text text-xs font-semibold"
                  >
                    {rombel.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-text-disabled">
                  Belum ada rombel ditugaskan
                </span>
              )}
            </div>
          </div>
        </section>

        {/* 2. Tiga Kartu Angka */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-lg">
          <StatCard
            title="Ujian Hari Ini"
            value={loading ? '...' : stats.exams_today}
            subtitle="Jadwal ujian aktif hari ini"
            icon={<CalendarClock size={20} strokeWidth={1.5} />}
          />
          <StatCard
            title="Paket Soal Saya"
            value={loading ? '...' : stats.my_packages}
            subtitle="Paket soal siap diujikan"
            icon={<Layers size={20} strokeWidth={1.5} />}
          />
          <StatCard
            title="Total Soal Saya"
            value={loading ? '...' : stats.my_questions}
            subtitle="Butir soal di bank pribadi"
            icon={<FileText size={20} strokeWidth={1.5} />}
          />
        </section>

        {/* 3. Kartu Perlu Perhatian */}
        <section className="bg-surface border border-border rounded-lg p-lg flex flex-col gap-md">
          <h2 className="text-lg font-bold text-text">Perlu Perhatian</h2>
            {attentionItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-xl px-md bg-background rounded-md border border-border gap-sm">
                <CheckCircle2 size={32} className="text-mint" strokeWidth={1.6} />
                <p className="text-md font-semibold text-text">
                  Semua berjalan lancar
                </p>
                <p className="text-sm text-text-secondary">
                  Belum ada siswa yang tertunda sinkronisasi atau ujian yang perlu ditindaklanjuti.
                </p>
              </div>
            ) : null}
        </section>
      </div>
    </AdminLayout>
  );
}

import { useEffect, useState } from 'react';
import { Users, GraduationCap, ClipboardList, ShieldCheck } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import StatCard from '../components/ui/StatCard';
import AlertBanner from '../components/ui/AlertBanner';
import { fetchAdminDashboardStatsApi } from '../services/dashboardService';

/** Halaman ringkasan dashboard untuk peran Admin. */
export default function AdminDashboard({
  user,
  restrictedMode,
  currentPath = '/admin/beranda',
  onNavigate,
  onLogout,
}) {
  const [stats, setStats] = useState({
    total_students: 0,
    total_teachers: 0,
    total_rombels: 0,
    active_exams: 0,
    license: null,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      setLoading(true);
      setErrorMessage('');
      try {
        const data = await fetchAdminDashboardStatsApi();
        if (isMounted) {
          setStats({
            total_students: data.total_students ?? 0,
            total_teachers: data.total_teachers ?? 0,
            total_rombels: data.total_rombels ?? 0,
            active_exams: data.active_exams ?? 0,
            license: data.license ?? null,
          });
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(err.message || 'Gagal memuat statistik dari server.');
          if (err.status === 401 && onLogout) {
            onLogout();
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [onLogout]);

  const adminName = user?.name || 'Administrator Sekolah';
  const license = stats.license || user?.license || null;
  const maxStudents = license?.max_students || 500;
  const usedStudents = stats.total_students;

  const { licenseValue, licenseSubtitle } = (() => {
    if (!license?.expires_at) {
      return { licenseValue: '-', licenseSubtitle: 'Belum ada lisensi aktif' };
    }
    const expiresDate = new Date(license.expires_at);
    const diffDays = Math.ceil((expiresDate.getTime() - now) / 86400000);
    const formattedDate = expiresDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    if (diffDays <= 0 || license.is_valid === false) {
      return { licenseValue: 'Kedaluwarsa', licenseSubtitle: `Berakhir ${formattedDate}` };
    }
    return {
      licenseValue: `${diffDays.toLocaleString('id-ID')} Hari`,
      licenseSubtitle: `Sisa masa aktif (s.d. ${formattedDate})`,
    };
  })();

  return (
    <AdminLayout
      user={user}
      currentPath={currentPath}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="flex flex-col gap-xl">
        {/* Banner Peringatan Mode Terbatas (Jika Lisensi Kedaluwarsa) */}
        {(restrictedMode || (stats.license && !stats.license.is_valid)) && (
          <div
            role="alert"
            className="p-lg rounded-md bg-yellow border border-yellow text-navy text-sm font-medium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm"
          >
            <div>
              <strong className="font-bold">Mode Terbatas Aktif:</strong> Masa aktif lisensi sekolah telah berakhir. Anda tetap dapat melihat nilai dan mengekspor data, namun tidak dapat memulai ujian baru.
            </div>
            <span className="inline-block px-md py-xs rounded-pill bg-white text-navy text-xs font-bold shrink-0">
              Lisensi Kedaluwarsa
            </span>
          </div>
        )}

        {/* Heading Beranda & Subjudul */}
        <div>
          <h1 className="text-xl font-bold text-text leading-tight">
            Beranda
          </h1>
          <p className="text-sm text-text-secondary mt-xs">
            Selamat datang, {adminName}
          </p>
        </div>

        {/* Pesan Galat jika API gagal */}
        <AlertBanner
          variant="error"
          message={errorMessage}
          onClose={() => setErrorMessage('')}
        />

        {/* Grid Kartu Statistik (Reusable StatCard dengan gap-md = 12px) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
          <StatCard
            title="Total Siswa"
            value={loading ? '...' : stats.total_students.toLocaleString('id-ID')}
            subtitle="Siswa terdaftar"
            icon={<GraduationCap size={18} strokeWidth={1.8} />}
          />

          <StatCard
            title="Total Guru"
            value={loading ? '...' : stats.total_teachers.toLocaleString('id-ID')}
            subtitle="Guru pengampu"
            icon={<Users size={18} strokeWidth={1.8} />}
          />

          <StatCard
            title="Sisa Lisensi"
            value={loading ? '...' : licenseValue}
            subtitle={loading ? 'Memuat...' : licenseSubtitle}
            icon={<ClipboardList size={18} strokeWidth={1.8} />}
          />

          <StatCard
            title="Kuota Lisensi"
            value={loading ? '...' : `${usedStudents}/${maxStudents}`}
            subtitle="Siswa terdaftar dari kuota"
            icon={<ShieldCheck size={18} strokeWidth={1.8} />}
          />
        </div>
      </div>
    </AdminLayout>
  );
}

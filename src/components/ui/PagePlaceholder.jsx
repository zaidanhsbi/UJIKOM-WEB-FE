import { logoutApi } from '../../services/auth';
import AlertBanner from './AlertBanner';

/**
 * Komponen Placeholder Halaman Reusable
 * Bisa dipakai untuk halaman yang masih dalam tahap pengembangan (baik di dalam Layout maupun standalone seperti GuruDashboard sebelum halaman Guru dibangun).
 */
export default function PagePlaceholder({
  badgeText = 'Dalam Pengembangan',
  title = 'Halaman Sedang Disiapkan',
  description = 'Fitur ini akan segera tersedia pada tahap pengembangan berikutnya.',
  user,
  restrictedMode = false,
  onLogout,
  standalone = false,
}) {
  const handleLogout = async () => {
    await logoutApi();
    if (onLogout) onLogout();
  };

  const cardContent = (
    <>
      {restrictedMode && (
        <AlertBanner
          variant="warning"
          message="Mode Terbatas Aktif: Masa aktif lisensi sekolah telah habis. Anda tetap dapat melihat nilai dan mengekspor laporan."
        />
      )}

      <div className="bg-surface border border-border rounded-lg shadow-sm p-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div>
          {badgeText && (
            <span className="inline-block px-md py-xs rounded-pill bg-soft-blue text-navy text-xs font-semibold mb-sm">
              {badgeText}
            </span>
          )}
          <h1 className="text-xl font-bold text-navy leading-tight">
            {title}
          </h1>
          <p className="text-sm text-text-secondary mt-xs">
            {description}
            {user?.name && (
              <>
                {' '}— Masuk sebagai <strong className="text-navy">{user.name}</strong>
              </>
            )}
          </p>
        </div>

        {standalone && onLogout && (
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[44px] px-xl rounded-md border border-light-blue text-primary hover:bg-soft-blue font-semibold text-sm transition-colors cursor-pointer shrink-0"
          >
            Keluar
          </button>
        )}
      </div>
    </>
  );

  if (standalone) {
    return (
      <div className="min-h-screen bg-background p-lg md:p-xxl">
        <div className="max-w-[960px] mx-auto">{cardContent}</div>
      </div>
    );
  }

  return cardContent;
}


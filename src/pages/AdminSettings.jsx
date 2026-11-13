import { useState } from 'react';
import { Building2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import AlertBanner from '../components/ui/AlertBanner';
import FormInput from '../components/ui/FormInput';
import BaseButton from '../components/ui/BaseButton';
import { useAdminSettings } from '../hooks/useAdminSettings';
import { useChangePassword } from '../hooks/useChangePassword';

/** Halaman pengaturan aplikasi dan ubah kata sandi untuk Admin. */
export default function AdminSettings({
  user,
  restrictedMode,
  currentPath,
  onNavigate,
  onLogout,
}) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const settings = useAdminSettings();
  const password = useChangePassword();

  const renderToggle = (visible, onToggle) => (
    <button
      type="button"
      onClick={onToggle}
      className="p-xs text-text-secondary hover:text-navy cursor-pointer"
      aria-label={visible ? 'Sembunyikan sandi' : 'Lihat sandi'}
    >
      {visible ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
    </button>
  );

  return (
    <AdminLayout
      user={user}
      restrictedMode={restrictedMode}
      currentPath={currentPath}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="max-w-[760px] mx-auto space-y-lg">
        <div>
          <h1 className="text-xl font-bold text-text">Pengaturan & Keamanan</h1>
          <p className="text-sm text-text-secondary mt-xxs">
            Kelola profil sekolah, tahun ajaran aktif, dan keamanan akun administrator.
          </p>
        </div>

        <form
          onSubmit={settings.saveSettings}
          className="bg-surface border border-border rounded-lg p-xl space-y-lg"
        >
          <div className="flex items-center gap-xs text-text font-bold text-md border-b border-border pb-sm">
            <Building2 size={18} strokeWidth={1.5} />
            <span>Profil Sekolah</span>
          </div>

          {settings.error && (
            <AlertBanner
              variant="error"
              message={settings.error}
              onClose={settings.clearAlert}
            />
          )}
          {settings.success && (
            <AlertBanner
              variant="success"
              message={settings.success}
              onClose={settings.clearAlert}
            />
          )}

          <FormInput
            id="school_name"
            label="Nama Sekolah"
            value={settings.form.school_name}
            onChange={(e) => settings.updateField('school_name', e.target.value)}
            placeholder="Contoh: SMK Negeri 1 Nusantara"
            required
            disabled={settings.loading || settings.saving}
          />

          <FormInput
            id="npsn"
            label="NPSN"
            value={settings.form.npsn}
            onChange={(e) => settings.updateField('npsn', e.target.value)}
            placeholder="Contoh: 20201234"
            required
            disabled={settings.loading || settings.saving}
          />

          <div className="pt-xs">
            <BaseButton type="submit" variant="primary" loading={settings.saving}>
              Simpan Perubahan
            </BaseButton>
          </div>
        </form>

        <form
          onSubmit={password.submitPassword}
          className="bg-surface border border-border rounded-lg p-xl space-y-lg"
        >
          <div className="flex items-center gap-xs text-text font-bold text-md border-b border-border pb-sm">
            <ShieldCheck size={18} strokeWidth={1.5} />
            <span>Keamanan</span>
          </div>

          {password.error && (
            <AlertBanner
              variant="error"
              message={password.error}
              onClose={password.clearAlert}
            />
          )}
          {password.success && (
            <AlertBanner
              variant="success"
              message={password.success}
              onClose={password.clearAlert}
            />
          )}

          <FormInput
            id="current_password"
            label="Password Saat Ini"
            type={showCurrent ? 'text' : 'password'}
            value={password.form.current_password}
            onChange={(e) =>
              password.updateField('current_password', e.target.value)
            }
            placeholder="Masukkan password saat ini"
            required
            disabled={password.saving}
            rightElement={renderToggle(showCurrent, () =>
              setShowCurrent((v) => !v)
            )}
          />

          <FormInput
            id="new_password"
            label="Password Baru (Min. 8 Karakter)"
            type={showNew ? 'text' : 'password'}
            value={password.form.new_password}
            onChange={(e) => password.updateField('new_password', e.target.value)}
            placeholder="Masukkan password baru"
            required
            disabled={password.saving}
            rightElement={renderToggle(showNew, () => setShowNew((v) => !v))}
          />

          <FormInput
            id="new_password_confirmation"
            label="Konfirmasi Password Baru"
            type={showConfirm ? 'text' : 'password'}
            value={password.form.new_password_confirmation}
            onChange={(e) =>
              password.updateField('new_password_confirmation', e.target.value)
            }
            placeholder="Ulangi password baru"
            required
            disabled={password.saving}
            rightElement={renderToggle(showConfirm, () =>
              setShowConfirm((v) => !v)
            )}
          />

          <div className="pt-xs">
            <BaseButton type="submit" variant="primary" loading={password.saving}>
              Ganti Password
            </BaseButton>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

import { useState } from 'react';
import { School, Mail, Lock } from 'lucide-react';
import { loginApi, setAuthSession } from '../services/auth';
import logoUrl from '../assets/Logo.svg';
import mapUrl from '../assets/Indonesia_Map.svg';

/** Halaman login untuk autentikasi Admin dan Guru. */
export default function LoginPage({ onLoginSuccess }) {
  const [npsn, setNpsn] = useState('20201234');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setErrorCode('');

    if (!identifier.trim() || !password) {
      setErrorMessage('Mohon isi Email / Username / NISN dan Kata Sandi Anda.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginApi({
        npsn,
        identifier,
        password,
      });

      if (result.user?.role !== 'admin' && result.user?.role !== 'guru') {
        setErrorMessage('Akun siswa hanya dapat digunakan di aplikasi mobile BinoExam.');
        setErrorCode('ROLE_NOT_ALLOWED');
        return;
      }

      setAuthSession(result.token, result.user, result.restricted_mode);

      if (onLoginSuccess) {
        onLoginSuccess(result.user, result.token, result.restricted_mode);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal terhubung ke server. Periksa koneksi Anda.');
      setErrorCode(err.code || 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface flex flex-col lg:flex-row font-sans">
      {/* ================= KOLOM KIRI (HANYA TAMPIL DI DESKTOP lg:flex) ================= */}
      <div className="hidden lg:flex relative lg:w-1/2 overflow-hidden flex-col justify-between px-[88px] py-[72px] bg-gradient-to-b from-surface via-[#F1F6FE] to-soft-blue">
        {/* Background Peta Indonesia */}
        <img
          src={mapUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 w-[115%] max-w-none object-contain"
        />

        {/* Logo Atas — Teks BinoExam 36px (text-xxxl) & gap 20px */}
        <div className="relative z-10 flex items-center gap-[20px] pl-[36px] pt-[16px]">
          <img
            src={logoUrl}
            alt="Logo BinoExam"
            className="w-[40px] h-[41px] shrink-0"
          />
          <span className="text-xxxl font-bold text-navy tracking-tight leading-tight">
            BinoExam
          </span>
        </div>

        {/* Teks Utama Tengah — Judul 36px (text-xxxl), Deskripsi 16px (text-md), Gap 20px */}
        <div className="relative z-10 my-auto flex flex-col gap-[20px] max-w-[480px]">
          <h1 className="text-xxxl font-bold text-navy leading-tight">
            Hadapi Ujian
            <br />
            dengan Senyuman
            <br />
            dan Kenyamanan
          </h1>
          <p className="text-md text-text-secondary leading-normal">
            BinoExam merupakan Aplikasi CBT dengan pendekatan semi-offline yang
            ramah guru, hemat server, dan tetap berjalan lancar meski listrik
            atau internet bermasalah.
          </p>
        </div>

        {/* Spacer bawah untuk keseimbangan vertikal */}
        <div className="h-[41px]" />
      </div>

      {/* ================= KOLOM KANAN (FORM SELAMAT DATANG — TAMPIL DI MOBILE & DESKTOP) ================= */}
      <div className="w-full lg:w-1/2 min-h-screen bg-surface flex flex-col justify-center items-center px-xl py-xxl sm:px-[64px] lg:px-[88px]">
        <div className="w-full max-w-[440px] flex flex-col gap-[20px]">
          {/* Judul Selamat Datang! 36px (text-xxxl) */}
          <h2 className="text-xxxl font-bold text-text leading-tight">
            Selamat Datang!
          </h2>

          {/* Pesan Error / Status Lisensi */}
          {errorMessage && !loading && (
            <div
              role="alert"
              className={`p-md rounded-md border text-md font-medium ${
                errorCode === 'LICENSE_EXPIRED' || errorCode === 'LICENSE_SUSPENDED'
                  ? 'bg-yellow border-yellow text-navy'
                  : 'bg-coral border-coral text-navy'
              }`}
            >
              <div className="font-bold mb-xxs">
                {errorCode === 'LICENSE_EXPIRED'
                  ? 'Masa Aktif Lisensi Berakhir'
                  : errorCode === 'SCHOOL_NOT_FOUND'
                  ? 'Sekolah Tidak Ditemukan'
                  : 'Gagal Masuk'}
              </div>
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Form dengan Gap 20px antar elemen */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]" noValidate>
            {/* Input 1: NPSN Sekolah */}
            <div className="relative">
              <label htmlFor="npsn" className="sr-only">
                NPSN Sekolah
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-[20px] flex items-center text-text-disabled">
                <School size={20} strokeWidth={1.75} />
              </div>
              <input
                id="npsn"
                name="npsn"
                type="text"
                inputMode="numeric"
                autoComplete="organization"
                placeholder="NPSN Sekolah"
                value={npsn}
                onChange={(e) => setNpsn(e.target.value)}
                disabled={loading}
                className="w-full h-[52px] pl-[52px] pr-[20px] bg-white border border-border rounded-md text-md text-text placeholder:text-text-disabled focus:outline-none focus:border-primary disabled:bg-background transition-colors"
              />
            </div>

            {/* Input 2: Email / Username / NISN */}
            <div className="relative">
              <label htmlFor="identifier" className="sr-only">
                Email, Username, atau NISN
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-[20px] flex items-center text-text-disabled">
                <Mail size={20} strokeWidth={1.75} />
              </div>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                placeholder="Username / NUPTK"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                required
                className="w-full h-[52px] pl-[52px] pr-[20px] bg-white border border-border rounded-md text-md text-text placeholder:text-text-disabled focus:outline-none focus:border-primary disabled:bg-background transition-colors"
              />
            </div>

            {/* Input 3: Kata Sandi */}
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Kata Sandi
              </label>
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-[20px] flex items-center text-text-disabled">
                <Lock size={20} strokeWidth={1.75} />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Kata Sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="w-full h-[52px] pl-[52px] pr-[64px] bg-white border border-border rounded-md text-md text-text placeholder:text-text-disabled focus:outline-none focus:border-primary disabled:bg-background transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-[20px] flex items-center text-sm font-medium text-text-secondary hover:text-navy cursor-pointer"
                aria-label={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
              >
                {showPassword ? 'Tutup' : 'Lihat'}
              </button>
            </div>

            {/* Tombol Sign In (hanya teks tanpa ikon spinner) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] px-xl bg-navy hover:bg-primary disabled:bg-text-disabled text-white font-semibold text-md rounded-md transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Memeriksa lisensi...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

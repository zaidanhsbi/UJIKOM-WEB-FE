import { useState, useRef, useEffect } from 'react';
import {
  Home,
  BookOpen,
  LayoutGrid,
  GraduationCap,
  Users,
  Settings,
  Menu,
  FileText,
  ClipboardList,
  BarChart3,
  HelpCircle,
  User,
} from 'lucide-react';
import { logoutApi } from '../services/auth';
import { ADMIN_MENUS } from '../config/navigation';
import logoUrl from '../assets/Logo-Putih.svg';

function MenuIcon({ name }) {
  switch (name) {
    case 'home':
      return <Home size={20} strokeWidth={1.8} />;
    case 'book':
      return <BookOpen size={20} strokeWidth={1.8} />;
    case 'rombels':
      return <LayoutGrid size={20} strokeWidth={1.8} />;
    case 'students':
      return <GraduationCap size={20} strokeWidth={1.8} />;
    case 'teachers':
      return <Users size={20} strokeWidth={1.8} />;
    case 'bank-soal':
      return <FileText size={20} strokeWidth={1.8} />;
    case 'clipboard':
      return <ClipboardList size={20} strokeWidth={1.8} />;
    case 'rekap':
      return <BarChart3 size={20} strokeWidth={1.8} />;
    case 'panduan':
      return <HelpCircle size={20} strokeWidth={1.8} />;
    case 'profil':
      return <User size={20} strokeWidth={1.8} />;
    case 'settings':
      return <Settings size={20} strokeWidth={1.8} />;
    default:
      return null;
  }
}

function getInitials(name = 'Admin Sekolah') {
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Komponen layout utama dengan sidebar navigasi dan header untuk panel Admin/Guru. */
export default function AdminLayout({
  user,
  currentPath = '/admin/beranda',
  onNavigate,
  onLogout,
  menus = ADMIN_MENUS,
  headerTitle = 'Dashboard Admin',
  settingsPath = '/admin/pengaturan',
  sidebarFooter = null,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const profileDropdownRef = useRef(null);

  const displayName = user?.name || 'Administrator Sekolah';
  const roleLabel = user?.school?.name || 'Admin Sekolah';
  const initials = getInitials(displayName);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = async () => {
    setLoggingOut(true);
    await logoutApi();
    setLoggingOut(false);
    setProfileMenuOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  const handleMenuSelect = (targetPath) => {
    setMobileDrawerOpen(false);
    if (onNavigate) {
      onNavigate(targetPath);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex font-sans text-text">
      {/* ================= OVERLAY MOBILE DRAWER ================= */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-text/40 lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ================= SIDEBAR KIRI (NAVY #1E3A8A — Sesuai Desain Figma) ================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static bg-navy text-white flex flex-col shrink-0 transition-all duration-200 ${
          mobileDrawerOpen
            ? 'translate-x-0 w-[280px] p-xl gap-xl'
            : '-translate-x-full lg:translate-x-0'
        } ${
          sidebarOpen
            ? 'lg:w-[280px] lg:p-xl lg:gap-xl'
            : 'lg:w-0 lg:p-0 lg:overflow-hidden'
        }`}
      >
        {/* 1. Brand Header di Sidebar (Logo Putih + Teks BinoExam langsung di atas latar Navy) */}
        <div className="flex items-center gap-md px-xs">
          <img
            src={logoUrl}
            alt="Logo BinoExam"
            className="w-[32px] h-[32px] object-contain shrink-0"
          />
          <span className="text-lg font-bold text-white leading-tight truncate">
            BinoExam
          </span>
        </div>

        {/* 2. Daftar Menu Navigasi (Gap 12px / gap-md sesuai Figma) */}
        <nav className="flex flex-col gap-md flex-1" aria-label="Menu Navigasi">
          {menus.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMenuSelect(item.path)}
                className={`w-full min-h-[48px] px-lg rounded-md flex items-center gap-md text-md transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-primary text-white font-semibold'
                    : 'text-white/85 font-medium hover:bg-primary/40 hover:text-white'
                }`}
              >
                <span className="shrink-0">
                  <MenuIcon name={item.icon} />
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {sidebarFooter && (
          <div className="mt-auto pt-lg border-t border-white/15">
            {sidebarFooter}
          </div>
        )}
      </aside>

      {/* ================= AREA UTAMA KANAN ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Atas Putih (Persis Gambar 2: Kiri Toggle + Judul, Kanan Gear + Lingkaran Inisial) */}
        <header className="h-[68px] bg-surface border-b border-border px-lg lg:px-xxl flex items-center justify-between shrink-0">
          {/* Kiri: Tombol Hamburger di dalam kotak border + Judul Halaman (gap-md = 12px) */}
          <div className="flex items-center gap-md">
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileDrawerOpen((prev) => !prev);
                } else {
                  setSidebarOpen((prev) => !prev);
                }
              }}
              className="w-[40px] h-[40px] rounded-sm border border-border bg-surface hover:bg-background text-text flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Buka atau tutup menu samping"
            >
              <Menu size={18} strokeWidth={2} />
            </button>

            <span className="text-md font-bold text-text">
              {headerTitle}
            </span>
          </div>

          {/* Kanan: Hanya Tombol Gear & Lingkaran Inisial (gap-md = 12px) sesuai Gambar 2 */}
          <div className="relative flex items-center gap-md" ref={profileDropdownRef}>
            {/* Tombol Ikon Pengaturan (Kotak Rounded Border) */}
            <button
              type="button"
              onClick={() => handleMenuSelect(settingsPath)}
              className="w-[40px] h-[40px] rounded-sm border border-border bg-surface hover:bg-background text-text flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Pengaturan"
              title="Pengaturan"
            >
              <MenuIcon name="settings" />
            </button>

            {/* Lingkaran Inisial Avatar (Klik untuk membuka menu Profil & Logout) */}
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="w-[40px] h-[40px] rounded-pill border border-border bg-background hover:bg-soft-blue text-text text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              aria-label="Menu Profil dan Keluar"
              title={`${displayName} (Klik untuk Logout)`}
            >
              {initials}
            </button>

            {/* Dropdown Profil & Tombol Logout */}
            {profileMenuOpen && (
              <div className="absolute right-0 top-[48px] z-50 w-[220px] bg-surface border border-border rounded-md shadow-md p-md flex flex-col gap-sm">
                <div className="px-sm py-xs border-b border-border">
                  <div className="text-sm font-bold text-text truncate">
                    {displayName}
                  </div>
                  <div className="text-xs text-text-secondary truncate">
                    {roleLabel}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  disabled={loggingOut}
                  className="w-full min-h-[36px] px-md py-xs rounded-sm bg-coral/15 hover:bg-coral text-navy hover:text-white text-sm font-semibold text-left transition-colors cursor-pointer"
                >
                  {loggingOut ? 'Keluar...' : 'Keluar (Logout)'}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Konten Halaman */}
        <main className="flex-1 p-lg lg:p-xxl overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import AdminLayout from './components/AdminLayout';
import PagePlaceholder from './components/ui/PagePlaceholder';
import {
  getAuthSession,
  setAuthSession,
  clearAuthSession,
  fetchUserProfileApi,
} from './services/auth';

// Lazy loading per halaman agar ukuran bundle awal sangat kecil
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SubjectManagement = lazy(() => import('./pages/SubjectManagement'));
const RombelManagement = lazy(() => import('./pages/RombelManagement'));
const AcademicYearManagement = lazy(() => import('./pages/AcademicYearManagement'));
const StudentManagement = lazy(() => import('./pages/StudentManagement'));
const TeacherManagement = lazy(() => import('./pages/TeacherManagement'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const GuruDashboard = lazy(() => import('./pages/GuruDashboard'));
const GuruQuestionBankList = lazy(() => import('./pages/GuruQuestionBankList'));
const GuruQuestionBankDetail = lazy(() => import('./pages/GuruQuestionBankDetail'));
const GuruQuestionEditor = lazy(() => import('./pages/GuruQuestionEditor'));
const GuruExamList = lazy(() => import('./pages/GuruExamList'));
const GuruRecapList = lazy(() => import('./pages/GuruRecapList'));
const GuruRecapDetail = lazy(() => import('./pages/GuruRecapDetail'));

function RouteFallback() {
  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center text-sm font-medium text-text-secondary">
      Memuat halaman...
    </div>
  );
}

function App() {
  const [path, setPath] = useState(() => window.location.pathname);
  const [session, setSession] = useState(() => getAuthSession());

  // useCallback dipakai agar fungsi navigate stabil saat digunakan di dalam useEffect autentikasi
  const navigate = useCallback((targetPath) => {
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setPath(targetPath);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!session.token) return;

    let isMounted = true;
    fetchUserProfileApi()
      .then((freshUser) => {
        if (isMounted && freshUser) {
          setAuthSession(session.token, freshUser, session.restrictedMode);
          setSession((prev) => ({ ...prev, user: freshUser }));
        }
      })
      .catch((err) => {
        if (isMounted && err.status === 401) {
          clearAuthSession();
          setSession({ token: null, user: null, restrictedMode: false });
          navigate('/login');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session.token, session.restrictedMode, navigate]);

  useEffect(() => {
    const { token, user } = session;

    if (!token || !user) {
      if (window.location.pathname !== '/login') {
        window.history.replaceState({}, '', '/login');
      }
      return;
    }

    if (path === '/' || path === '/masuk' || path === '/login') {
      const target =
        user.role === 'admin'
          ? '/admin/beranda'
          : user.role === 'guru'
          ? '/guru/beranda'
          : '/masuk';
      if (window.location.pathname !== target) {
        window.history.replaceState({}, '', target);
      }
    }
  }, [session, path]);

  const handleLoginSuccess = (user, token, restrictedMode) => {
    setSession({ user, token, restrictedMode: Boolean(restrictedMode) });

    if (user?.role === 'admin') {
      navigate('/admin/beranda');
    } else if (user?.role === 'guru') {
      navigate('/guru/beranda');
    } else {
      navigate('/masuk');
    }
  };

  // useCallback dipakai karena diteruskan ke hook halaman (seperti useSubjects) yang menjadikannya dependency efek
  const handleLogout = useCallback(() => {
    clearAuthSession();
    setSession({ token: null, user: null, restrictedMode: false });
    navigate('/login');
  }, [navigate]);

  // Hitung rute efektif berdasarkan sesi login tanpa memanggil setState sinkron di useEffect
  const effectivePath = (() => {
    if (!session.token || !session.user) {
      return '/masuk';
    }
    if (path === '/' || path === '/masuk' || path === '/login') {
      return session.user.role === 'admin'
        ? '/admin/beranda'
        : session.user.role === 'guru'
        ? '/guru/beranda'
        : '/masuk';
    }
    return path;
  })();

  if (
    effectivePath.startsWith('/admin') &&
    session.token &&
    session.user?.role === 'admin'
  ) {
    if (effectivePath === '/admin/mata-pelajaran') {
      return (
        <Suspense fallback={<RouteFallback />}>
          <SubjectManagement
            user={session.user}
            restrictedMode={session.restrictedMode}
            currentPath={effectivePath}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        </Suspense>
      );
    }

    if (effectivePath === '/admin/academic-years') {
      return (
        <Suspense fallback={<RouteFallback />}>
          <AcademicYearManagement
            user={session.user}
            restrictedMode={session.restrictedMode}
            currentPath={effectivePath}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        </Suspense>
      );
    }

    if (effectivePath === '/admin/kelas') {
      return (
        <Suspense fallback={<RouteFallback />}>
          <RombelManagement
            user={session.user}
            restrictedMode={session.restrictedMode}
            currentPath={effectivePath}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        </Suspense>
      );
    }

    if (effectivePath === '/admin/siswa') {
      return (
        <Suspense fallback={<RouteFallback />}>
          <StudentManagement
            user={session.user}
            restrictedMode={session.restrictedMode}
            currentPath={effectivePath}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        </Suspense>
      );
    }

    if (effectivePath === '/admin/guru') {
      return (
        <Suspense fallback={<RouteFallback />}>
          <TeacherManagement
            user={session.user}
            restrictedMode={session.restrictedMode}
            currentPath={effectivePath}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        </Suspense>
      );
    }

    if (effectivePath === '/admin/settings' || effectivePath === '/admin/pengaturan') {
      return (
        <Suspense fallback={<RouteFallback />}>
          <AdminSettings
            user={session.user}
            restrictedMode={session.restrictedMode}
            currentPath={effectivePath}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<RouteFallback />}>
        <AdminDashboard
          user={session.user}
          restrictedMode={session.restrictedMode}
          currentPath={effectivePath}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      </Suspense>
    );
  }

  if (
    effectivePath.startsWith('/guru') &&
    session.token &&
    session.user?.role === 'guru'
  ) {
    if (effectivePath === '/guru/beranda') {
      return (
        <Suspense fallback={<div className="p-xl text-text-secondary">Memuat...</div>}>
          <GuruDashboard
            user={session.user}
            currentPath={effectivePath}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        </Suspense>
      );
    }

    if (effectivePath === '/guru/rekap-nilai') {
      return (
        <Suspense fallback={<div className="p-xl text-text-secondary">Memuat...</div>}>
          <GuruRecapList
            user={session.user}
            currentPath={effectivePath}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        </Suspense>
      );
    }

    const recapDetailMatch = effectivePath.match(/^\/guru\/rekap-nilai\/(\d+)$/);
    if (recapDetailMatch) {
      return (
        <Suspense fallback={<div className="p-xl text-text-secondary">Memuat...</div>}>
          <GuruRecapDetail
            user={session.user}
            examId={recapDetailMatch[1]}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        </Suspense>
      );
    }

    if (effectivePath === '/guru/ujian') {
      return (
        <Suspense fallback={<div className="p-xl text-text-secondary">Memuat...</div>}>
          <GuruExamList
            user={session.user}
            currentPath={effectivePath}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        </Suspense>
      );
    }

    if (effectivePath === '/guru/bank-soal') {
      return (
        <Suspense fallback={<div className="p-xl text-text-secondary">Memuat...</div>}>
          <GuruQuestionBankList
            user={session.user}
            currentPath={effectivePath}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        </Suspense>
      );
    }

    const editorMatch = effectivePath.match(/^\/guru\/bank-soal\/(\d+)\/editor(?:\/(\d+))?$/);
    if (editorMatch) {
      return (
        <Suspense fallback={<div className="p-xl text-text-secondary">Memuat...</div>}>
          <GuruQuestionEditor
            user={session.user}
            bankId={editorMatch[1]}
            questionId={editorMatch[2] || null}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        </Suspense>
      );
    }

    const bankDetailMatch = effectivePath.match(/^\/guru\/bank-soal\/(\d+)$/);
    if (bankDetailMatch) {
      return (
        <Suspense fallback={<div className="p-xl text-text-secondary">Memuat...</div>}>
          <GuruQuestionBankDetail
            user={session.user}
            bankId={bankDetailMatch[1]}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        </Suspense>
      );
    }

    return (
      <PagePlaceholder
        standalone
        badgeText={`Peran: Guru (${session.user?.username || 'GR-001'})`}
        title="Halaman Sedang Disiapkan"
        description="Fitur ini akan tersedia pada tahap pengerjaan berikutnya."
        user={session.user}
        restrictedMode={session.restrictedMode}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <LoginPage onLoginSuccess={handleLoginSuccess} />
    </Suspense>
  );
}

/** Komponen root aplikasi yang mengatur autentikasi dan perutean halaman. */
export default App;

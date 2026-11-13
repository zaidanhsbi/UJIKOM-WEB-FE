/** Daftar menu navigasi sidebar untuk peran Admin. */
export const ADMIN_MENUS = [
  { id: 'beranda', label: 'Beranda', path: '/admin/beranda', icon: 'home', role: 'admin' },
  { id: 'academic-years', label: 'Tahun Ajaran', path: '/admin/academic-years', icon: 'rombels', role: 'admin' },
  { id: 'mapel', label: 'Mata Pelajaran', path: '/admin/mata-pelajaran', icon: 'book', role: 'admin' },
  { id: 'rombel', label: 'Kelas / Rombel', path: '/admin/kelas', icon: 'rombels', role: 'admin' },
  { id: 'siswa', label: 'Siswa', path: '/admin/siswa', icon: 'students', role: 'admin' },
  { id: 'guru', label: 'Guru', path: '/admin/guru', icon: 'teachers', role: 'admin' },
  { id: 'settings', label: 'Pengaturan', path: '/admin/settings', icon: 'settings', role: 'admin' },
];

/** Daftar menu navigasi sidebar untuk peran Guru. */
export const GURU_MENUS = [
  { id: 'guru-beranda', label: 'Beranda', path: '/guru/beranda', icon: 'home', role: 'guru' },
  { id: 'guru-bank-soal', label: 'Kelola Bank Soal', path: '/guru/bank-soal', icon: 'bank-soal', role: 'guru' },
  { id: 'guru-ujian', label: 'Kelola Ujian', path: '/guru/ujian', icon: 'clipboard', role: 'guru' },
  { id: 'guru-rekap', label: 'Rekap Nilai', path: '/guru/rekap-nilai', icon: 'rekap', role: 'guru' },
];

import {
  CheckCircle2,
  CheckSquare,
  ToggleLeft,
  GitCompareArrows,
  ListOrdered,
} from 'lucide-react';

/** Daftar tipe soal yang didukung beserta labelnya. */
export const QUESTION_TYPES = [
  { id: 'pg', label: 'Pilihan Ganda', desc: '1 jawaban benar (A-E)', icon: CheckCircle2 },
  { id: 'pgk', label: 'PG Kompleks', desc: 'Lebih dari 1 jawaban benar', icon: CheckSquare },
  { id: 'bs', label: 'Benar / Salah', desc: 'Pernyataan benar atau salah', icon: ToggleLeft },
  { id: 'jd', label: 'Menjodohkan', desc: 'Pasangan kiri dan kanan', icon: GitCompareArrows },
  { id: 'ur', label: 'Urutan', desc: 'Susun item secara berurutan', icon: ListOrdered },
];

/** Daftar tingkat kesulitan soal. */
export const DIFFICULTIES = [
  { id: 'mudah', label: 'Mudah' },
  { id: 'sedang', label: 'Sedang' },
  { id: 'sukar', label: 'Sukar' },
];

/** Kunci opsi pilihan ganda standar (A sampai E). */
export const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E'];

/** Membuat objek opsi pilihan ganda kosong untuk A-E. */
export function emptyOptions() {
  return {
    A: { text: '', image: null, url: null },
    B: { text: '', image: null, url: null },
    C: { text: '', image: null, url: null },
    D: { text: '', image: null, url: null },
    E: { text: '', image: null, url: null },
  };
}

/** Mengembalikan URL dasar penyimpanan media dari konfigurasi API. */
export function getStorageBaseUrl() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
  return apiBase.replace(/\/api\/?$/, '');
}

/** Mengubah path gambar relatif menjadi URL lengkap yang dapat diakses. */
export function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${getStorageBaseUrl()}/storage/${path}`;
}

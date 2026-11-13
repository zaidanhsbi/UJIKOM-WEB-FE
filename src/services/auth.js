import {
  apiRequest,
  setAuthSession,
  getAuthSession,
  clearAuthSession,
} from './apiClient';

export { setAuthSession, getAuthSession, clearAuthSession };

/** Mengirim permintaan login menggunakan NPSN, identifier, dan kata sandi. */
export async function loginApi({ npsn, identifier, password }) {
  return apiRequest('/login', {
    method: 'POST',
    auth: false,
    body: {
      npsn: String(npsn || '').trim(),
      identifier: String(identifier).trim(),
      username: String(identifier).trim(),
      password: String(password),
    },
    defaultErrorMessage: 'Gagal masuk. Periksa kembali data Anda.',
  });
}

/** Mengambil profil pengguna yang sedang login dari API. */
export async function fetchUserProfileApi() {
  const data = await apiRequest('/user', {
    method: 'GET',
    defaultErrorMessage: 'Gagal memuat profil pengguna.',
  });
  return data.user;
}

/** Mengirim permintaan logout dan menghapus sesi lokal. */
export async function logoutApi() {
  const { token } = getAuthSession();
  if (token) {
    try {
      await apiRequest('/logout', {
        method: 'POST',
        body: {},
      });
    } catch {
      // Abaikan kegagalan jaringan saat logout
    }
  }
  clearAuthSession();
}

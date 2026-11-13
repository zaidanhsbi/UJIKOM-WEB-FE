const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

let memorySession = {
  token: null,
  user: null,
  restrictedMode: false,
};

/** Menyimpan token dan data sesi autentikasi pengguna ke localStorage. */
export function setAuthSession(token, user, restrictedMode = false) {
  memorySession = {
    token,
    user,
    restrictedMode: Boolean(restrictedMode),
  };
  try {
    window.sessionStorage.setItem(
      'binoexam_auth',
      JSON.stringify({ token, user, restrictedMode: Boolean(restrictedMode) })
    );
  } catch {
    // Abaikan jika storage penuh/diblokir
  }
}

/** Mengambil sesi autentikasi pengguna yang tersimpan di localStorage. */
export function getAuthSession() {
  if (memorySession.token && memorySession.user) {
    return memorySession;
  }
  try {
    const raw = window.sessionStorage.getItem('binoexam_auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      memorySession = {
        token: parsed.token || null,
        user: parsed.user || null,
        restrictedMode: Boolean(parsed.restrictedMode),
      };
    }
  } catch {
    // Abaikan error parse
  }
  return memorySession;
}

/** Menghapus seluruh data sesi autentikasi dari localStorage. */
export function clearAuthSession() {
  memorySession = { token: null, user: null, restrictedMode: false };
  try {
    window.sessionStorage.removeItem('binoexam_auth');
  } catch {
    // Abaikan
  }
}

/**
 * Helper HTTP Client terpusat (menangani Authorization Bearer token, query params, dan error validasi Laravel)
 */
export async function apiRequest(
  endpoint,
  {
    method = 'GET',
    body = null,
    params = null,
    auth = true,
    defaultErrorMessage = 'Terjadi kesalahan pada permintaan server.',
  } = {}
) {
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        url.searchParams.set(key, String(value).trim());
      }
    });
  }

  const headers = {
    Accept: 'application/json',
  };

  if (body !== null) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const { token } = getAuthSession();
    if (!token) {
      throw new Error('Tidak ada sesi aktif.');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body !== null ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Ambil pesan error validasi pertama jika ada (Laravel 422 errors)
    let firstValidationMsg = null;
    if (data.errors && typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0];
      if (firstKey && Array.isArray(data.errors[firstKey])) {
        firstValidationMsg = data.errors[firstKey][0];
      }
    }

    const error = new Error(firstValidationMsg || data.message || defaultErrorMessage);
    error.status = response.status;
    error.code = data.code || 'ERROR';
    error.errors = data.errors || {};
    throw error;
  }

  return data;
}


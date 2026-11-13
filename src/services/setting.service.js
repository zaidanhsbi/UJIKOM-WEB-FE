import { apiRequest } from './apiClient';

/** Mengambil data pengaturan aplikasi Admin dari API. */
export async function getAdminSettingsApi() {
  const data = await apiRequest('/admin/settings', {
    method: 'GET',
    defaultErrorMessage: 'Gagal memuat pengaturan sekolah.',
  });
  return data?.settings || {};
}

/** Memperbarui pengaturan aplikasi Admin melalui API. */
export async function updateAdminSettingsApi(payload) {
  return apiRequest('/admin/settings', {
    method: 'PUT',
    body: payload,
    defaultErrorMessage: 'Gagal menyimpan pengaturan sekolah.',
  });
}

/** Mengubah kata sandi Admin melalui API. */
export async function changeAdminPasswordApi(payload) {
  return apiRequest('/admin/change-password', {
    method: 'PUT',
    body: payload,
    defaultErrorMessage: 'Gagal mengganti password.',
  });
}

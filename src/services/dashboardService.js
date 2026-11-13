import { apiRequest } from './apiClient';

/** Mengambil statistik ringkasan untuk halaman dashboard Admin. */
export async function fetchAdminDashboardStatsApi() {
  return apiRequest('/admin/dashboard-stats', {
    method: 'GET',
    defaultErrorMessage: 'Gagal memuat statistik dashboard.',
  });
}


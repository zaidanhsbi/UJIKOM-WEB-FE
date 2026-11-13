import { apiRequest } from './apiClient';

/** Mengambil daftar rombongan belajar dari API. */
export async function fetchRombelsApi(search = '', options = {}) {
  const params = { search };
  if (options.page) params.page = options.page;
  if (options.perPage) params.per_page = options.perPage;

  const data = await apiRequest('/admin/rombels', {
    method: 'GET',
    params,
    defaultErrorMessage: 'Gagal memuat daftar kelas / rombel.',
  });

  if (options.perPage) {
    return {
      items: data.data || [],
      meta: data.meta || {
        current_page: 1,
        last_page: 1,
        per_page: options.perPage,
        total: (data.data || []).length,
      },
    };
  }

  return data.data || [];
}

/** Membuat data rombongan belajar baru melalui API. */
export async function createRombelApi({ name, academic_year_id }) {
  return apiRequest('/admin/rombels', {
    method: 'POST',
    body: {
      name: String(name || '').trim(),
      ...(academic_year_id ? { academic_year_id: Number(academic_year_id) } : {}),
    },
    defaultErrorMessage: 'Gagal menambahkan kelas / rombel.',
  });
}

/** Mengimpor banyak data rombongan belajar sekaligus melalui API. */
export async function bulkImportRombelsApi(rombels = [], academic_year_id = null) {
  return apiRequest('/admin/rombels/bulk-import', {
    method: 'POST',
    body: {
      rombels,
      ...(academic_year_id ? { academic_year_id: Number(academic_year_id) } : {}),
    },
    defaultErrorMessage: 'Gagal mengimpor data kelas / rombel.',
  });
}

/** Memperbarui data rombongan belajar berdasarkan ID. */
export async function updateRombelApi(id, { name, academic_year_id }) {
  return apiRequest(`/admin/rombels/${id}`, {
    method: 'PUT',
    body: {
      name: String(name || '').trim(),
      ...(academic_year_id ? { academic_year_id: Number(academic_year_id) } : {}),
    },
    defaultErrorMessage: 'Gagal memperbarui kelas / rombel.',
  });
}

/** Menghapus data rombongan belajar berdasarkan ID. */
export async function deleteRombelApi(id) {
  return apiRequest(`/admin/rombels/${id}`, {
    method: 'DELETE',
    defaultErrorMessage: 'Gagal menghapus kelas / rombel.',
  });
}


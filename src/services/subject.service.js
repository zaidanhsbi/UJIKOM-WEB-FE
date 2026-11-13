import { apiRequest } from './apiClient';

/** Mengambil daftar mata pelajaran dari API. */
export async function fetchSubjectsApi(search = '', options = {}) {
  const params = { search };
  if (options.page) params.page = options.page;
  if (options.perPage) params.per_page = options.perPage;

  const data = await apiRequest('/admin/subjects', {
    method: 'GET',
    params,
    defaultErrorMessage: 'Gagal memuat daftar mata pelajaran.',
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

/** Membuat data mata pelajaran baru melalui API. */
export async function createSubjectApi({ code, name }) {
  return apiRequest('/admin/subjects', {
    method: 'POST',
    body: {
      code: String(code || '').trim(),
      name: String(name || '').trim(),
    },
    defaultErrorMessage: 'Gagal menambahkan mata pelajaran.',
  });
}

/** Mengimpor banyak data mata pelajaran sekaligus melalui API. */
export async function bulkImportSubjectsApi(subjects = []) {
  return apiRequest('/admin/subjects/bulk-import', {
    method: 'POST',
    body: {
      subjects,
    },
    defaultErrorMessage: 'Gagal mengimpor data mata pelajaran.',
  });
}

/** Memperbarui data mata pelajaran berdasarkan ID. */
export async function updateSubjectApi(id, { code, name }) {
  return apiRequest(`/admin/subjects/${id}`, {
    method: 'PUT',
    body: {
      code: String(code || '').trim(),
      name: String(name || '').trim(),
    },
    defaultErrorMessage: 'Gagal memperbarui mata pelajaran.',
  });
}

/** Menghapus data mata pelajaran berdasarkan ID. */
export async function deleteSubjectApi(id) {
  return apiRequest(`/admin/subjects/${id}`, {
    method: 'DELETE',
    defaultErrorMessage: 'Gagal menghapus mata pelajaran.',
  });
}

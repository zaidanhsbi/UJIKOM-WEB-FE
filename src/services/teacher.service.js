import { apiRequest } from './apiClient';

/** Mengambil daftar guru dari API. */
export async function fetchTeachersApi(search = '', options = {}) {
  const params = { search };
  if (options.page) params.page = options.page;
  if (options.perPage) params.per_page = options.perPage;

  const data = await apiRequest('/admin/teachers', {
    method: 'GET',
    params,
    defaultErrorMessage: 'Gagal memuat daftar guru.',
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

function buildTeacherPayload({ username, name, password, subjectIds = [], rombelIds = [] }) {
  const payload = {
    username: String(username || '').trim(),
    name: String(name || '').trim(),
    subject_ids: subjectIds,
    rombel_ids: rombelIds,
  };
  if (String(password || '').trim()) {
    payload.password = String(password).trim();
  }
  return payload;
}

/** Membuat data guru baru melalui API. */
export async function createTeacherApi(data) {
  return apiRequest('/admin/teachers', {
    method: 'POST',
    body: buildTeacherPayload(data),
    defaultErrorMessage: 'Gagal menambahkan data guru.',
  });
}

/** Mengimpor banyak data guru sekaligus melalui API. */
export async function bulkImportTeachersApi(teachers = []) {
  return apiRequest('/admin/teachers/bulk-import', {
    method: 'POST',
    body: { teachers },
    defaultErrorMessage: 'Gagal mengimpor data guru.',
  });
}

/** Memperbarui data guru berdasarkan ID. */
export async function updateTeacherApi(id, data) {
  return apiRequest(`/admin/teachers/${id}`, {
    method: 'PUT',
    body: buildTeacherPayload(data),
    defaultErrorMessage: 'Gagal memperbarui data guru.',
  });
}

/** Menghapus data guru berdasarkan ID. */
export async function deleteTeacherApi(id) {
  return apiRequest(`/admin/teachers/${id}`, {
    method: 'DELETE',
    defaultErrorMessage: 'Gagal menghapus data guru.',
  });
}

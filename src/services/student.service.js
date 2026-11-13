import { apiRequest } from './apiClient';

/** Mengambil daftar siswa dengan filter pencarian, rombel, dan paginasi. */
export async function fetchStudentsApi({ search = '', rombelId = '', page, perPage } = {}) {
  const params = {
    search,
    rombel_id: rombelId,
  };
  if (page) params.page = page;
  if (perPage) params.per_page = perPage;

  const data = await apiRequest('/admin/students', {
    method: 'GET',
    params,
    defaultErrorMessage: 'Gagal memuat daftar siswa.',
  });

  if (perPage) {
    return {
      items: data.data || [],
      meta: data.meta || {
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: (data.data || []).length,
      },
    };
  }

  return data.data || [];
}

/** Membuat data siswa baru melalui API. */
export async function createStudentApi({ nisn, name, rombel_id, academic_year_id, password }) {
  return apiRequest('/admin/students', {
    method: 'POST',
    body: {
      nisn: String(nisn || '').trim(),
      name: String(name || '').trim(),
      rombel_id: Number(rombel_id),
      ...(academic_year_id ? { academic_year_id: Number(academic_year_id) } : {}),
      password: String(password || ''),
    },
    defaultErrorMessage: 'Gagal menambahkan data siswa.',
  });
}

/** Mengimpor banyak data siswa sekaligus melalui API. */
export async function bulkImportStudentsApi(students = [], academic_year_id = null) {
  return apiRequest('/admin/students/bulk-import', {
    method: 'POST',
    body: {
      students,
      ...(academic_year_id ? { academic_year_id: Number(academic_year_id) } : {}),
    },
    defaultErrorMessage: 'Gagal mengimpor data siswa.',
  });
}

/** Memperbarui data siswa berdasarkan ID. */
export async function updateStudentApi(id, { nisn, name, rombel_id, academic_year_id, password }) {
  const payload = {
    nisn: String(nisn || '').trim(),
    name: String(name || '').trim(),
    rombel_id: Number(rombel_id),
    ...(academic_year_id ? { academic_year_id: Number(academic_year_id) } : {}),
  };

  if (String(password || '').trim()) {
    payload.password = String(password).trim();
  }

  return apiRequest(`/admin/students/${id}`, {
    method: 'PUT',
    body: payload,
    defaultErrorMessage: 'Gagal memperbarui data siswa.',
  });
}

/** Menghapus data siswa berdasarkan ID. */
export async function deleteStudentApi(id) {
  return apiRequest(`/admin/students/${id}`, {
    method: 'DELETE',
    defaultErrorMessage: 'Gagal menghapus data siswa.',
  });
}

/** Memproses kenaikan kelas atau kelulusan siswa secara massal. */
export async function promoteStudentsApi({
  source_rombel_id,
  action,
  target_rombel_id = null,
}) {
  return apiRequest('/admin/students/promote', {
    method: 'POST',
    body: {
      source_rombel_id: Number(source_rombel_id),
      action,
      ...(target_rombel_id ? { target_rombel_id: Number(target_rombel_id) } : {}),
    },
    defaultErrorMessage: 'Gagal memproses kenaikan kelas / kelulusan siswa.',
  });
}

/** Mengubah status aktif/nonaktif siswa berdasarkan ID. */
export async function toggleStudentActiveApi(id) {
  return apiRequest(`/admin/students/${id}/toggle-active`, {
    method: 'PATCH',
    defaultErrorMessage: 'Gagal mengubah status aktif siswa.',
  });
}


import { apiRequest } from './apiClient';

/** Mengambil daftar tahun ajaran dari API. */
export async function fetchAcademicYearsApi() {
  return apiRequest('/admin/academic-years');
}

/** Membuat data tahun ajaran baru melalui API. */
export async function createAcademicYearApi(payload) {
  return apiRequest('/admin/academic-years', {
    method: 'POST',
    body: payload,
  });
}

/** Memperbarui data tahun ajaran berdasarkan ID. */
export async function updateAcademicYearApi(id, payload) {
  return apiRequest(`/admin/academic-years/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

/** Mengaktifkan tahun ajaran tertentu berdasarkan ID. */
export async function setActiveAcademicYearApi(id) {
  return apiRequest(`/admin/academic-years/${id}/set-active`, {
    method: 'POST',
  });
}

/** Menghapus data tahun ajaran berdasarkan ID. */
export async function deleteAcademicYearApi(id) {
  return apiRequest(`/admin/academic-years/${id}`, {
    method: 'DELETE',
  });
}

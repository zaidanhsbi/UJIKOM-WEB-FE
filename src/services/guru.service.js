import { apiRequest, getAuthSession } from './apiClient';

/** Mengambil statistik ringkasan dashboard untuk Guru. */
export async function getGuruDashboardStats() {
  return apiRequest('/guru/dashboard-stats');
}

/** Mengambil daftar bank soal milik Guru. */
export async function fetchQuestionBanks(params = {}) {
  const query = new URLSearchParams();
  if (params.tab) query.set('tab', params.tab);
  if (params.subject_id) query.set('subject_id', params.subject_id);
  if (params.grade) query.set('grade', params.grade);
  if (params.search) query.set('search', params.search);
  const qs = query.toString();
  return apiRequest(`/guru/question-banks${qs ? `?${qs}` : ''}`);
}

/** Membuat bank soal baru melalui API. */
export async function createQuestionBank(payload) {
  return apiRequest('/guru/question-banks', {
    method: 'POST',
    body: payload,
  });
}

/** Memperbarui data bank soal berdasarkan ID. */
export async function updateQuestionBank(id, payload) {
  return apiRequest(`/guru/question-banks/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

/** Menghapus bank soal berdasarkan ID. */
export async function deleteQuestionBank(id) {
  return apiRequest(`/guru/question-banks/${id}`, {
    method: 'DELETE',
  });
}

/** Menduplikasi bank soal beserta seluruh soal di dalamnya. */
export async function duplicateQuestionBank(id, name) {
  return apiRequest(`/guru/question-banks/${id}/duplicate`, {
    method: 'POST',
    body: { name },
  });
}

/** Mengambil detail bank soal beserta daftar soalnya. */
export async function fetchQuestionBankDetail(id) {
  return apiRequest(`/guru/question-banks/${id}`);
}

/** Mengambil detail satu butir soal berdasarkan ID. */
export async function fetchQuestion(id) {
  return apiRequest(`/guru/questions/${id}`);
}

/** Membuat butir soal baru melalui API. */
export async function createQuestion(payload) {
  return apiRequest('/guru/questions', {
    method: 'POST',
    body: payload,
  });
}

/** Memperbarui data butir soal berdasarkan ID. */
export async function updateQuestion(id, payload) {
  return apiRequest(`/guru/questions/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

/** Menghapus butir soal berdasarkan ID. */
export async function deleteQuestion(id) {
  return apiRequest(`/guru/questions/${id}`, {
    method: 'DELETE',
  });
}

/** Mengimpor banyak soal ke bank soal tertentu. */
export async function importQuestions(bankId, rows) {
  return apiRequest(`/guru/question-banks/${bankId}/import`, {
    method: 'POST',
    body: { rows },
  });
}

/** Mengunduh template dokumen Word (.docx) untuk impor soal. */
export async function downloadDocxTemplate() {
  const token = getAuthSession()?.token;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
  const response = await fetch(`${baseUrl}/guru/question-banks/template-docx`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error('Gagal mengunduh template Word.');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Import_Soal_BinoExam.docx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/** Mengimpor soal dari file Word (.docx) ke bank soal tertentu. */
export async function importQuestionsDocx(bankId, file) {
  const token = getAuthSession()?.token;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${baseUrl}/guru/question-banks/${bankId}/import-docx`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Gagal mengimpor file Word.');
  }
  return data;
}

/** Mengambil daftar ujian milik Guru dari API. */
export async function fetchExams(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.subject_id) query.set('subject_id', params.subject_id);
  if (params.status) query.set('status', params.status);
  const qs = query.toString();
  return apiRequest(`/guru/exams${qs ? `?${qs}` : ''}`);
}

/** Membuat jadwal ujian baru melalui API. */
export async function createExam(payload) {
  return apiRequest('/guru/exams', {
    method: 'POST',
    body: payload,
  });
}

/** Memperbarui data jadwal ujian berdasarkan ID. */
export async function updateExam(id, payload) {
  return apiRequest(`/guru/exams/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

/** Menghapus jadwal ujian berdasarkan ID. */
export async function deleteExam(id) {
  return apiRequest(`/guru/exams/${id}`, {
    method: 'DELETE',
  });
}

/** Memulai pelaksanaan ujian berdasarkan ID. */
export async function startExam(id) {
  return apiRequest(`/guru/exams/${id}/start`, { method: 'POST' });
}

/** Mengakhiri pelaksanaan ujian berdasarkan ID. */
export async function finishExam(id) {
  return apiRequest(`/guru/exams/${id}/finish`, { method: 'POST' });
}

/** Mengambil daftar rekapitulasi hasil ujian dari API. */
export async function fetchRecaps(params = {}) {
  const query = new URLSearchParams();
  if (params.subject_id) query.set('subject_id', params.subject_id);
  if (params.rombel_id) query.set('rombel_id', params.rombel_id);
  if (params.date_from) query.set('date_from', params.date_from);
  if (params.date_to) query.set('date_to', params.date_to);
  if (params.search) query.set('search', params.search);
  const qs = query.toString();
  return apiRequest(`/guru/recaps${qs ? `?${qs}` : ''}`);
}

/** Mengambil detail rekapitulasi nilai siswa untuk satu ujian. */
export async function fetchRecapDetail(examId, params = {}) {
  const query = new URLSearchParams();
  if (params.kkm !== undefined && params.kkm !== '') query.set('kkm', params.kkm);
  if (params.rombel_id) query.set('rombel_id', params.rombel_id);
  if (params.search) query.set('search', params.search);
  const qs = query.toString();
  return apiRequest(`/guru/recaps/${examId}${qs ? `?${qs}` : ''}`);
}

/** Mengunggah file media gambar untuk digunakan pada soal. */
export async function uploadQuestionMedia(file, altText = '') {
  const token = getAuthSession()?.token;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
  const formData = new FormData();
  formData.append('file', file);
  if (altText) {
    formData.append('alt_text', altText);
  }

  const response = await fetch(`${baseUrl}/guru/questions/upload-media`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Gagal mengunggah gambar.');
  }
  return data;
}

/** Menghapus data rekapitulasi hasil ujian berdasarkan ID ujian. */
export async function deleteRecap(examId) {
  return apiRequest(`/guru/recaps/${examId}`, {
    method: 'DELETE',
    defaultErrorMessage: 'Gagal menghapus rekap nilai.',
  });
}

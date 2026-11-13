import {
  normalizeHeader,
  isPasswordHeader,
  extractRawMatrixFromFile,
  downloadExcelTable,
  downloadDocxTable,
} from './fileImportBase';

function isTeacherCodeHeader(norm) {
  return [
    'nuptk',
    'usernamenuptk',
    'username',
    'usernamelogin',
    'user',
    'nip',
    'nipusername',
    'nipid',
    'kodeguru',
    'idguru',
    'namaguru',
    'namalengkap',
    'nama',
    'name',
  ].includes(norm);
}

function isTeacherNameHeader(norm) {
  return ['namaguru', 'namalengkap', 'nama', 'name'].includes(norm);
}

/** Mem-parsing file impor guru (Excel/Word) dan memvalidasi data. */
export async function parseTeacherImportFile(file, existingTeachers = []) {
  let rows;
  try {
    rows = await extractRawMatrixFromFile(file);
  } catch (err) {
    return {
      valid: false,
      teachers: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: [err.message],
    };
  }

  let headerRowIdx = -1;
  let userCol = -1;
  let nameCol = -1;
  let passCol = -1;
  let subjectsCol = -1;
  let rombelsCol = -1;

  for (let i = 0; i < Math.min(rows.length, 10); i += 1) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    let fUser = -1;
    let fName = -1;
    let fPass = -1;
    let fSubjects = -1;
    let fRombels = -1;

    row.forEach((cell, idx) => {
      const norm = normalizeHeader(cell);
      if (fUser === -1 && isTeacherCodeHeader(norm)) fUser = idx;
      else if (fName === -1 && isTeacherNameHeader(norm)) fName = idx;
      else if (fPass === -1 && isPasswordHeader(norm)) fPass = idx;
      else if (fSubjects === -1 && ['matapelajaran', 'mapel', 'subject', 'subjects'].includes(norm)) fSubjects = idx;
      else if (fRombels === -1 && ['kelas', 'rombel', 'kelasrombel', 'rombels'].includes(norm)) fRombels = idx;
    });

    if (fUser !== -1) {
      headerRowIdx = i;
      userCol = fUser;
      nameCol = fName !== -1 ? fName : fUser;
      passCol = fPass;
      subjectsCol = fSubjects;
      rombelsCol = fRombels;
      break;
    }

    if (fName !== -1) {
      headerRowIdx = i;
      userCol = fName;
      nameCol = fName;
      passCol = fPass;
      subjectsCol = fSubjects;
      rombelsCol = fRombels;
      break;
    }
  }

  if (headerRowIdx === -1) {
    return {
      valid: false,
      teachers: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: [
        'Struktur kolom tidak sesuai. Wajib terdapat kolom header "Username / NUPTK" (serta "Password" opsional).',
      ],
    };
  }

  const existingSet = new Set(
    existingTeachers.map((t) => String(t.username || '').toUpperCase().trim())
  );
  const seenInFile = new Map();
  const validTeachers = [];
  const rowResults = [];
  const errors = [];
  let skippedCount = 0;
  let errorCount = 0;

  for (let r = headerRowIdx + 1; r < rows.length; r += 1) {
    const row = rows[r] || [];
    const rowNum = r + 1;
    const rawUser = String(row[userCol] ?? '').trim();
    const rawName = nameCol !== -1 ? String(row[nameCol] ?? '').trim() : '';
    const username = rawUser || rawName;
    const normUser = username.toUpperCase();
    const name = rawName || username;
    const rawPass = passCol !== -1 ? String(row[passCol] ?? '').trim() : '';
    const password = rawPass || username;

    if (!username) {
      continue;
    }

    if (password.length < 4) {
      errorCount += 1;
      errors.push(`Baris ${rowNum}: Password minimal 4 karakter.`);
      rowResults.push({
        row: rowNum,
        code: username,
        name: username,
        status: 'error',
        reason: 'Password minimal 4 karakter.',
      });
      continue;
    }

    if (seenInFile.has(normUser)) {
      skippedCount += 1;
      const firstRow = seenInFile.get(normUser);
      rowResults.push({
        row: rowNum,
        code: username,
        name: username,
        status: 'dilewati',
        reason: `Username duplikat di dalam file (baris ${firstRow}).`,
      });
      continue;
    }

    if (existingSet.has(normUser)) {
      skippedCount += 1;
      rowResults.push({
        row: rowNum,
        code: username,
        name: username,
        status: 'dilewati',
        reason: 'Username sudah terdaftar di sekolah.',
      });
      continue;
    }

    seenInFile.set(normUser, rowNum);
    validTeachers.push({
      row: rowNum,
      username,
      name,
      password,
      subjects: subjectsCol !== -1 ? String(row[subjectsCol] ?? '').trim() : '',
      rombels: rombelsCol !== -1 ? String(row[rombelsCol] ?? '').trim() : '',
    });
    rowResults.push({
      row: rowNum,
      code: username,
      name,
      status: 'berhasil',
      reason: 'Siap disimpan.',
    });
  }

  if (rowResults.length === 0) {
    return {
      valid: false,
      teachers: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: ['Tidak ada baris data guru di dalam file.'],
    };
  }

  return {
    valid: validTeachers.length > 0 && errorCount === 0,
    teachers: validTeachers,
    rowResults,
    summary: {
      validCount: validTeachers.length,
      skippedCount,
      errorCount,
    },
    errors,
  };
}

/** Mengunduh template Excel untuk impor data guru. */
export function downloadTeacherExcelTemplate() {
  return downloadExcelTable(
    'Template_Impor_Guru.xlsx',
    'Template Data Guru',
    [
      ['No', 'Username / NUPTK', 'Nama Guru', 'Password', 'Mata Pelajaran', 'Kelas / Rombel'],
      [1, 'GR-002', 'Drs. Hendra Wijaya', 'guru123', 'Matematika', 'X RPL 1, X RPL 2'],
      [2, 'Pak_Budi', 'Budi Santoso, S.Pd.', 'guru123', 'Matematika, Informatika', 'XI TKJ 1'],
      [3, '19850101201001', 'Rina Marlina, S.Pd.', 'guru123', 'Bahasa Indonesia', 'XII RPL 1'],
    ],
    [6, 22, 26, 16, 26, 22]
  );
}

/** Mengunduh template Word untuk impor data guru. */
export function downloadTeacherWordTemplate() {
  downloadDocxTable(
    'Template_Impor_Guru.docx',
    'Template Impor Data Guru BinoExam (Jangan ubah baris judul tabel di bawah ini)',
    [
      ['No', 'Username / NUPTK', 'Nama Guru', 'Password', 'Mata Pelajaran', 'Kelas / Rombel'],
      ['1', 'GR-002', 'Drs. Hendra Wijaya', 'guru123', 'Matematika', 'X RPL 1, X RPL 2'],
      ['2', 'Pak_Budi', 'Budi Santoso, S.Pd.', 'guru123', 'Matematika, Informatika', 'XI TKJ 1'],
      ['3', '19850101201001', 'Rina Marlina, S.Pd.', 'guru123', 'Bahasa Indonesia', 'XII RPL 1'],
    ]
  );
}

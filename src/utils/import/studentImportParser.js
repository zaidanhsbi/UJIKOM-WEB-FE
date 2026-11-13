import {
  normalizeHeader,
  isPasswordHeader,
  extractRawMatrixFromFile,
  downloadExcelTable,
  downloadDocxTable,
} from './fileImportBase';

function isNisnHeader(norm) {
  return ['nisn', 'nomorinduk', 'nomorinduksiswa', 'username'].includes(norm);
}

function isStudentNameHeader(norm) {
  return ['namasiswa', 'namalengkap', 'namalengkapsiswa', 'nama', 'name'].includes(norm);
}

function isStudentRombelHeader(norm) {
  return ['kelas', 'rombel', 'kelasrombel', 'namakelas', 'namarombel'].includes(norm);
}

function isAcademicYearHeader(norm) {
  return ['tahunajaran', 'tahunajar', 'academicyear', 'ta'].includes(norm);
}

/** Mem-parsing file impor siswa (Excel/Word) dan memvalidasi data. */
export async function parseStudentImportFile(file, existingStudents = []) {
  let rows;
  try {
    rows = await extractRawMatrixFromFile(file);
  } catch (err) {
    return {
      valid: false,
      students: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: [err.message],
    };
  }

  let headerRowIdx = -1;
  let nisnCol = -1;
  let nameCol = -1;
  let rombelCol = -1;
  let yearCol = -1;
  let passCol = -1;

  for (let i = 0; i < Math.min(rows.length, 10); i += 1) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    let fNisn = -1;
    let fName = -1;
    let fRombel = -1;
    let fYear = -1;
    let fPass = -1;

    row.forEach((cell, idx) => {
      const norm = normalizeHeader(cell);
      if (fNisn === -1 && isNisnHeader(norm)) fNisn = idx;
      else if (fName === -1 && isStudentNameHeader(norm)) fName = idx;
      else if (fRombel === -1 && isStudentRombelHeader(norm)) fRombel = idx;
      else if (fYear === -1 && isAcademicYearHeader(norm)) fYear = idx;
      else if (fPass === -1 && isPasswordHeader(norm)) fPass = idx;
    });

    if (fNisn !== -1 && fName !== -1 && fRombel !== -1 && fYear !== -1) {
      headerRowIdx = i;
      nisnCol = fNisn;
      nameCol = fName;
      rombelCol = fRombel;
      yearCol = fYear;
      passCol = fPass;
      break;
    }
  }

  if (headerRowIdx === -1) {
    return {
      valid: false,
      students: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: [
        'Struktur kolom tidak sesuai. Wajib terdapat kolom header "NISN", "Nama Siswa", "Kelas / Rombel", dan "Tahun Ajaran" (serta "Password" opsional).',
      ],
    };
  }

  const existingNisnSet = new Set(
    existingStudents.map((s) => String(s.nisn || '').toUpperCase().trim())
  );
  const seenInFile = new Map();
  const validStudents = [];
  const rowResults = [];
  const errors = [];
  let skippedCount = 0;
  let errorCount = 0;

  for (let r = headerRowIdx + 1; r < rows.length; r += 1) {
    const row = rows[r] || [];
    const rowNum = r + 1;
    const nisn = String(row[nisnCol] ?? '').trim();
    const normNisn = nisn.toUpperCase();
    const name = String(row[nameCol] ?? '').trim();
    const rombel = String(row[rombelCol] ?? '').trim();
    const academicYear = String(row[yearCol] ?? '').trim();
    const rawPass = passCol !== -1 ? String(row[passCol] ?? '').trim() : '';
    const password = rawPass || nisn;

    if (!nisn && !name && !rombel && !academicYear) {
      continue;
    }

    if (!nisn) {
      errorCount += 1;
      errors.push(`Baris ${rowNum}: Kolom NISN wajib diisi.`);
      rowResults.push({
        row: rowNum,
        code: '-',
        name: name || '-',
        status: 'error',
        reason: 'NISN kosong.',
      });
      continue;
    }

    if (!name) {
      errorCount += 1;
      errors.push(`Baris ${rowNum}: Nama Siswa kosong untuk NISN "${nisn}".`);
      rowResults.push({
        row: rowNum,
        code: nisn,
        name: '-',
        status: 'error',
        reason: 'Nama Siswa kosong.',
      });
      continue;
    }

    if (!rombel) {
      errorCount += 1;
      errors.push(`Baris ${rowNum}: Kelas / Rombel kosong untuk "${name}".`);
      rowResults.push({
        row: rowNum,
        code: nisn,
        name,
        status: 'error',
        reason: 'Kelas / Rombel kosong.',
      });
      continue;
    }

    if (!academicYear) {
      errorCount += 1;
      errors.push(`Baris ${rowNum}: Tahun Ajaran wajib diisi untuk "${name}".`);
      rowResults.push({
        row: rowNum,
        code: nisn,
        name: `${name} (${rombel})`,
        status: 'error',
        reason: 'Tahun Ajaran kosong.',
      });
      continue;
    }

    if (academicYear.length > 20) {
      errorCount += 1;
      errors.push(`Baris ${rowNum}: Tahun Ajaran "${academicYear}" melebihi 20 karakter.`);
      rowResults.push({
        row: rowNum,
        code: nisn,
        name: `${name} (${rombel})`,
        status: 'error',
        reason: 'Tahun Ajaran melebihi 20 karakter.',
      });
      continue;
    }

    if (password.length < 4) {
      errorCount += 1;
      errors.push(`Baris ${rowNum}: Password minimal 4 karakter.`);
      rowResults.push({
        row: rowNum,
        code: nisn,
        name: `${name} (${rombel})`,
        status: 'error',
        reason: 'Password minimal 4 karakter.',
      });
      continue;
    }

    if (seenInFile.has(normNisn)) {
      skippedCount += 1;
      const firstRow = seenInFile.get(normNisn);
      rowResults.push({
        row: rowNum,
        code: nisn,
        name: `${name} (${rombel})`,
        status: 'dilewati',
        reason: `NISN duplikat di dalam file (baris ${firstRow}).`,
      });
      continue;
    }

    if (existingNisnSet.has(normNisn)) {
      skippedCount += 1;
      rowResults.push({
        row: rowNum,
        code: nisn,
        name: `${name} (${rombel})`,
        status: 'dilewati',
        reason: 'NISN sudah terdaftar di sekolah.',
      });
      continue;
    }

    seenInFile.set(normNisn, rowNum);
    validStudents.push({
      row: rowNum,
      nisn,
      name,
      rombel,
      academic_year: academicYear,
      password,
    });
    rowResults.push({
      row: rowNum,
      code: nisn,
      name: `${name} (${rombel})`,
      status: 'berhasil',
      reason: 'Siap disimpan.',
    });
  }

  if (rowResults.length === 0) {
    return {
      valid: false,
      students: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: ['Tidak ada baris data siswa di dalam file.'],
    };
  }

  return {
    valid: validStudents.length > 0 && errorCount === 0,
    students: validStudents,
    rowResults,
    summary: {
      validCount: validStudents.length,
      skippedCount,
      errorCount,
    },
    errors,
  };
}

/** Mengunduh template Excel untuk impor data siswa. */
export function downloadStudentExcelTemplate(defaultAcademicYear = '2026/2027') {
  const year = String(defaultAcademicYear || '2026/2027').trim() || '2026/2027';
  return downloadExcelTable(
    'Template_Impor_Siswa.xlsx',
    'Template Data Siswa',
    [
      ['No', 'NISN', 'Nama Siswa', 'Kelas / Rombel', 'Tahun Ajaran', 'Password'],
      [1, '0081234510', 'Budi Pratama', 'XII RPL 1', year, '123456'],
      [2, '0081234511', 'Citra Lestari', 'XII RPL 1', year, '123456'],
      [3, '0081234512', 'Dimas Anggara', 'XII RPL 2', year, '123456'],
    ],
    [6, 16, 28, 18, 16, 16]
  );
}

/** Mengunduh template Word untuk impor data siswa. */
export function downloadStudentWordTemplate() {
  downloadDocxTable(
    'Template_Impor_Siswa.docx',
    'Template Impor Data Siswa BinoExam (Jangan ubah baris judul tabel di bawah ini)',
    [
      ['No', 'NISN', 'Nama Siswa', 'Kelas / Rombel', 'Password'],
      ['1', '0081234510', 'Budi Pratama', 'XII RPL 1', '123456'],
      ['2', '0081234511', 'Citra Lestari', 'XII RPL 1', '123456'],
      ['3', '0081234512', 'Dimas Anggara', 'XII RPL 2', '123456'],
    ]
  );
}

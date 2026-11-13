import {
  normalizeHeader,
  extractRawMatrixFromFile,
  downloadExcelTable,
  downloadDocxTable,
} from './fileImportBase';

function isRombelNameHeader(norm) {
  return [
    'namakelas',
    'namarombel',
    'namakelasrombel',
    'kelas',
    'rombel',
    'nama',
    'name',
  ].includes(norm);
}

function isAcademicYearHeader(norm) {
  return ['tahunajaran', 'tahunajar', 'academicyear', 'ta'].includes(norm);
}

/** Mem-parsing file impor rombel (Excel/Word) dan memvalidasi duplikasi. */
export async function parseRombelImportFile(file, existingRombels = []) {
  let rows;
  try {
    rows = await extractRawMatrixFromFile(file);
  } catch (err) {
    return {
      valid: false,
      rombels: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: [err.message],
    };
  }

  let headerRowIdx = -1;
  let nameColIdx = -1;
  let yearColIdx = -1;

  for (let i = 0; i < Math.min(rows.length, 10); i += 1) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    let fName = -1;
    let fYear = -1;

    row.forEach((cell, idx) => {
      const norm = normalizeHeader(cell);
      if (fName === -1 && isRombelNameHeader(norm)) fName = idx;
      else if (fYear === -1 && isAcademicYearHeader(norm)) fYear = idx;
    });

    if (fName !== -1 && fYear !== -1) {
      headerRowIdx = i;
      nameColIdx = fName;
      yearColIdx = fYear;
      break;
    }
  }

  if (headerRowIdx === -1) {
    return {
      valid: false,
      rombels: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: [
        'Struktur kolom tidak sesuai. Wajib terdapat kolom header "Nama Kelas / Rombel" dan "Tahun Ajaran".',
      ],
    };
  }

  const existingSet = new Set(
    existingRombels.map((r) => String(r.name || '').toUpperCase().trim())
  );
  const seenInFile = new Map();
  const validRombels = [];
  const rowResults = [];
  const errors = [];
  let skippedCount = 0;
  let errorCount = 0;

  for (let r = headerRowIdx + 1; r < rows.length; r += 1) {
    const row = rows[r] || [];
    const rowNum = r + 1;
    const name = String(row[nameColIdx] ?? '').trim();
    const academicYear = String(row[yearColIdx] ?? '').trim();
    const normName = name.toUpperCase();

    if (!name && !academicYear && row.every((c) => !String(c || '').trim())) {
      continue;
    }

    if (!name) {
      errorCount += 1;
      errors.push(`Baris ${rowNum}: Nama Kelas / Rombel wajib diisi.`);
      rowResults.push({
        row: rowNum,
        code: '-',
        name: '-',
        status: 'error',
        reason: 'Nama Kelas / Rombel kosong.',
      });
      continue;
    }

    if (!academicYear) {
      errorCount += 1;
      errors.push(`Baris ${rowNum}: Tahun Ajaran wajib diisi untuk "${name}".`);
      rowResults.push({
        row: rowNum,
        code: name,
        name,
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
        code: name,
        name: `${name} (${academicYear})`,
        status: 'error',
        reason: 'Tahun Ajaran melebihi 20 karakter.',
      });
      continue;
    }

    if (name.length > 100) {
      errorCount += 1;
      errors.push(`Baris ${rowNum}: Nama Kelas "${name}" melebihi 100 karakter.`);
      rowResults.push({
        row: rowNum,
        code: name,
        name: `${name} (${academicYear})`,
        status: 'error',
        reason: 'Nama Kelas melebihi 100 karakter.',
      });
      continue;
    }

    if (seenInFile.has(normName)) {
      skippedCount += 1;
      const firstRow = seenInFile.get(normName);
      rowResults.push({
        row: rowNum,
        code: name,
        name: `${name} (${academicYear})`,
        status: 'dilewati',
        reason: `Duplikat di dalam file (baris ${firstRow}).`,
      });
      continue;
    }

    if (existingSet.has(normName)) {
      skippedCount += 1;
      rowResults.push({
        row: rowNum,
        code: name,
        name: `${name} (${academicYear})`,
        status: 'dilewati',
        reason: 'Kelas / Rombel sudah terdaftar di sekolah.',
      });
      continue;
    }

    seenInFile.set(normName, rowNum);
    validRombels.push({ row: rowNum, name, academic_year: academicYear });
    rowResults.push({
      row: rowNum,
      code: name,
      name: `${name} (${academicYear})`,
      status: 'berhasil',
      reason: 'Siap disimpan.',
    });
  }

  if (rowResults.length === 0) {
    return {
      valid: false,
      rombels: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: ['Tidak ada baris data kelas / rombel di dalam file.'],
    };
  }

  return {
    valid: validRombels.length > 0 && errorCount === 0,
    rombels: validRombels,
    rowResults,
    summary: {
      validCount: validRombels.length,
      skippedCount,
      errorCount,
    },
    errors,
  };
}

/** Mengunduh template Excel untuk impor data rombel. */
export function downloadRombelExcelTemplate(defaultAcademicYear = '2026/2027') {
  const year = String(defaultAcademicYear || '2026/2027').trim() || '2026/2027';
  return downloadExcelTable(
    'Template_Impor_Kelas_Rombel.xlsx',
    'Template Kelas Rombel',
    [
      ['No', 'Nama Kelas / Rombel', 'Tahun Ajaran'],
      [1, 'X RPL 1', year],
      [2, 'XI RPL 1', year],
      [3, 'XII RPL 1', year],
    ],
    [6, 30, 18]
  );
}

/** Mengunduh template Word untuk impor data rombel. */
export function downloadRombelWordTemplate() {
  downloadDocxTable(
    'Template_Impor_Kelas_Rombel.docx',
    'Template Impor Kelas / Rombel BinoExam (Jangan ubah baris judul tabel di bawah ini)',
    [
      ['No', 'Nama Kelas / Rombel'],
      ['1', 'X RPL 1'],
      ['2', 'XI RPL 1'],
      ['3', 'XII RPL 1'],
    ]
  );
}

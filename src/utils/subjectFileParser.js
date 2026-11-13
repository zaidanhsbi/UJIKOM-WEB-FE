const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.docx'];

/** Mengambil ekstensi file dalam huruf kecil dari nama file. */
export function getFileExtension(filename = '') {
  const lower = String(filename).toLowerCase().trim();
  const dotIdx = lower.lastIndexOf('.');
  return dotIdx !== -1 ? lower.slice(dotIdx) : '';
}

/** Memeriksa apakah format file didukung untuk impor mata pelajaran. */
export function isSupportedImportFile(filename = '') {
  const ext = getFileExtension(filename);
  return ALLOWED_EXTENSIONS.includes(ext);
}

function normalizeHeader(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function isCodeHeader(norm) {
  return [
    'kodemapel',
    'kodematapelajaran',
    'kode',
    'code',
    'subjectcode',
  ].includes(norm);
}

function isNameHeader(norm) {
  return [
    'namamapel',
    'namamatapelajaran',
    'matapelajaran',
    'mapel',
    'nama',
    'name',
    'subjectname',
  ].includes(norm);
}

/**
 * Validasi daftar baris mentah [{ row, code, name }]
 * Mengembalikan rincian per baris (berhasil, dilewati, error)
 */
function validateExtractedRows(extractedRows, existingSubjects = []) {
  const errors = [];
  const validSubjects = [];
  const rowResults = [];

  if (!Array.isArray(extractedRows) || extractedRows.length === 0) {
    return {
      valid: false,
      subjects: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: [
        'File tidak memiliki baris data mata pelajaran. Pastikan Anda mengisi data di bawah baris judul (Kode Mapel & Nama Mapel).',
      ],
    };
  }

  const existingCodesMap = new Set(
    existingSubjects.map((s) => String(s.code || '').toUpperCase().trim())
  );
  const seenInFile = new Map();

  let skippedCount = 0;
  let errorCount = 0;

  extractedRows.forEach((item) => {
    const rowNum = item.row;
    const code = String(item.code || '').toUpperCase().trim();
    const name = String(item.name || '').trim();

    if (!code && !name) {
      return;
    }

    if (!code) {
      errorCount += 1;
      errors.push(`Baris ${rowNum}: Kolom "Kode Mapel" wajib diisi.`);
      rowResults.push({
        row: rowNum,
        code: '-',
        name: name || '-',
        status: 'error',
        reason: 'Kode Mapel kosong.',
      });
      return;
    }

    if (code.length > 50) {
      errorCount += 1;
      errors.push(`Baris ${rowNum}: Kode Mapel "${code}" melebihi 50 karakter.`);
      rowResults.push({
        row: rowNum,
        code,
        name: name || '-',
        status: 'error',
        reason: 'Kode Mapel melebihi 50 karakter.',
      });
      return;
    }

    if (!name) {
      errorCount += 1;
      errors.push(
        `Baris ${rowNum}: Kolom "Nama Mapel" kosong untuk kode "${code}".`
      );
      rowResults.push({
        row: rowNum,
        code,
        name: '-',
        status: 'error',
        reason: 'Nama Mapel kosong.',
      });
      return;
    }

    if (name.length > 150) {
      errorCount += 1;
      errors.push(
        `Baris ${rowNum}: Nama Mapel pada kode "${code}" melebihi 150 karakter.`
      );
      rowResults.push({
        row: rowNum,
        code,
        name,
        status: 'error',
        reason: 'Nama Mapel melebihi 150 karakter.',
      });
      return;
    }

    if (seenInFile.has(code)) {
      skippedCount += 1;
      const firstSeenRow = seenInFile.get(code);
      rowResults.push({
        row: rowNum,
        code,
        name,
        status: 'dilewati',
        reason: `Kode duplikat di dalam file (baris ${firstSeenRow}).`,
      });
      return;
    }

    if (existingCodesMap.has(code)) {
      skippedCount += 1;
      rowResults.push({
        row: rowNum,
        code,
        name,
        status: 'dilewati',
        reason: 'Kode Mapel sudah terdaftar di sekolah.',
      });
      return;
    }

    seenInFile.set(code, rowNum);
    validSubjects.push({
      row: rowNum,
      code,
      name,
    });
    rowResults.push({
      row: rowNum,
      code,
      name,
      status: 'berhasil',
      reason: 'Siap disimpan.',
    });
  });

  if (rowResults.length === 0) {
    return {
      valid: false,
      subjects: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: ['Tidak ada data mata pelajaran yang ditemukan di dalam file.'],
    };
  }

  return {
    valid: validSubjects.length > 0 && errorCount === 0,
    subjects: validSubjects,
    rowResults,
    summary: {
      validCount: validSubjects.length,
      skippedCount,
      errorCount,
    },
    errors,
  };
}

async function parseExcelSubjects(file, existingSubjects = []) {
  // Dynamic import agar library xlsx (~420 kB) hanya diunduh saat pengguna mengimpor/mengunduh Excel
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'array' });
  } catch {
    return {
      valid: false,
      subjects: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: [
        'File Excel rusak atau tidak dapat dibaca. Gunakan template .xlsx resmi.',
      ],
    };
  }

  const firstSheetName = workbook.SheetNames?.[0];
  if (!firstSheetName) {
    return {
      valid: false,
      subjects: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: ['File Excel tidak memiliki lembar kerja (sheet).'],
    };
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!rows || rows.length === 0) {
    return {
      valid: false,
      subjects: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: [
        'File Excel kosong. Silakan unduh template Excel terlebih dahulu.',
      ],
    };
  }

  let headerRowIndex = -1;
  let codeColIndex = -1;
  let nameColIndex = -1;

  for (let i = 0; i < Math.min(rows.length, 10); i += 1) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    let foundCode = -1;
    let foundName = -1;

    row.forEach((cell, colIdx) => {
      const norm = normalizeHeader(cell);
      if (foundCode === -1 && isCodeHeader(norm)) foundCode = colIdx;
      if (foundName === -1 && isNameHeader(norm)) foundName = colIdx;
    });

    if (foundCode !== -1 && foundName !== -1) {
      headerRowIndex = i;
      codeColIndex = foundCode;
      nameColIndex = foundName;
      break;
    }
  }

  if (headerRowIndex === -1) {
    return {
      valid: false,
      subjects: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: [
        'Struktur kolom Excel tidak sesuai. Wajib terdapat kolom header "Kode Mapel" dan "Nama Mapel".',
      ],
    };
  }

  const extracted = [];
  for (let r = headerRowIndex + 1; r < rows.length; r += 1) {
    const row = rows[r] || [];
    extracted.push({
      row: r + 1,
      code: row[codeColIndex] ?? '',
      name: row[nameColIndex] ?? '',
    });
  }

  return validateExtractedRows(extracted, existingSubjects);
}

async function parseWordSubjects(file, existingSubjects = []) {
  // Dynamic import agar library mammoth (~460 kB) hanya diunduh saat pengguna mengimpor file .docx
  const mammothModule = await import('mammoth');
  const mammoth = mammothModule.default || mammothModule;
  const buffer = await file.arrayBuffer();
  let htmlResult;
  try {
    htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
  } catch {
    return {
      valid: false,
      subjects: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: [
        'File Word (.docx) rusak atau tidak dapat dibaca. Pastikan file berformat .docx yang valid.',
      ],
    };
  }

  const html = htmlResult?.value || '';
  if (!html.trim()) {
    return {
      valid: false,
      subjects: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: [
        'File Word (.docx) kosong. Silakan gunakan template yang tersedia.',
      ],
    };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tables = doc.querySelectorAll('table');

  if (tables.length === 0) {
    return {
      valid: false,
      subjects: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: [
        'Format dokumen Word tidak sesuai: Tidak ditemukan tabel di dalam file .docx. Gunakan tabel dengan kolom "Kode Mapel" dan "Nama Mapel".',
      ],
    };
  }

  const table = tables[0];
  const trList = Array.from(table.querySelectorAll('tr'));

  if (trList.length < 2) {
    return {
      valid: false,
      subjects: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: [
        'Tabel di dalam file Word belum memiliki baris data mata pelajaran.',
      ],
    };
  }

  const headerCells = Array.from(trList[0].querySelectorAll('th, td')).map(
    (cell) => normalizeHeader(cell.textContent || '')
  );

  const codeColIndex = headerCells.findIndex((norm) => isCodeHeader(norm));
  const nameColIndex = headerCells.findIndex((norm) => isNameHeader(norm));

  if (codeColIndex === -1 || nameColIndex === -1) {
    return {
      valid: false,
      subjects: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: [
        'Header tabel pada file Word tidak sesuai. Pastikan baris pertama tabel berisi kolom "Kode Mapel" dan "Nama Mapel".',
      ],
    };
  }

  const extracted = [];
  for (let i = 1; i < trList.length; i += 1) {
    const cells = Array.from(trList[i].querySelectorAll('td, th')).map((c) =>
      String(c.textContent || '').trim()
    );
    extracted.push({
      row: i + 1,
      code: cells[codeColIndex] ?? '',
      name: cells[nameColIndex] ?? '',
    });
  }

  return validateExtractedRows(extracted, existingSubjects);
}

/** Mem-parsing file impor mata pelajaran (Excel/Word) dan memvalidasi duplikasi. */
export async function parseSubjectImportFile(file, existingSubjects = []) {
  if (!file) {
    return {
      valid: false,
      subjects: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: ['Tidak ada file yang dipilih.'],
    };
  }

  const ext = getFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      subjects: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: [
        `Format file "${ext || file.name}" tidak didukung. Harap unggah file Excel (.xlsx, .xls) atau Word (.docx).`,
      ],
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      subjects: [],
      rowResults: [],
      summary: { validCount: 0, skippedCount: 0, errorCount: 1 },
      errors: ['File yang dipilih kosong (0 byte).'],
    };
  }

  if (ext === '.xlsx' || ext === '.xls') {
    return parseExcelSubjects(file, existingSubjects);
  }

  return parseWordSubjects(file, existingSubjects);
}

/** Mengunduh template Excel untuk impor data mata pelajaran. */
export async function downloadSubjectExcelTemplate() {
  const XLSX = await import('xlsx');
  const sampleData = [
    ['No', 'Kode Mapel', 'Nama Mapel'],
    [1, 'MP-FIS', 'Fisika Dasar'],
    [2, 'MP-KIM', 'Kimia Terapan'],
    [3, 'MP-BIO', 'Biologi Umum'],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
  worksheet['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 36 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Mata Pelajaran');

  XLSX.writeFile(workbook, 'Template_Impor_Mata_Pelajaran.xlsx');
}

function crc32(bytes) {
  let c = -1;
  for (let i = 0; i < bytes.length; i += 1) {
    c = (c >>> 8) ^ CRC_TABLE[(c ^ bytes[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function createStoredZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach(({ name, content }) => {
    const nameBytes = encoder.encode(name);
    const dataBytes =
      typeof content === 'string' ? encoder.encode(content) : content;
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + size;
  });

  const centralSize = centralParts.reduce((acc, arr) => acc + arr.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, eocd], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

/** Mengunduh template Word untuk impor data mata pelajaran. */
export function downloadSubjectWordTemplate() {
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const makeRowXml = (col1, col2, col3) => `
    <w:tr>
      <w:tc><w:p><w:r><w:t>${col1}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:t>${col2}</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:t>${col3}</w:t></w:r></w:p></w:tc>
    </w:tr>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Template Impor Mata Pelajaran BinoExam (Jangan ubah baris judul tabel di bawah ini)</w:t>
      </w:r>
    </w:p>
    <w:tbl>
      ${makeRowXml('No', 'Kode Mapel', 'Nama Mapel')}
      ${makeRowXml('1', 'MP-FIS', 'Fisika Dasar')}
      ${makeRowXml('2', 'MP-KIM', 'Kimia Terapan')}
      ${makeRowXml('3', 'MP-BIO', 'Biologi Umum')}
    </w:tbl>
  </w:body>
</w:document>`;

  const blob = createStoredZip([
    { name: '[Content_Types].xml', content: contentTypesXml },
    { name: '_rels/.rels', content: relsXml },
    { name: 'word/document.xml', content: documentXml },
  ]);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Template_Impor_Mata_Pelajaran.docx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

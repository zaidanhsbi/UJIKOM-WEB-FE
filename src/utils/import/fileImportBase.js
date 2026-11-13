const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.docx'];

function getFileExtension(filename = '') {
  const lower = String(filename).toLowerCase().trim();
  const dotIdx = lower.lastIndexOf('.');
  return dotIdx !== -1 ? lower.slice(dotIdx) : '';
}

/** Menormalkan teks header tabel menjadi huruf kecil tanpa spasi berlebih. */
export function normalizeHeader(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Memeriksa apakah nama kolom yang sudah dinormalkan merepresentasikan kata sandi. */
export function isPasswordHeader(norm) {
  return ['password', 'katasandi', 'sandi', 'pass'].includes(norm);
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

function crc32(bytes) {
  let c = -1;
  for (let i = 0; i < bytes.length; i += 1) {
    c = (c >>> 8) ^ CRC_TABLE[(c ^ bytes[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}

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

/** Membuat dan mengunduh file Excel (.xlsx) berisi tabel contoh. */
export async function downloadExcelTable(filename, sheetName, sampleData, colWidths) {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
  if (colWidths) {
    worksheet['!cols'] = colWidths.map((wch) => ({ wch }));
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

/** Membuat dan mengunduh file Word (.doc) berisi tabel HTML sederhana. */
export function downloadDocxTable(filename, titleText, rows) {
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

  const rowsXml = rows
    .map(
      (cols) =>
        `<w:tr>${cols
          .map((c) => `<w:tc><w:p><w:r><w:t>${c}</w:t></w:r></w:p></w:tc>`)
          .join('')}</w:tr>`
    )
    .join('');

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>${titleText}</w:t></w:r></w:p>
    <w:tbl>${rowsXml}</w:tbl>
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
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Ekstrak matriks baris mentah (Array of Arrays) dari file Excel (.xlsx/.xls) atau Word (.docx)
 */
export async function extractRawMatrixFromFile(file) {
  if (!file) {
    throw new Error('Tidak ada file yang dipilih.');
  }

  const ext = getFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Format file "${ext || file.name}" tidak didukung. Harap unggah file Excel (.xlsx, .xls) atau Word (.docx).`
    );
  }

  if (file.size === 0) {
    throw new Error('File yang dipilih kosong (0 byte).');
  }

  if (ext === '.xlsx' || ext === '.xls') {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    let workbook;
    try {
      workbook = XLSX.read(buffer, { type: 'array' });
    } catch {
      throw new Error(
        'File Excel rusak atau tidak dapat dibaca. Gunakan template .xlsx resmi.'
      );
    }

    const firstSheetName = workbook.SheetNames?.[0];
    if (!firstSheetName) {
      throw new Error('File Excel tidak memiliki lembar kerja (sheet).');
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rows || rows.length === 0) {
      throw new Error('File Excel kosong. Silakan unduh template terlebih dahulu.');
    }
    return rows;
  }

  // Word (.docx)
  const mammothModule = await import('mammoth');
  const mammoth = mammothModule.default || mammothModule;
  const buffer = await file.arrayBuffer();
  let htmlResult;
  try {
    htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
  } catch {
    throw new Error(
      'File Word (.docx) rusak atau tidak dapat dibaca. Pastikan file berformat .docx yang valid.'
    );
  }

  const html = htmlResult?.value || '';
  if (!html.trim()) {
    throw new Error('File Word (.docx) kosong. Silakan gunakan template yang tersedia.');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tables = doc.querySelectorAll('table');
  if (tables.length === 0) {
    throw new Error(
      'Tidak ditemukan tabel di dalam file .docx. Gunakan format tabel dari template resmi.'
    );
  }

  const trList = Array.from(tables[0].querySelectorAll('tr'));
  return trList.map((tr) =>
    Array.from(tr.querySelectorAll('th, td')).map((cell) =>
      String(cell.textContent || '').trim()
    )
  );
}

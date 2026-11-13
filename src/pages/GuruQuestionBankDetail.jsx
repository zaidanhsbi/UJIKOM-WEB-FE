import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  Plus,
  FileSpreadsheet,
  Lock,
  Globe,

  Pencil,
  Trash2,
  Download,
  Upload,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import AlertBanner from '../components/ui/AlertBanner';
import { GURU_MENUS } from '../config/navigation';
import {
  fetchQuestionBankDetail,
  updateQuestionBank,
  deleteQuestion,
  importQuestions,
  downloadDocxTemplate,
  importQuestionsDocx,
} from '../services/guru.service';

const TYPE_LABELS = {
  pg: 'PG',
  pgk: 'PG Kompleks',
  bs: 'Benar/Salah',
  jd: 'Menjodohkan',
  ur: 'Urutan',
};

/** Halaman detail bank soal beserta daftar soal di dalamnya. */
export default function GuruQuestionBankDetail({
  user,
  bankId,
  onNavigate,
  onLogout,
}) {
  const [bank, setBank] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState({ type: '', message: '' });
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [toggling, setToggling] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let active = true;
    const loadDetail = async () => {
      try {
        setLoading(true);
        const res = await fetchQuestionBankDetail(bankId);
        if (active) {
          setBank(res.question_bank);
          setQuestions(res.questions || []);
        }
      } catch (err) {
        if (active) {
          setBanner({ type: 'error', message: err.message || 'Gagal memuat detail paket soal.' });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadDetail();
    return () => {
      active = false;
    };
  }, [bankId, reloadTick]);

  const handleToggleVisibility = async () => {
    if (!bank || !bank.is_owner) return;
    const nextVisibility = bank.visibility === 'private' ? 'school' : 'private';
    try {
      setToggling(true);
      const res = await updateQuestionBank(bank.id, { visibility: nextVisibility });
      setBank(res.question_bank);
      setBanner({
        type: 'success',
        message:
          nextVisibility === 'school'
            ? 'Paket soal sekarang dibagikan ke Bank Sekolah.'
            : 'Paket soal diubah menjadi Privat.',
      });
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Gagal mengubah visibilitas.' });
    } finally {
      setToggling(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Yakin ingin menghapus butir soal ini?')) return;
    try {
      await deleteQuestion(qId);
      setBanner({ type: 'success', message: 'Butir soal berhasil dihapus.' });
      setReloadTick((t) => t + 1);
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Gagal menghapus butir soal.' });
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'Jenis Soal (PG/PGK/BS/JD/UR)',
      'Teks Soal',
      'Opsi A',
      'Opsi B',
      'Opsi C',
      'Opsi D',
      'Opsi E',
      'Kunci Jawaban',
      'Bobot',
    ];
    const sampleRows = [
      ['PG', 'Ibukota negara Indonesia adalah...', 'Bandung', 'Jakarta', 'Surabaya', 'Medan', 'Makassar', 'B', 2],
      ['PGK', 'Pilih bilangan prima di bawah ini!', '2', '4', '5', '6', '7', 'A,C,E', 3],
      ['BS', 'Matahari terbit dari arah timur.', '', '', '', '', '', 'B', 1],
      ['JD', 'Pasangkan negara dengan ibu kotanya.', 'Indonesia = Jakarta', 'Jepang = Tokyo', 'Prancis = Paris', '', '', 'SESUAI', 4],
      ['UR', 'Urutkan peristiwa sejarah dari yang paling awal.', 'Proklamasi 1945', 'KMB 1949', 'Pemilu Pertama 1955', '', '', 'URUT', 3],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = [
      { wch: 26 },
      { wch: 36 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 8 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Soal');
    XLSX.writeFile(wb, 'Template_Import_Soal_BinoExam.xlsx');
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      setImporting(true);
      setImportErrors([]);

      let res;
      if (file.name.toLowerCase().endsWith('.docx')) {
        res = await importQuestionsDocx(bankId, file);
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        const dataRows = rawRows.slice(1).filter((r) => r.some((cell) => String(cell).trim() !== ''));
        if (dataRows.length === 0) {
          setImportErrors(['File Excel tidak memiliki baris data.']);
          return;
        }

        const payloadRows = dataRows.map((r) => ({
          type: String(r[0] ?? ''),
          text: String(r[1] ?? ''),
          option_a: String(r[2] ?? ''),
          option_b: String(r[3] ?? ''),
          option_c: String(r[4] ?? ''),
          option_d: String(r[5] ?? ''),
          option_e: String(r[6] ?? ''),
          answer: String(r[7] ?? ''),
          weight: r[8] ? Number(r[8]) : 1,
        }));

        res = await importQuestions(bankId, payloadRows);
      }

      setImportErrors(res.errors || []);
      setBanner({
        type: res.imported_count > 0 ? 'success' : 'error',
        message: res.message || `${res.imported_count} soal berhasil diimpor.`,
      });
      if (res.imported_count > 0) {
        setReloadTick((t) => t + 1);
      }
      if (!res.errors || res.errors.length === 0) {
        setImportOpen(false);
      }
    } catch (err) {
      setImportErrors([err.message || 'Gagal membaca atau mengimpor file.']);
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminLayout
      user={user}
      currentPath="/guru/bank-soal"
      onNavigate={onNavigate}
      onLogout={onLogout}
      menus={GURU_MENUS}
      headerTitle="Detail Paket Soal"
      settingsPath="/guru/profil"
    >
      <div className="flex flex-col gap-lg w-full">
        {banner.message && (
          <AlertBanner
            variant={banner.type}
            message={banner.message}
            onClose={() => setBanner({ type: '', message: '' })}
          />
        )}

        <div>
          <button
            type="button"
            onClick={() => onNavigate?.('/guru/bank-soal')}
            className="inline-flex items-center gap-xs text-sm font-semibold text-primary hover:underline cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Daftar Bank Soal</span>
          </button>
        </div>

        {loading ? (
          <div className="py-xxl text-center text-md text-text-secondary">
            Memuat detail paket soal...
          </div>
        ) : bank ? (
          <>
            {/* Header Paket */}
            <div className="bg-surface border border-border rounded-lg p-xl flex flex-wrap items-center justify-between gap-md">
              <div className="flex flex-col gap-xs">
                <h1 className="text-xl font-bold text-text">{bank.name}</h1>
                <div className="flex flex-wrap items-center gap-sm text-sm text-text-secondary">
                  <span>{bank.subject?.name || '-'}</span>
                  <span>•</span>
                  <span>Kelas {bank.grade}</span>
                  <span>•</span>
                  <span>{questions.length} Soal</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-sm">
                {bank.is_owner && (
                  <button
                    type="button"
                    disabled={toggling}
                    onClick={handleToggleVisibility}
                    className={`min-h-[44px] px-lg rounded-md border text-sm font-semibold inline-flex items-center gap-xs cursor-pointer transition-colors ${
                      bank.visibility === 'school'
                        ? 'bg-soft-blue border-primary text-primary'
                        : 'bg-background border-border text-text'
                    }`}
                  >
                    {bank.visibility === 'school' ? (
                      <>
                        <Globe size={20} strokeWidth={1.5} />
                        <span>Dibagikan ke Sekolah</span>
                      </>
                    ) : (
                      <>
                        <Lock size={20} strokeWidth={1.5} />
                        <span>Privat (Klik untuk Bagikan)</span>
                      </>
                    )}
                  </button>
                )}

                {bank.is_owner && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setImportErrors([]);
                        setImportOpen(true);
                      }}
                      className="min-h-[48px] px-lg bg-surface hover:bg-background border border-border text-navy font-semibold text-sm rounded-md transition-colors inline-flex items-center justify-center gap-sm cursor-pointer"
                    >
                      <FileSpreadsheet size={20} strokeWidth={1.5} />
                      <span>Import Soal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate?.(`/guru/bank-soal/${bank.id}/editor`)}
                      className="min-h-[48px] px-xl bg-primary hover:bg-blue text-white font-semibold text-sm rounded-md transition-colors inline-flex items-center justify-center gap-sm cursor-pointer"
                    >
                      <Plus size={20} strokeWidth={1.5} />
                      <span>Tambah Soal</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Area Konten: Daftar Soal */}
            <DataTable
              columns={[
                {
                  key: 'no',
                  header: 'No',
                  width: '64px',
                  render: (_q, idx) => <span className="font-semibold">{idx + 1}</span>,
                },
                {
                  key: 'type',
                  header: 'Jenis',
                  render: (q) => (
                    <span className="px-sm py-xs rounded-pill bg-soft-blue text-primary text-xs font-semibold">
                      {TYPE_LABELS[q.type] || q.type}
                    </span>
                  ),
                },
                {
                  key: 'text',
                  header: 'Pertanyaan',
                  render: (q) => (
                    <span className="block max-w-[380px] truncate text-text">
                      {q.content?.text || '-'}
                    </span>
                  ),
                },
                {
                  key: 'difficulty',
                  header: 'Kesulitan',
                  render: (q) => (
                    <span className="capitalize text-text-secondary">{q.difficulty}</span>
                  ),
                },
                {
                  key: 'weight',
                  header: 'Bobot',
                  sortable: true,
                  render: (q) => <span className="font-semibold">{q.weight}</span>,
                },
                ...(bank.is_owner
                  ? [
                      {
                        key: 'actions',
                        header: 'Aksi',
                        align: 'right',
                        render: (q) => (
                          <div className="inline-flex items-center justify-end gap-xs">
                            <button
                              type="button"
                              onClick={() =>
                                onNavigate?.(`/guru/bank-soal/${bank.id}/editor/${q.id}`)
                              }
                              className="min-h-[36px] px-md py-xs rounded-sm border border-light-blue text-primary hover:bg-soft-blue text-xs font-semibold inline-flex items-center gap-xs transition-colors cursor-pointer"
                              title="Edit Soal"
                            >
                              <Pencil size={18} strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="min-h-[36px] px-md py-xs rounded-sm bg-alert-danger-bg hover:bg-coral text-alert-danger-text hover:text-white text-xs font-semibold inline-flex items-center gap-xs transition-colors cursor-pointer"
                              title="Hapus Soal"
                            >
                              <Trash2 size={18} strokeWidth={1.5} />
                            </button>
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
              data={questions}
              loading={loading}
              emptyText='Belum ada butir soal di dalam paket ini. Klik "Tambah Soal" atau "Import Soal" untuk mulai mengisi.'
            />
          </>
        ) : null}
      </div>

      {/* Modal Import Excel / Word */}
      <Modal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Soal (Excel / Word)"
        maxWidth="680px"
      >
        <div className="flex flex-col gap-md">
          <div className="p-md rounded-md bg-background border border-border text-xs text-text flex flex-col gap-xs">
            <p className="font-bold text-sm text-navy">Panduan Format & Contoh per Jenis Soal</p>
            <ul className="list-disc pl-lg flex flex-col gap-xxs text-text-secondary">
              <li>
                <span className="font-semibold text-text">PG (Pilihan Ganda):</span> Isi Opsi A–E, Kunci <code className="font-mono text-text">B</code> (pilih satu: A–E).
              </li>
              <li>
                <span className="font-semibold text-text">PGK (PG Kompleks):</span> Isi Opsi A–E, Kunci pisahkan koma seperti <code className="font-mono text-text">A,C,E</code>.
              </li>
              <li>
                <span className="font-semibold text-text">BS (Benar / Salah):</span> Kosongkan Opsi A–E, Kunci <code className="font-mono text-text">B</code> (Benar) atau <code className="font-mono text-text">S</code> (Salah).
              </li>
              <li>
                <span className="font-semibold text-text">JD (Menjodohkan):</span> Isi pasangan di Opsi A–E memakai <code className="font-mono text-text">=</code>, mis. <code className="font-mono text-text">Indonesia = Jakarta</code> (minimal 2 pasangan). Kolom Kunci isi <code className="font-mono text-text">SESUAI</code>.
              </li>
              <li>
                <span className="font-semibold text-text">UR (Urutan):</span> Isi urutan yang benar secara berurutan di Opsi A–E (minimal 2 item). Kolom Kunci isi <code className="font-mono text-text">URUT</code>.
              </li>
              <li>
                <span className="font-semibold text-text">Soal dengan Gambar:</span> Excel (<code className="font-mono">.xlsx</code>) hanya mendukung teks. Untuk menyertakan gambar pada soal/opsi, gunakan <span className="font-semibold text-text">Template Word (.docx)</span> lalu tempel (paste) gambar langsung di dalam sel <span className="font-semibold text-text">Teks Soal</span> atau <span className="font-semibold text-text">Opsi A–E</span>.
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="min-h-[44px] px-md rounded-md border border-primary bg-soft-blue/40 hover:bg-soft-blue text-primary text-sm font-semibold inline-flex items-center justify-center gap-xs cursor-pointer"
            >
              <Download size={16} />
              <span>Template Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={() => downloadDocxTemplate().catch((err) => setImportErrors([err.message]))}
              className="min-h-[44px] px-md rounded-md border border-primary bg-soft-blue/40 hover:bg-soft-blue text-primary text-sm font-semibold inline-flex items-center justify-center gap-xs cursor-pointer"
            >
              <Download size={16} />
              <span>Template Word (.docx)</span>
            </button>
          </div>

          <label className="flex flex-col items-center justify-center gap-xs p-xl rounded-md border-2 border-dashed border-border bg-background hover:border-primary cursor-pointer text-center">
            <Upload size={24} className="text-primary" />
            <span className="text-sm font-semibold text-text">
              {importing ? 'Mengimpor soal...' : 'Klik untuk memilih file .xlsx atau .docx'}
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.docx"
              disabled={importing}
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          {importErrors.length > 0 && (
            <div className="p-md rounded-md bg-coral/15 border border-coral text-xs text-text flex flex-col gap-xs max-h-[140px] overflow-y-auto">
              {importErrors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setImportOpen(false)}
              className="min-h-[44px] px-xl rounded-md border border-border bg-surface text-text text-sm font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}

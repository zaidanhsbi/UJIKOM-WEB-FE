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
  ChevronDown,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import AlertBanner from '../components/ui/AlertBanner';
import MathText from '../components/ui/MathText';
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
  const [importDropdownOpen, setImportDropdownOpen] = useState(false);
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
      ['PG', 'Hitung nilai dari $\\frac{x^2 - 9}{x - 3}$ untuk $x = 5$:', '6', '8', '10', '12', '14', 'B', 2],
      ['PGK', 'Pilih bilangan prima di bawah ini!', '2', '4', '5', '6', '7', 'A,C,E', 3],
      ['BS', 'Nilai limit $\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2} = 4$ adalah benar.', '', '', '', '', '', 'B', 1],
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
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setImportDropdownOpen((prev) => !prev)}
                        className="min-h-[48px] px-lg bg-surface hover:bg-background border border-border text-navy font-semibold text-sm rounded-md transition-colors inline-flex items-center justify-center gap-sm cursor-pointer"
                      >
                        <Upload size={18} strokeWidth={1.8} />
                        <span>Import Soal</span>
                        <ChevronDown size={16} strokeWidth={2} />
                      </button>

                      {importDropdownOpen && (
                        <div className="absolute right-0 mt-xs w-[250px] bg-surface border border-border rounded-md shadow-lg z-30 p-xs flex flex-col gap-xxs">
                          <button
                            type="button"
                            onClick={() => {
                              setImportDropdownOpen(false);
                              setImportErrors([]);
                              setImportOpen(true);
                            }}
                            className="w-full min-h-[40px] px-md py-xs rounded-sm hover:bg-soft-blue text-navy text-xs font-semibold text-left flex items-center gap-sm transition-colors cursor-pointer"
                          >
                            <Upload size={16} strokeWidth={2} className="text-primary shrink-0" />
                            <span>Unggah Excel / Word (.xlsx / .docx)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setImportDropdownOpen(false);
                              handleDownloadTemplate();
                            }}
                            className="w-full min-h-[40px] px-md py-xs rounded-sm hover:bg-soft-blue text-navy text-xs font-semibold text-left flex items-center gap-sm transition-colors cursor-pointer"
                          >
                            <Download size={16} strokeWidth={2} className="text-navy shrink-0" />
                            <span>Download Template Excel (.xlsx)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setImportDropdownOpen(false);
                              downloadDocxTemplate().catch((err) => setBanner({ type: 'error', message: err.message }));
                            }}
                            className="w-full min-h-[40px] px-md py-xs rounded-sm hover:bg-soft-blue text-navy text-xs font-semibold text-left flex items-center gap-sm transition-colors cursor-pointer"
                          >
                            <Download size={16} strokeWidth={2} className="text-navy shrink-0" />
                            <span>Download Template Word (.docx)</span>
                          </button>
                        </div>
                      )}
                    </div>

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
                    <MathText
                      text={q.content?.text || '-'}
                      className="block max-w-[380px] truncate text-text"
                    />
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

      {/* Modal Import Excel / Word (Seragam Gaya Langkah 1-2-3) */}
      <Modal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Soal (Excel / Word)"
        maxWidth="640px"
      >
        <div className="flex flex-col gap-md">
          {/* Petunjuk 3 Langkah Impor */}
          <div className="p-lg rounded-md bg-background border border-border flex flex-col gap-sm text-xs text-text-secondary">
            {/* Langkah 1 */}
            <div className="flex items-start gap-sm">
              <span className="w-[24px] h-[24px] rounded-pill bg-soft-blue text-navy font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <div className="flex-1">
                <strong className="text-navy font-semibold block">
                  Langkah 1: Unduh Template Resmi
                </strong>
                <span>
                  Gunakan format tabel standar agar sistem mengenali soal dan kunci jawaban.{' '}
                  <strong className="text-navy">
                    Catatan: Soal dengan gambar hanya mendukung format Word (.docx), tidak mendukung Excel (.xlsx).
                  </strong>
                </span>
                <div className="flex flex-wrap items-center gap-sm mt-xs">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="min-h-[36px] px-md py-xs rounded-sm border border-border bg-surface hover:bg-soft-blue text-navy text-xs font-semibold inline-flex items-center gap-xs transition-colors cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download Template Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadDocxTemplate().catch((err) => setImportErrors([err.message]))}
                    className="min-h-[36px] px-md py-xs rounded-sm border border-border bg-surface hover:bg-soft-blue text-navy text-xs font-semibold inline-flex items-center gap-xs transition-colors cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download Template Word (.docx)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Langkah 2 */}
            <div className="flex items-start gap-sm">
              <span className="w-[24px] h-[24px] rounded-pill bg-soft-blue text-navy font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <div className="flex-1">
                <strong className="text-navy font-semibold block">
                  Langkah 2: Isi Data Soal Sesuai Format
                </strong>
                <ul className="list-disc pl-md mt-xxs flex flex-col gap-xxs">
                  <li>
                    <strong>PG:</strong> Isi Opsi A–E, Kunci <code>B</code> (satu huruf A–E).
                  </li>
                  <li>
                    <strong>PGK:</strong> Isi Opsi A–E, Kunci pisahkan koma seperti <code>A,C,E</code>.
                  </li>
                  <li>
                    <strong>BS:</strong> Kosongkan Opsi A–E, Kunci <code>B</code> (Benar) atau <code>S</code> (Salah).
                  </li>
                  <li>
                    <strong>JD:</strong> Isi pasangan di Opsi A–E memakai <code>=</code> (min. 2), mis. <code>Indonesia = Jakarta</code>. Kunci isi <code>SESUAI</code>.
                  </li>
                  <li>
                    <strong>UR:</strong> Isi urutan benar di Opsi A–E (min. 2 item). Kunci isi <code>URUT</code>.
                  </li>
                  <li>
                    <strong>Gambar:</strong> Tempel (paste) gambar langsung di sel <strong>Teks Soal</strong> atau <strong>Opsi A–E</strong> pada file Word (.docx).
                  </li>
                </ul>
              </div>
            </div>

            {/* Langkah 3 */}
            <div className="flex items-start gap-sm">
              <span className="w-[24px] h-[24px] rounded-pill bg-soft-blue text-navy font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <div className="flex-1">
                <strong className="text-navy font-semibold block">
                  Langkah 3: Unggah File (.xlsx / .docx)
                </strong>
                <span>
                  Pilih file yang sudah diisi untuk divalidasi dan disimpan otomatis ke bank soal.
                </span>
                <div className="mt-xs flex flex-wrap items-center gap-sm">
                  <label className={`min-h-[36px] px-lg py-xs rounded-sm text-white text-xs font-semibold inline-flex items-center gap-xs transition-colors ${importing ? 'bg-text-disabled cursor-not-allowed' : 'bg-primary hover:bg-blue cursor-pointer'}`}>
                    <Upload size={14} />
                    <span>{importing ? 'Memproses File...' : 'Pilih & Unggah File'}</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.docx"
                      disabled={importing}
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {importErrors.length > 0 && (
            <div className="p-md rounded-md bg-coral/15 border border-coral text-xs text-text flex flex-col gap-xs max-h-[140px] overflow-y-auto">
              {importErrors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-xs">
            <button
              type="button"
              onClick={() => setImportOpen(false)}
              className="min-h-[38px] px-lg py-xs rounded-sm border border-border bg-surface hover:bg-background text-navy text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}

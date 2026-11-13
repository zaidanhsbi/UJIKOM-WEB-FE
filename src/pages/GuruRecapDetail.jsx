import { useCallback, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  Download,
  Printer,
  Award,
  TrendingUp,
  TrendingDown,
  Users,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import DataTable from '../components/ui/DataTable';
import StatCard from '../components/ui/StatCard';
import Modal from '../components/ui/Modal';
import AlertBanner from '../components/ui/AlertBanner';
import { GURU_MENUS } from '../config/navigation';
import { fetchRecapDetail } from '../services/guru.service';

function sanitizeExcelCell(val) {
  const str = String(val ?? '');
  if (/^[=+\-@]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

function formatDuration(seconds) {
  const s = Number(seconds || 0);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}d`;
}

/** Halaman detail rekapitulasi nilai siswa untuk satu ujian. */
export default function GuruRecapDetail({
  user,
  examId,
  onNavigate,
  onLogout,
}) {
  const [tab, setTab] = useState('nilai');
  const [kkm, setKkm] = useState(75);
  const [rombelFilter, setRombelFilter] = useState('');
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchRecapDetail(examId, {
        kkm,
        rombel_id: rombelFilter,
        search,
      });
      setData(res);
    } catch (err) {
      setError(err.message || 'Gagal memuat detail rekap nilai.');
    } finally {
      setLoading(false);
    }
  }, [examId, kkm, rombelFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDetail();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadDetail]);

  const handleExportExcel = () => {
    if (!data) return;
    const { exam, summary, students } = data;
    const rombelLabel = rombelFilter
      ? exam.rombels.find((r) => String(r.id) === String(rombelFilter))?.name || 'Semua'
      : 'Semua Rombel';

    const headerRows = [
      ['Rekap Nilai Ujian', sanitizeExcelCell(exam.name)],
      ['Mata Pelajaran', sanitizeExcelCell(exam.subject_name)],
      ['Rombel', sanitizeExcelCell(rombelLabel)],
      ['Tanggal', sanitizeExcelCell(exam.date || '-')],
      ['KKM', summary.kkm],
      ['Rata-rata', summary.average],
      [],
      ['No', 'NIS', 'Nama', 'Rombel', 'Benar', 'Salah', 'Kosong', 'Nilai', 'Status', 'Lama Mengerjakan'],
    ];

    const bodyRows = students.map((s, idx) => [
      idx + 1,
      sanitizeExcelCell(s.nis),
      sanitizeExcelCell(s.name),
      sanitizeExcelCell(s.rombel),
      s.correct_count,
      s.wrong_count,
      s.blank_count,
      s.score,
      s.passed ? 'Tuntas' : 'Belum Tuntas',
      formatDuration(s.duration_seconds),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...headerRows, ...bodyRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Nilai');

    const safeName = String(exam.name || 'Ujian').replace(/[^a-zA-Z0-9_-]+/g, '-');
    const dateStr = exam.date || new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Rekap_${safeName}_${dateStr}.xlsx`);
  };

  const exam = data?.exam;
  const summary = data?.summary || { average: 0, highest: 0, lowest: 0, passed_count: 0, total_students: 0, kkm };
  const students = data?.students || [];
  const questionAnalysis = data?.question_analysis || [];

  return (
    <AdminLayout
      user={user}
      currentPath="/guru/rekap-nilai"
      onNavigate={onNavigate}
      onLogout={onLogout}
      menus={GURU_MENUS}
      headerTitle="Detail Rekap Nilai"
      settingsPath="/guru/profil"
    >
      <div className="flex flex-col gap-lg w-full">
        {error && (
          <AlertBanner variant="error" message={error} onClose={() => setError('')} />
        )}

        <div className="flex flex-wrap items-center justify-between gap-md">
          <button
            type="button"
            onClick={() => onNavigate?.('/guru/rekap-nilai')}
            className="inline-flex items-center gap-xs text-sm font-semibold text-primary hover:underline cursor-pointer"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
            <span>Kembali ke Daftar Rekap</span>
          </button>

          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={!data}
              className="min-h-[48px] px-lg bg-surface hover:bg-background border border-border text-navy font-semibold text-sm rounded-md transition-colors inline-flex items-center justify-center gap-sm cursor-pointer disabled:opacity-50"
            >
              <Download size={20} strokeWidth={1.5} />
              <span>Ekspor Excel</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!data}
              className="min-h-[48px] px-xl bg-primary hover:bg-blue disabled:bg-text-disabled text-white font-semibold text-sm rounded-md transition-colors inline-flex items-center justify-center gap-sm cursor-pointer"
            >
              <Printer size={20} strokeWidth={1.5} />
              <span>Ekspor PDF</span>
            </button>
          </div>
        </div>

        {exam && (
          <div className="flex flex-wrap items-center justify-between gap-md">
            <div>
              <h1 className="text-xl font-bold text-text">{exam.name}</h1>
              <p className="text-sm text-text-secondary">
                {exam.subject_name} • {exam.date || '-'}
              </p>
            </div>
            <label className="inline-flex items-center gap-xs text-sm font-semibold text-text">
              <span>KKM:</span>
              <input
                type="number"
                min={0}
                max={100}
                value={kkm}
                onChange={(e) => setKkm(Number(e.target.value) || 0)}
                className="w-[72px] min-h-[36px] px-sm rounded-sm border border-border bg-surface text-sm text-text"
              />
            </label>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-sm border-b border-border">
          <button
            type="button"
            onClick={() => setTab('nilai')}
            className={`min-h-[44px] px-lg py-sm text-md font-semibold border-b-2 cursor-pointer ${
              tab === 'nilai'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text'
            }`}
          >
            Nilai Siswa
          </button>
          <button
            type="button"
            onClick={() => setTab('analisis')}
            className={`min-h-[44px] px-lg py-sm text-md font-semibold border-b-2 cursor-pointer ${
              tab === 'analisis'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text'
            }`}
          >
            Analisis Soal
          </button>
        </div>

        {loading ? (
          <div className="py-xxl text-center text-md text-text-secondary">
            Memuat data rekap...
          </div>
        ) : tab === 'nilai' ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
              <StatCard
                title="Rata-rata Nilai"
                value={summary.average}
                subtitle={`Dari ${summary.total_students} peserta`}
                icon={<Users size={20} strokeWidth={1.5} />}
              />
              <StatCard
                title="Nilai Tertinggi"
                value={summary.highest}
                subtitle="Skor maksimal peserta"
                icon={<TrendingUp size={20} strokeWidth={1.5} />}
              />
              <StatCard
                title="Nilai Terendah"
                value={summary.lowest}
                subtitle="Skor minimal peserta"
                icon={<TrendingDown size={20} strokeWidth={1.5} />}
              />
              <StatCard
                title={`Tuntas (KKM ${kkm})`}
                value={`${summary.passed_count}/${summary.total_students}`}
                subtitle="Peserta mencapai KKM"
                icon={<Award size={20} strokeWidth={1.5} />}
              />
            </div>

            {/* Tabel Nilai Siswa */}
            <DataTable
              columns={[
                {
                  key: 'no',
                  header: 'No',
                  width: '60px',
                  render: (_s, idx) => idx + 1,
                },
                {
                  key: 'nis',
                  header: 'NIS',
                  sortable: true,
                  render: (s) => <span className="font-mono text-xs">{s.nis}</span>,
                },
                {
                  key: 'name',
                  header: 'Nama',
                  sortable: true,
                  render: (s) => (
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(s)}
                      className="font-semibold text-primary hover:underline text-left cursor-pointer"
                    >
                      {s.name}
                    </button>
                  ),
                },
                { key: 'rombel', header: 'Rombel', sortable: true },
                { key: 'correct_count', header: 'Benar', sortable: true },
                { key: 'wrong_count', header: 'Salah', sortable: true },
                { key: 'blank_count', header: 'Kosong', sortable: true },
                {
                  key: 'score',
                  header: 'Nilai',
                  sortable: true,
                  render: (s) => <span className="font-bold text-text">{s.score}</span>,
                },
                {
                  key: 'passed',
                  header: 'Status',
                  render: (s) => (
                    <span
                      className={`px-sm py-xs rounded-pill text-xs font-semibold ${
                        s.passed ? 'bg-mint/20 text-text' : 'bg-coral/20 text-text'
                      }`}
                    >
                      {s.passed ? 'Tuntas' : 'Belum'}
                    </span>
                  ),
                },
                {
                  key: 'duration_seconds',
                  header: 'Lama',
                  sortable: true,
                  render: (s) => (
                    <span className="text-xs text-text-secondary">
                      {formatDuration(s.duration_seconds)}
                    </span>
                  ),
                },
              ]}
              data={students}
              loading={loading}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Cari NIS atau nama siswa..."
              emptyText="Belum ada data nilai siswa untuk ujian ini."
              filterSlot={
                <select
                  value={rombelFilter}
                  onChange={(e) => setRombelFilter(e.target.value)}
                  className="min-h-[48px] px-md rounded-md border border-border bg-surface text-sm text-text"
                >
                  <option value="">Semua Rombel</option>
                  {(exam?.rombels || []).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              }
            />
          </>
        ) : (
          /* Tab Analisis Soal */
          <DataTable
            columns={[
              {
                key: 'no',
                header: 'No',
                width: '60px',
                sortable: true,
                render: (q) => <span className="font-semibold">{q.no}</span>,
              },
              {
                key: 'text',
                header: 'Pertanyaan',
                render: (q) => (
                  <span className="block max-w-[320px] truncate">{q.text}</span>
                ),
              },
              {
                key: 'correct_count',
                header: 'Benar / Total',
                render: (q) => `${q.correct_count} / ${q.total_attempts}`,
              },
              {
                key: 'percent_correct',
                header: '% Benar',
                sortable: true,
                render: (q) => <span className="font-bold">{q.percent_correct}%</span>,
              },
              {
                key: 'empirical_difficulty',
                header: 'Kesulitan Data',
                render: (q) => <span className="capitalize">{q.empirical_difficulty}</span>,
              },
              {
                key: 'teacher_difficulty',
                header: 'Label Guru',
                render: (q) => (
                  <span className="capitalize text-text-secondary">{q.teacher_difficulty}</span>
                ),
              },
            ]}
            data={questionAnalysis}
            loading={loading}
            emptyText="Belum ada butir soal untuk dianalisis."
          />
        )}
      </div>

      {/* Modal Detail Jawaban Siswa */}
      <Modal
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        title={`Detail Jawaban: ${selectedStudent?.name || ''}`}
        maxWidth="640px"
      >
        <div className="flex flex-col gap-sm max-h-[420px] overflow-y-auto">
          {(selectedStudent?.answers || []).map((a, idx) => (
            <div
              key={a.question_id}
              className="p-md rounded-md border border-border bg-background flex flex-col gap-xs text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-text">Soal {idx + 1}</span>
                <span
                  className={`px-sm py-xxs rounded-pill text-xs font-semibold ${
                    a.is_correct === true
                      ? 'bg-mint/20 text-text'
                      : a.is_correct === false
                      ? 'bg-coral/20 text-text'
                      : 'bg-surface border border-border text-text-secondary'
                  }`}
                >
                  {a.is_correct === true ? 'Benar' : a.is_correct === false ? 'Salah' : 'Kosong'}
                </span>
              </div>
              <p className="text-text-secondary text-xs">{a.text}</p>
              <div className="flex gap-lg text-xs">
                <span>
                  Jawaban Siswa: <strong>{a.student_answer || '-'}</strong>
                </span>
                <span>
                  Kunci: <strong>{a.correct_key || '-'}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </AdminLayout>
  );
}

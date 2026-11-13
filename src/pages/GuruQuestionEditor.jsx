import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ImagePlus,
  Trash2,
  Save,
  Plus,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import AlertBanner from '../components/ui/AlertBanner';
import { GURU_MENUS } from '../config/navigation';
import {
  fetchQuestion,
  createQuestion,
  updateQuestion,
  uploadQuestionMedia,
  fetchQuestionBanks,
} from '../services/guru.service';
import {
  QUESTION_TYPES,
  DIFFICULTIES,
  OPTION_KEYS,
  emptyOptions,
  resolveImageUrl,
} from '../features/questions/questionConstants';
import PgOptionsEditor from '../features/questions/editors/PgOptionsEditor';
import BsAnswerEditor from '../features/questions/editors/BsAnswerEditor';
import JdPairsEditor from '../features/questions/editors/JdPairsEditor';
import UrItemsEditor from '../features/questions/editors/UrItemsEditor';
import QuestionPreviewPanel from '../features/questions/QuestionPreviewPanel';

/** Halaman editor untuk membuat atau mengubah butir soal. */
export default function GuruQuestionEditor({
  user,
  bankId,
  questionId = null,
  onNavigate,
  onLogout,
}) {
  const isEdit = Boolean(questionId);
  const draftKey = `binoexam_question_draft_${bankId || 'new'}_${questionId || 'create'}`;

  const [type, setType] = useState('pg');
  const [difficulty, setDifficulty] = useState('sedang');
  const [weight, setWeight] = useState(1);
  const [explanation, setExplanation] = useState('');
  const [text, setText] = useState('');
  const [mainImage, setMainImage] = useState(null);
  const [altText, setAltText] = useState('');
  const [options, setOptions] = useState(emptyOptions);
  const [pgAnswer, setPgAnswer] = useState('');
  const [pgkAnswers, setPgkAnswers] = useState([]);
  const [bsAnswer, setBsAnswer] = useState('true');
  const [pairs, setPairs] = useState([
    { left: '', right: '' },
    { left: '', right: '' },
  ]);
  const [urItems, setUrItems] = useState(['', '', '']);

  // Target package (existing or inline new)
  const [targetMode, setTargetMode] = useState('existing');
  const [selectedBankId, setSelectedBankId] = useState(bankId ? String(bankId) : '');
  const [banks, setBanks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rombels, setRombels] = useState([]);
  const [newBankName, setNewBankName] = useState('');
  const [newBankSubjectId, setNewBankSubjectId] = useState('');
  const [newBankGrade, setNewBankGrade] = useState('');

  // Preview & UI state
  const [showKeyInPreview, setShowKeyInPreview] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState({ type: '', message: '' });

  const fileInputRef = useRef(null);
  const uploadTargetRef = useRef('main');

  // Load banks, subjects, rombels, and existing question if editing
  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const res = await fetchQuestionBanks({ tab: 'private' });
        if (!active) return;
        setBanks(res.question_banks || []);
        setSubjects(res.subjects || []);
        setRombels(res.rombels || []);
        if (!selectedBankId && res.question_banks?.[0]) {
          setSelectedBankId(String(res.question_banks[0].id));
        }
        if (res.subjects?.[0]) {
          setNewBankSubjectId(String(res.subjects[0].id));
        }
        if (res.rombels?.[0]) {
          setNewBankGrade(res.rombels[0].name);
        }

        if (questionId) {
          const qRes = await fetchQuestion(questionId);
          if (!active) return;
          const q = qRes.question;
          setType(q.type);
          setDifficulty(q.difficulty || 'sedang');
          setWeight(q.weight || 1);
          setExplanation(q.explanation || '');
          setText(q.content?.text || '');
          setMainImage(q.content?.image || null);
          setAltText(q.content?.alt_text || '');
          if (q.content?.options) {
            const loadedOpts = emptyOptions();
            OPTION_KEYS.forEach((k) => {
              const o = q.content.options[k];
              if (o) {
                loadedOpts[k] = {
                  text: o.text || '',
                  image: o.image || null,
                  url: resolveImageUrl(o.image),
                };
              }
            });
            setOptions(loadedOpts);
          }
          if (q.type === 'pg') setPgAnswer(q.content?.answer || '');
          if (q.type === 'pgk') setPgkAnswers(q.content?.answers || []);
          if (q.type === 'bs') setBsAnswer(q.content?.answer || 'true');
          if (q.type === 'jd' && q.content?.pairs?.length) setPairs(q.content.pairs);
          if (q.type === 'ur' && q.content?.items?.length) setUrItems(q.content.items);
          setDirty(false);
        }
      } catch (err) {
        if (active) {
          setBanner({ type: 'error', message: err.message || 'Gagal memuat data editor.' });
        }
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [questionId, selectedBankId]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({ type, difficulty, weight, explanation, text, pgAnswer, pgkAnswers, bsAnswer })
        );
        const now = new Date();
        setLastSavedAt(
          now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      } catch {
        // Ignore storage quota errors
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [dirty, draftKey, type, difficulty, weight, explanation, text, pgAnswer, pgkAnswers, bsAnswer]);

  const markDirty = () => setDirty(true);

  const triggerUpload = (target) => {
    uploadTargetRef.current = target;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const res = await uploadQuestionMedia(file, altText);
      markDirty();
      if (uploadTargetRef.current === 'main') {
        setMainImage(res.path);
      } else {
        const key = uploadTargetRef.current;
        setOptions((prev) => ({
          ...prev,
          [key]: { ...prev[key], image: res.path, url: res.url },
        }));
      }
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Gagal mengunggah gambar.' });
    }
  };

  const buildContentPayload = () => {
    const base = { text, image: mainImage, alt_text: altText || null };
    if (type === 'pg') {
      const formattedOptions = {};
      OPTION_KEYS.forEach((k) => {
        formattedOptions[k] = { text: options[k].text, image: options[k].image };
      });
      return { ...base, options: formattedOptions, answer: pgAnswer };
    }
    if (type === 'pgk') {
      const formattedOptions = {};
      OPTION_KEYS.forEach((k) => {
        formattedOptions[k] = { text: options[k].text, image: options[k].image };
      });
      return { ...base, options: formattedOptions, answers: pgkAnswers };
    }
    if (type === 'bs') {
      return { ...base, answer: bsAnswer };
    }
    if (type === 'jd') {
      return { ...base, pairs };
    }
    return { ...base, items: urItems };
  };

  const validateClient = () => {
    if (!text.trim()) return 'Teks soal wajib diisi.';
    const numWeight = Number(weight);
    if (!Number.isInteger(numWeight) || numWeight < 1 || numWeight > 100) {
      return 'Bobot nilai harus berupa bilangan bulat antara 1 sampai 100.';
    }
    if (type === 'pg' && !pgAnswer) return 'Pilih satu kunci jawaban benar (A-E).';
    if (type === 'pgk' && pgkAnswers.length === 0) return 'Pilih minimal satu kunci jawaban benar.';
    if (type === 'jd' && pairs.filter((p) => p.left.trim() && p.right.trim()).length < 2) {
      return 'Minimal harus ada 2 pasangan kiri-kanan yang terisi.';
    }
    if (type === 'ur' && urItems.filter((i) => i.trim()).length < 2) {
      return 'Minimal harus ada 2 item urutan yang terisi.';
    }
    if (!isEdit && targetMode === 'inline' && !newBankName.trim()) {
      return 'Nama paket baru wajib diisi.';
    }
    return null;
  };

  const handleSave = async (addAnother = false) => {
    const errMsg = validateClient();
    if (errMsg) {
      setBanner({ type: 'error', message: errMsg });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        type,
        difficulty,
        weight: Number(weight) || 1,
        explanation: explanation || null,
        content: buildContentPayload(),
      };

      if (!isEdit) {
        if (targetMode === 'inline') {
          payload.new_bank = {
            name: newBankName.trim(),
            subject_id: Number(newBankSubjectId),
            grade: newBankGrade,
            visibility: 'private',
          };
        } else {
          payload.bank_id = Number(selectedBankId);
        }
      }

      if (isEdit) {
        await updateQuestion(questionId, payload);
        setBanner({ type: 'success', message: 'Soal berhasil diperbarui.' });
        setDirty(false);
        localStorage.removeItem(draftKey);
      } else {
        const res = await createQuestion(payload);
        setDirty(false);
        localStorage.removeItem(draftKey);
        if (addAnother) {
          setText('');
          setMainImage(null);
          setAltText('');
          setOptions(emptyOptions());
          setPgAnswer('');
          setPgkAnswers([]);
          setExplanation('');
          setBanner({ type: 'success', message: 'Soal disimpan. Silakan buat soal berikutnya.' });
        } else {
          onNavigate?.(`/guru/bank-soal/${res.bank_id || selectedBankId}`);
        }
      }
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Gagal menyimpan soal.' });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (dirty && !window.confirm('Ada perubahan yang belum disimpan. Yakin ingin meninggalkan halaman ini?')) {
      return;
    }
    onNavigate?.(`/guru/bank-soal/${bankId || selectedBankId}`);
  };

  return (
    <AdminLayout
      user={user}
      currentPath="/guru/bank-soal"
      onNavigate={(path) => {
        if (dirty && !window.confirm('Ada perubahan yang belum disimpan. Yakin ingin pindah halaman?')) {
          return;
        }
        onNavigate?.(path);
      }}
      onLogout={onLogout}
      menus={GURU_MENUS}
      headerTitle={isEdit ? 'Edit Soal' : 'Buat Soal Baru'}
      settingsPath="/guru/profil"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="flex flex-col gap-lg w-full">
        {banner.message && (
          <AlertBanner
            variant={banner.type}
            message={banner.message}
            onClose={() => setBanner({ type: '', message: '' })}
          />
        )}

        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-md">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-xs text-sm font-semibold text-primary hover:underline cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Paket Soal</span>
          </button>

          <div className="flex items-center gap-md text-xs text-text-secondary">
            {lastSavedAt && <span>Draf tersimpan otomatis pukul {lastSavedAt}</span>}
          </div>
        </div>

        {/* Two-Column Editor & Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
          {/* LEFT: Form Editor */}
          <div className="lg:col-span-7 flex flex-col gap-lg">
            {/* 1. Pilih Jenis Soal */}
            <section className="bg-surface border border-border rounded-lg p-lg flex flex-col gap-md">
              <h2 className="text-md font-bold text-text">1. Jenis Soal</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm">
                {QUESTION_TYPES.map((qt) => {
                  const Icon = qt.icon;
                  const active = type === qt.id;
                  return (
                    <button
                      key={qt.id}
                      type="button"
                      onClick={() => {
                        setType(qt.id);
                        markDirty();
                      }}
                      className={`p-md rounded-md border text-left flex flex-col gap-xs cursor-pointer transition-colors ${
                        active
                          ? 'border-primary bg-soft-blue text-primary'
                          : 'border-border bg-surface hover:bg-background text-text'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-sm font-bold">{qt.label}</span>
                      <span className="text-xs text-text-secondary leading-tight">{qt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 2. Teks Soal & Media Utama */}
            <section className="bg-surface border border-border rounded-lg p-lg flex flex-col gap-md">
              <div className="flex items-center justify-between">
                <h2 className="text-md font-bold text-text">2. Pertanyaan</h2>
                <button
                  type="button"
                  onClick={() => triggerUpload('main')}
                  className="min-h-[36px] px-md rounded-sm border border-border bg-background hover:bg-soft-blue text-primary text-xs font-semibold inline-flex items-center gap-xs cursor-pointer"
                >
                  <ImagePlus size={16} />
                  <span>Upload Gambar Soal</span>
                </button>
              </div>

              <textarea
                rows={4}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  markDirty();
                }}
                placeholder="Tulis pertanyaan di sini... (Enter untuk baris baru)"
                className="w-full p-md rounded-md border border-border bg-surface text-md text-text whitespace-pre-wrap"
              />

              {mainImage && (
                <div className="flex flex-col gap-sm p-md rounded-md bg-background border border-border">
                  <div className="flex items-center justify-between gap-sm">
                    <img
                      src={resolveImageUrl(mainImage)}
                      alt={altText || 'Gambar soal'}
                      className="h-[88px] w-auto rounded-sm object-contain border border-border bg-white"
                    />
                    <div className="flex items-center gap-xs">
                      <button
                        type="button"
                        onClick={() => triggerUpload('main')}
                        className="min-h-[36px] px-md rounded-sm border border-border bg-surface text-xs font-semibold cursor-pointer"
                      >
                        Ganti
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMainImage(null);
                          markDirty();
                        }}
                        className="min-h-[36px] px-md rounded-sm bg-coral/15 text-coral text-xs font-semibold inline-flex items-center gap-xs cursor-pointer"
                      >
                        <Trash2 size={14} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={altText}
                    onChange={(e) => {
                      setAltText(e.target.value);
                      markDirty();
                    }}
                    placeholder="Teks alternatif gambar (opsional, untuk aksesibilitas)"
                    className="min-h-[40px] px-md rounded-sm border border-border bg-surface text-sm text-text"
                  />
                </div>
              )}
            </section>

            {/* 3. Opsi Jawaban & Kunci */}
            <section className="bg-surface border border-border rounded-lg p-lg flex flex-col gap-md">
              <h2 className="text-md font-bold text-text">3. Jawaban & Kunci</h2>

              {(type === 'pg' || type === 'pgk') && (
                <PgOptionsEditor
                  type={type}
                  options={options}
                  setOptions={setOptions}
                  pgAnswer={pgAnswer}
                  setPgAnswer={setPgAnswer}
                  pgkAnswers={pgkAnswers}
                  setPgkAnswers={setPgkAnswers}
                  triggerUpload={triggerUpload}
                  markDirty={markDirty}
                />
              )}

              {type === 'bs' && (
                <BsAnswerEditor
                  bsAnswer={bsAnswer}
                  setBsAnswer={setBsAnswer}
                  markDirty={markDirty}
                />
              )}

              {type === 'jd' && (
                <JdPairsEditor
                  pairs={pairs}
                  setPairs={setPairs}
                  markDirty={markDirty}
                />
              )}

              {type === 'ur' && (
                <UrItemsEditor
                  urItems={urItems}
                  setUrItems={setUrItems}
                  markDirty={markDirty}
                />
              )}
            </section>

            {/* 4. Pengaturan Soal & Paket Tujuan */}
            <section className="bg-surface border border-border rounded-lg p-lg flex flex-col gap-md">
              <h2 className="text-md font-bold text-text">4. Pengaturan & Paket Tujuan</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <span className="text-sm font-semibold text-text">Tingkat Kesulitan</span>
                  <div className="flex gap-xs">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setDifficulty(d.id);
                          markDirty();
                        }}
                        className={`flex-1 min-h-[40px] rounded-pill border text-xs font-semibold cursor-pointer ${
                          difficulty === d.id
                            ? 'border-primary bg-soft-blue text-primary'
                            : 'border-border bg-background text-text-secondary'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="text-sm font-semibold text-text">Bobot Nilai</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={weight}
                    onChange={(e) => {
                      setWeight(e.target.value);
                      markDirty();
                    }}
                    className="min-h-[40px] px-md rounded-sm border border-border bg-surface text-md text-text"
                  />
                </div>
              </div>

              {!isEdit && (
                <div className="flex flex-col gap-sm pt-xs border-t border-border">
                  <div className="flex gap-md text-sm font-semibold">
                    <label className="inline-flex items-center gap-xs cursor-pointer">
                      <input
                        type="radio"
                        checked={targetMode === 'existing'}
                        onChange={() => setTargetMode('existing')}
                      />
                      <span>Simpan ke Paket Ada</span>
                    </label>
                    <label className="inline-flex items-center gap-xs cursor-pointer">
                      <input
                        type="radio"
                        checked={targetMode === 'inline'}
                        onChange={() => setTargetMode('inline')}
                      />
                      <span>Buat Paket Baru</span>
                    </label>
                  </div>

                  {targetMode === 'existing' ? (
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className="min-h-[44px] px-md rounded-sm border border-border bg-surface text-md text-text"
                    >
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.subject?.name} - {b.grade})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm">
                      <input
                        type="text"
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        placeholder="Nama Paket Baru"
                        className="min-h-[44px] px-md rounded-sm border border-border bg-surface text-sm text-text"
                      />
                      <select
                        value={newBankSubjectId}
                        onChange={(e) => setNewBankSubjectId(e.target.value)}
                        className="min-h-[44px] px-md rounded-sm border border-border bg-surface text-sm text-text"
                      >
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={newBankGrade}
                        onChange={(e) => setNewBankGrade(e.target.value)}
                        className="min-h-[44px] px-md rounded-sm border border-border bg-surface text-sm text-text"
                      >
                        {rombels.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-xs">
                <label className="text-sm font-semibold text-text">Pembahasan (Opsional)</label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => {
                    setExplanation(e.target.value);
                    markDirty();
                  }}
                  placeholder="Tulis pembahasan atau catatan kunci..."
                  className="w-full p-sm rounded-sm border border-border bg-surface text-sm text-text whitespace-pre-wrap"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-sm pt-sm">
                {!isEdit && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave(true)}
                    className="min-h-[48px] px-lg rounded-md border border-primary bg-surface hover:bg-soft-blue text-primary text-md font-semibold inline-flex items-center gap-xs cursor-pointer"
                  >
                    <Plus size={18} />
                    <span>Simpan & Tambah Lagi</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(false)}
                  className="min-h-[48px] px-xl rounded-md bg-primary hover:bg-navy text-white text-md font-semibold inline-flex items-center gap-xs cursor-pointer"
                >
                  <Save size={18} />
                  <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
              </div>
            </section>
          </div>

          {/* RIGHT: Live Student Preview */}
          <QuestionPreviewPanel
            type={type}
            weight={weight}
            mainImage={mainImage}
            altText={altText}
            text={text}
            options={options}
            pgAnswer={pgAnswer}
            pgkAnswers={pgkAnswers}
            bsAnswer={bsAnswer}
            pairs={pairs}
            urItems={urItems}
            showKeyInPreview={showKeyInPreview}
            setShowKeyInPreview={setShowKeyInPreview}
          />
        </div>
      </div>
    </AdminLayout>
  );
}

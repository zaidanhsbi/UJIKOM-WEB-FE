import { Eye, EyeOff } from 'lucide-react';
import { OPTION_KEYS, resolveImageUrl } from './questionConstants';

/**
 * Panel pratinjau tampilan soal dari sudut pandang siswa.
 */
export default function QuestionPreviewPanel({
  type,
  weight,
  mainImage,
  altText,
  text,
  options,
  pgAnswer,
  pgkAnswers,
  bsAnswer,
  pairs,
  urItems,
  showKeyInPreview,
  setShowKeyInPreview,
}) {
  return (
    <div className="lg:col-span-5 lg:sticky lg:top-lg">
      <div className="bg-surface border border-border rounded-lg p-lg flex flex-col gap-md">
        <div className="flex flex-wrap items-center justify-between gap-sm pb-sm border-b border-border">
          <span className="text-md font-bold text-text">Pratinjau Siswa</span>
          <button
            type="button"
            onClick={() => setShowKeyInPreview((v) => !v)}
            className="min-h-[32px] px-sm rounded-sm border border-border text-xs font-semibold inline-flex items-center gap-xs cursor-pointer"
          >
            {showKeyInPreview ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>Kunci</span>
          </button>
        </div>

        <div className="mx-auto w-full rounded-md border border-border bg-background p-lg flex flex-col gap-md">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span className="font-semibold uppercase">{type}</span>
            <span>Bobot: {weight}</span>
          </div>

          {mainImage && (
            <img
              src={resolveImageUrl(mainImage)}
              alt={altText || 'Gambar soal'}
              className="max-h-[180px] w-auto rounded-sm object-contain bg-white border border-border"
            />
          )}

          <p className="text-question text-text whitespace-pre-wrap leading-relaxed">
            {text || 'Teks pertanyaan akan tampil di sini...'}
          </p>

          {(type === 'pg' || type === 'pgk') && (
            <div className="flex flex-col gap-sm">
              {OPTION_KEYS.map((k) => {
                const isKey =
                  showKeyInPreview &&
                  (type === 'pg' ? pgAnswer === k : pgkAnswers.includes(k));
                return (
                  <div
                    key={k}
                    className={`p-md rounded-md border flex flex-col gap-xs ${
                      isKey
                        ? 'border-mint bg-mint/15'
                        : 'border-border bg-surface'
                    }`}
                  >
                    <div className="flex items-start gap-sm text-md text-text">
                      <span className="font-bold">{k}.</span>
                      <span className="whitespace-pre-wrap">
                        {options[k].text || `Pilihan ${k}`}
                      </span>
                    </div>
                    {options[k].image && (
                      <img
                        src={options[k].url || resolveImageUrl(options[k].image)}
                        alt={`Opsi ${k}`}
                        className="h-[64px] w-auto self-start rounded-sm object-contain border border-border bg-white"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {type === 'bs' && (
            <div className="grid grid-cols-2 gap-sm">
              {['true', 'false'].map((val) => (
                <div
                  key={val}
                  className={`p-md rounded-md border text-center font-semibold ${
                    showKeyInPreview && bsAnswer === val
                      ? 'border-mint bg-mint/15 text-text'
                      : 'border-border bg-surface text-text'
                  }`}
                >
                  {val === 'true' ? 'Benar' : 'Salah'}
                </div>
              ))}
            </div>
          )}

          {type === 'jd' && (
            <div className="flex flex-col gap-xs">
              {pairs.map((p, i) => (
                <div key={i} className="grid grid-cols-2 gap-sm text-sm">
                  <div className="p-sm rounded-sm bg-surface border border-border">
                    {p.left || `Kiri ${i + 1}`}
                  </div>
                  <div className="p-sm rounded-sm bg-surface border border-border">
                    {p.right || `Kanan ${i + 1}`}
                  </div>
                </div>
              ))}
            </div>
          )}

          {type === 'ur' && (
            <div className="flex flex-col gap-xs">
              {urItems.map((it, i) => (
                <div key={i} className="p-sm rounded-sm bg-surface border border-border text-sm">
                  {i + 1}. {it || `Item ${i + 1}`}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

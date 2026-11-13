import { ImagePlus, Trash2 } from 'lucide-react';
import { OPTION_KEYS, resolveImageUrl } from '../questionConstants';

/**
 * Editor opsi jawaban untuk tipe Pilihan Ganda (pg) dan PG Kompleks (pgk).
 */
export default function PgOptionsEditor({
  type,
  options,
  setOptions,
  pgAnswer,
  setPgAnswer,
  pgkAnswers,
  setPgkAnswers,
  triggerUpload,
  markDirty,
}) {
  return (
    <div className="flex flex-col gap-md">
      {OPTION_KEYS.map((key) => {
        const isChecked =
          type === 'pg' ? pgAnswer === key : pgkAnswers.includes(key);

        return (
          <div key={key} className="flex flex-col gap-xs p-md rounded-md border border-border bg-background">
            <div className="flex items-center justify-between gap-sm">
              <label className="inline-flex items-center gap-sm cursor-pointer">
                <input
                  type={type === 'pg' ? 'radio' : 'checkbox'}
                  name="correct_option"
                  checked={isChecked}
                  onChange={() => {
                    markDirty();
                    if (type === 'pg') {
                      setPgAnswer(key);
                    } else {
                      setPgkAnswers((prev) =>
                        prev.includes(key)
                          ? prev.filter((k) => k !== key)
                          : [...prev, key]
                      );
                    }
                  }}
                  className="w-[18px] h-[18px]"
                />
                <span className="text-sm font-bold text-text">
                  Opsi {key} {isChecked ? '(Kunci Benar)' : ''}
                </span>
              </label>

              <button
                type="button"
                onClick={() => triggerUpload(key)}
                className="min-h-[32px] px-sm rounded-sm border border-border bg-surface hover:bg-soft-blue text-primary text-xs font-semibold inline-flex items-center gap-xs cursor-pointer"
              >
                <ImagePlus size={14} />
                <span>Gambar</span>
              </button>
            </div>

            <textarea
              rows={2}
              value={options[key].text}
              onChange={(e) => {
                const val = e.target.value;
                setOptions((prev) => ({
                  ...prev,
                  [key]: { ...prev[key], text: val },
                }));
                markDirty();
              }}
              placeholder={`Teks pilihan ${key}...`}
              className="w-full p-sm rounded-sm border border-border bg-surface text-sm text-text whitespace-pre-wrap"
            />

            {options[key].image && (
              <div className="flex items-center justify-between gap-sm pt-xs">
                <img
                  src={options[key].url || resolveImageUrl(options[key].image)}
                  alt={`Gambar opsi ${key}`}
                  className="h-[64px] w-auto rounded-sm object-contain border border-border bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    setOptions((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], image: null, url: null },
                    }));
                    markDirty();
                  }}
                  className="min-h-[32px] px-sm rounded-sm bg-coral/15 text-coral text-xs font-semibold inline-flex items-center gap-xs cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Hapus Gambar</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

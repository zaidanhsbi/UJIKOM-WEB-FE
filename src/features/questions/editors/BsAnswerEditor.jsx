/**
 * Editor kunci jawaban untuk tipe Benar / Salah (bs).
 */
export default function BsAnswerEditor({ bsAnswer, setBsAnswer, markDirty }) {
  return (
    <div className="flex gap-md">
      {[
        { id: 'true', label: 'Benar' },
        { id: 'false', label: 'Salah' },
      ].map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => {
            setBsAnswer(opt.id);
            markDirty();
          }}
          className={`flex-1 min-h-[48px] rounded-md border text-md font-bold cursor-pointer ${
            bsAnswer === opt.id
              ? 'border-primary bg-soft-blue text-primary'
              : 'border-border bg-surface text-text'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

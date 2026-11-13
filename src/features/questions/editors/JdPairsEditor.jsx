/**
 * Editor pasangan kiri-kanan untuk tipe Menjodohkan (jd).
 */
export default function JdPairsEditor({ pairs, setPairs, markDirty }) {
  return (
    <div className="flex flex-col gap-sm">
      {pairs.map((pair, idx) => (
        <div key={idx} className="grid grid-cols-2 gap-sm">
          <input
            type="text"
            value={pair.left}
            onChange={(e) => {
              const next = [...pairs];
              next[idx] = { ...next[idx], left: e.target.value };
              setPairs(next);
              markDirty();
            }}
            placeholder={`Kiri ${idx + 1}`}
            className="min-h-[44px] px-md rounded-sm border border-border bg-surface text-sm text-text"
          />
          <input
            type="text"
            value={pair.right}
            onChange={(e) => {
              const next = [...pairs];
              next[idx] = { ...next[idx], right: e.target.value };
              setPairs(next);
              markDirty();
            }}
            placeholder={`Pasangan Kanan ${idx + 1}`}
            className="min-h-[44px] px-md rounded-sm border border-border bg-surface text-sm text-text"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setPairs([...pairs, { left: '', right: '' }])}
        className="self-start min-h-[36px] px-md rounded-sm border border-border text-xs font-semibold text-primary cursor-pointer"
      >
        + Tambah Pasangan
      </button>
    </div>
  );
}

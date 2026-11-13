/**
 * Editor daftar urutan untuk tipe Urutan (ur).
 */
export default function UrItemsEditor({ urItems, setUrItems, markDirty }) {
  return (
    <div className="flex flex-col gap-sm">
      {urItems.map((item, idx) => (
        <div key={idx} className="flex items-center gap-sm">
          <span className="text-sm font-bold text-text-secondary w-[24px]">
            {idx + 1}.
          </span>
          <input
            type="text"
            value={item}
            onChange={(e) => {
              const next = [...urItems];
              next[idx] = e.target.value;
              setUrItems(next);
              markDirty();
            }}
            placeholder={`Item urutan ke-${idx + 1}`}
            className="flex-1 min-h-[44px] px-md rounded-sm border border-border bg-surface text-sm text-text"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setUrItems([...urItems, ''])}
        className="self-start min-h-[36px] px-md rounded-sm border border-border text-xs font-semibold text-primary cursor-pointer"
      >
        + Tambah Item Urutan
      </button>
    </div>
  );
}

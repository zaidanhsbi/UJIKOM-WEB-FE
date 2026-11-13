/**
 * Komponen Modal Dialog Reusable
 * Tanpa library eksternal, mematuhi DESIGN-SYSTEM.md
 */
export default function Modal({
  isOpen,
  title,
  onClose,
  maxWidth = '460px',
  children,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-text/50 flex items-center justify-center p-lg"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-surface border border-border rounded-lg shadow-md w-full p-xl"
        style={{ maxWidth }}
      >
        <div className="flex items-center justify-between mb-lg">
          <h2 className="text-lg font-bold text-navy leading-tight">{title}</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-[32px] h-[32px] rounded-sm text-text-secondary hover:bg-background hover:text-text flex items-center justify-center cursor-pointer"
              aria-label="Tutup dialog"
            >
              &#10005;
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}


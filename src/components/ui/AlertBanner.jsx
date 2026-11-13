import { X } from 'lucide-react';

/**
 * Komponen Banner Notifikasi / Peringatan Inline Reusable (Sesuai DESIGN-SYSTEM.md)
 * Desain:
 * - Padding proporsional (px-xl py-lg = 24px horizontal, 16px vertikal)
 * - Latar pastel lembut tanpa border/stroke luar dengan warna teks senada per varian:
 *   - success : hijau muda (--color-alert-success-bg) & teks hijau tua (--color-alert-success-text)
 *   - warning : kuning muda (--color-alert-warning-bg) & teks kuning/cokelat tua (--color-alert-warning-text)
 *   - error/danger : merah muda (--color-alert-danger-bg) & teks merah tua (--color-alert-danger-text)
 *   - primary : biru muda (--color-alert-primary-bg) & teks biru tua (--color-alert-primary-text)
 *   - info    : sian muda (--color-alert-info-bg) & teks sian tua (--color-alert-info-text)
 * - Tombol tutup berupa ikon 'X' saja
 */
export default function AlertBanner({
  variant = 'primary',
  title,
  message,
  details = [],
  onClose,
  className = '',
}) {
  if (!message && (!Array.isArray(details) || details.length === 0)) {
    return null;
  }

  const variantClasses = {
    primary: 'bg-alert-primary-bg text-alert-primary-text',
    secondary: 'bg-alert-secondary-bg text-alert-secondary-text',
    success: 'bg-alert-success-bg text-alert-success-text',
    danger: 'bg-alert-danger-bg text-alert-danger-text',
    error: 'bg-alert-danger-bg text-alert-danger-text',
    warning: 'bg-alert-warning-bg text-alert-warning-text',
    info: 'bg-alert-info-bg text-alert-info-text',
  };

  const resolvedClass = variantClasses[variant] || variantClasses.primary;

  return (
    <div
      role={
        variant === 'error' || variant === 'danger' || variant === 'warning'
          ? 'alert'
          : 'status'
      }
      className={`px-xl py-lg rounded-md text-sm flex flex-col gap-xs ${resolvedClass} ${className}`}
    >
      <div className="flex items-center justify-between gap-md">
        <div className="font-medium leading-normal">
          {title && <strong className="font-bold mr-xs">{title} &mdash;</strong>}
          <span>{message}</span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup notifikasi"
            className="w-[28px] h-[28px] rounded-xs text-current opacity-75 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer shrink-0"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        )}
      </div>

      {Array.isArray(details) && details.length > 0 && (
        <ul className="pl-lg list-disc text-xs text-current opacity-90 space-y-xxs max-h-[160px] overflow-y-auto">
          {details.map((item, idx) => (
            <li key={idx} className="leading-normal">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

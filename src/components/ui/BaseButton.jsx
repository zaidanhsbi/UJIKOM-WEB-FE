/** Komponen tombol dasar yang dapat dikustomisasi varian dan ukurannya. */
export default function BaseButton({
  children,
  type = 'button',
  variant = 'primary',
  loading = false,
  loadingText = 'Menyimpan...',
  disabled = false,
  onClick,
  className = '',
}) {
  const variants = {
    primary: 'bg-navy hover:bg-primary text-white',
    secondary: 'bg-white hover:bg-background text-navy border border-border',
    danger: 'bg-coral hover:opacity-90 text-navy',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`h-[44px] px-xl rounded-md font-semibold text-sm transition-colors inline-flex items-center justify-center gap-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
        variants[variant] || variants.primary
      } ${className}`}
    >
      {loading ? loadingText : children}
    </button>
  );
}

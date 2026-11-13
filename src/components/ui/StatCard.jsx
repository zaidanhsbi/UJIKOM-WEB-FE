/**
 * Komponen Kartu Statistik Reusable (Mengacu pada Frame Beranda Figma)
 * Bisa dipakai di Beranda Admin, Beranda Guru, Pantau Ujian, dan Tab Nilai.
 */
export default function StatCard({ title, value, subtitle, icon }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-lg flex flex-col justify-between min-h-[132px]">
      <div className="flex items-center justify-between text-text-secondary">
        <span className="text-xs font-medium">{title}</span>
        {icon && <span className="shrink-0">{icon}</span>}
      </div>
      <div className="my-xs text-xxl font-bold text-text leading-tight">
        {value}
      </div>
      <div className="text-xs text-text-secondary">{subtitle}</div>
    </div>
  );
}


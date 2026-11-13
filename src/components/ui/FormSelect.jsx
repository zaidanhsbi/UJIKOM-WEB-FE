/** Komponen dropdown select formulir dengan dukungan label dan opsi pilihan. */
export default function FormSelect({
  id,
  label,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
}) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-text mb-xs"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full h-[46px] px-md bg-white border border-border rounded-md text-md text-text focus:outline-none focus:border-primary disabled:bg-background transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

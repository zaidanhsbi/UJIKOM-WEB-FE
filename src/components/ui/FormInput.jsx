/** Komponen input teks formulir dengan dukungan label dan pesan error. */
export default function FormInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  rightElement = null,
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
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full h-[46px] px-md bg-white border border-border rounded-md text-md text-text placeholder:text-text-disabled focus:outline-none focus:border-primary disabled:bg-background transition-colors ${
            rightElement ? 'pr-12' : ''
          }`}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-sm">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}

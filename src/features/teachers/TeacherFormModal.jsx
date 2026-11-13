import Modal from '../../components/ui/Modal';
import AlertBanner from '../../components/ui/AlertBanner';

const INPUT_CLASS =
  'w-full min-h-[48px] px-lg py-sm bg-white border border-border rounded-md text-sm text-text placeholder:text-text-disabled focus:outline-none focus:border-primary';

function FieldError({ errors, name }) {
  if (!errors[name]) return null;
  return <p className="mt-xxs text-xs font-medium text-error">{errors[name][0]}</p>;
}

/**
 * Daftar pilihan berbentuk chip yang bisa dipilih lebih dari satu.
 */
function MultiChipSelect({ id, label, options, selectedIds, onToggle, disabled, emptyText }) {
  return (
    <div>
      <span id={id} className="block text-sm font-semibold text-navy mb-xs">
        {label}
      </span>
      {options.length === 0 ? (
        <p className="text-xs text-text-secondary">{emptyText}</p>
      ) : (
        <div
          role="group"
          aria-labelledby={id}
          className="flex flex-wrap gap-xs max-h-[136px] overflow-y-auto p-xs border border-border rounded-md bg-background"
        >
          {options.map((opt) => {
            const active = selectedIds.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onToggle(opt.id)}
                disabled={disabled}
                aria-pressed={active}
                className={`min-h-[36px] px-md rounded-pill text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border text-navy hover:bg-soft-blue'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Modal formulir untuk menambah atau mengubah data guru. */
export default function TeacherFormModal({
  isOpen,
  mode,
  form,
  onFieldChange,
  onToggleItem,
  subjectOptions,
  rombelOptions,
  errors,
  errorGeneral,
  onClearErrorGeneral,
  submitting,
  onSubmit,
  onClose,
}) {
  return (
    <Modal
      isOpen={isOpen}
      title={mode === 'add' ? 'Tambah Guru Baru' : 'Edit Data Guru'}
      onClose={onClose}
      maxWidth="560px"
    >
      <div className="flex flex-col gap-md max-h-[75vh] overflow-y-auto">
        {errorGeneral && (
          <AlertBanner variant="error" message={errorGeneral} onClose={onClearErrorGeneral} />
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-md" noValidate>
          <div>
            <label htmlFor="teacher-username" className="block text-sm font-semibold text-navy mb-xs">
              Username / NUPTK
            </label>
            <input
              id="teacher-username"
              type="text"
              placeholder="Contoh: Pak_Budi, NUPTK 16 digit, GR-001"
              value={form.username}
              onChange={(e) => onFieldChange('username', e.target.value)}
              disabled={submitting}
              className={INPUT_CLASS}
            />
            <FieldError errors={errors} name="username" />
          </div>

          <div>
            <label htmlFor="teacher-name" className="block text-sm font-semibold text-navy mb-xs">
              Nama Guru
            </label>
            <input
              id="teacher-name"
              type="text"
              placeholder="Contoh: Budi Santoso, S.Pd."
              value={form.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              disabled={submitting}
              className={INPUT_CLASS}
            />
            <FieldError errors={errors} name="name" />
          </div>

          <div>
            <label htmlFor="teacher-password" className="block text-sm font-semibold text-navy mb-xs">
              Password Login Guru
            </label>
            <input
              id="teacher-password"
              type="text"
              placeholder="Contoh: guru123"
              value={form.password}
              onChange={(e) => onFieldChange('password', e.target.value)}
              disabled={submitting}
              className={INPUT_CLASS}
            />
            <FieldError errors={errors} name="password" />
          </div>

          <MultiChipSelect
            id="teacher-subjects"
            label="Mata Pelajaran yang Diajar"
            options={subjectOptions}
            selectedIds={form.subjectIds}
            onToggle={(id) => onToggleItem('subjectIds', id)}
            disabled={submitting}
            emptyText="Belum ada mata pelajaran. Tambahkan dulu di menu Mata Pelajaran."
          />

          <MultiChipSelect
            id="teacher-rombels"
            label="Kelas / Rombel yang Diajar"
            options={rombelOptions}
            selectedIds={form.rombelIds}
            onToggle={(id) => onToggleItem('rombelIds', id)}
            disabled={submitting}
            emptyText="Belum ada kelas. Tambahkan dulu di menu Kelas / Rombel."
          />

          <div className="mt-md flex items-center justify-end gap-sm">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="min-h-[48px] px-lg rounded-md border border-border bg-surface hover:bg-background text-text-secondary text-sm font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[48px] px-xl rounded-md bg-primary hover:bg-blue disabled:bg-text-disabled text-white text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? 'Menyimpan...' : mode === 'add' ? 'Simpan Guru' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

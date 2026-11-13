import Modal from '../../components/ui/Modal';
import AlertBanner from '../../components/ui/AlertBanner';

/** Modal formulir untuk menambah atau mengubah data mata pelajaran. */
export default function SubjectFormModal({
  isOpen,
  modalMode,
  formCode,
  onChangeCode,
  formName,
  onChangeName,
  formErrors,
  formErrorGeneral,
  onClearErrorGeneral,
  submitting,
  onClose,
  onSubmit,
}) {
  return (
    <Modal
      isOpen={isOpen}
      title={
        modalMode === 'add' ? 'Tambah Mata Pelajaran' : 'Edit Mata Pelajaran'
      }
      onClose={onClose}
    >
      <div className="flex flex-col gap-md">
        {formErrorGeneral && (
          <AlertBanner
            variant="error"
            message={formErrorGeneral}
            onClose={onClearErrorGeneral}
          />
        )}

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-md"
          noValidate
        >
          <div>
            <label
              htmlFor="subject-code"
              className="block text-sm font-semibold text-navy mb-xs"
            >
              Kode Mapel
            </label>
            <input
              id="subject-code"
              type="text"
              placeholder="Contoh: MP-MAT"
              value={formCode}
              onChange={(e) => onChangeCode(e.target.value.toUpperCase())}
              disabled={submitting}
              required
              className="w-full min-h-[48px] px-lg py-sm bg-white border border-border rounded-md text-sm text-text placeholder:text-text-disabled focus:outline-none focus:border-primary"
            />
            {formErrors.code && (
              <p className="mt-xxs text-xs font-medium text-error">
                {formErrors.code[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="subject-name"
              className="block text-sm font-semibold text-navy mb-xs"
            >
              Nama Mapel
            </label>
            <input
              id="subject-name"
              type="text"
              placeholder="Contoh: Matematika"
              value={formName}
              onChange={(e) => onChangeName(e.target.value)}
              disabled={submitting}
              required
              className="w-full min-h-[48px] px-lg py-sm bg-white border border-border rounded-md text-sm text-text placeholder:text-text-disabled focus:outline-none focus:border-primary"
            />
            {formErrors.name && (
              <p className="mt-xxs text-xs font-medium text-error">
                {formErrors.name[0]}
              </p>
            )}
          </div>

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
              {submitting
                ? 'Menyimpan...'
                : modalMode === 'add'
                ? 'Simpan Mapel'
                : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

import { Download, Upload } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import AlertBanner from '../../components/ui/AlertBanner';

/** Modal untuk mengimpor data mata pelajaran secara massal dari file Excel atau Word. */
export default function SubjectImportModal({
  isOpen,
  title = 'Import Mata Pelajaran (Excel .xlsx)',
  step1Description = (
    <>
      Gunakan format tabel standar agar sistem mengenali kolom{' '}
      <code>Kode Mapel</code> dan <code>Nama Mapel</code>.
    </>
  ),
  step2Title = 'Langkah 2: Isi Data Mata Pelajaran',
  step2Description = (
    <>
      Pastikan setiap <strong>Kode Mapel</strong> unik dan belum terdaftar di
      sekolah Anda.
    </>
  ),
  codeColumnLabel = 'Kode',
  nameColumnLabel = 'Nama Mapel',
  importingFile,
  restrictedMode,
  selectedImportFileName,
  importModalBanner,
  onClearModalBanner,
  importRowResults,
  importSummary,
  onClose,
  onDownloadExcelTemplate,
  onDownloadWordTemplate,
  onTriggerFileBrowser,
}) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      maxWidth="640px"
    >
      <div className="flex flex-col gap-md">
        {/* Petunjuk 3 Langkah Impor */}
        <div className="p-lg rounded-md bg-background border border-border flex flex-col gap-sm text-xs text-text-secondary">
          <div className="flex items-start gap-sm">
            <span className="w-[24px] h-[24px] rounded-pill bg-soft-blue text-navy font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <div className="flex-1">
              <strong className="text-navy font-semibold block">
                Langkah 1: Unduh Template Resmi
              </strong>
              <span>{step1Description}</span>
              <div className="flex flex-wrap items-center gap-sm mt-xs">
                <button
                  type="button"
                  onClick={onDownloadExcelTemplate}
                  className="min-h-[36px] px-md py-xs rounded-sm border border-border bg-surface hover:bg-soft-blue text-navy text-xs font-semibold inline-flex items-center gap-xs transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download Template Excel (.xlsx)</span>
                </button>
                {typeof onDownloadWordTemplate === 'function' && (
                  <button
                    type="button"
                    onClick={onDownloadWordTemplate}
                    className="min-h-[36px] px-md py-xs rounded-sm border border-border bg-surface hover:bg-soft-blue text-navy text-xs font-semibold inline-flex items-center gap-xs transition-colors cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download Template Word (.docx)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-sm">
            <span className="w-[24px] h-[24px] rounded-pill bg-soft-blue text-navy font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <strong className="text-navy font-semibold block">
                {step2Title}
              </strong>
              <span>{step2Description}</span>
            </div>
          </div>

          <div className="flex items-start gap-sm">
            <span className="w-[24px] h-[24px] rounded-pill bg-soft-blue text-navy font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <div className="flex-1">
              <strong className="text-navy font-semibold block">
                Langkah 3: Unggah File Excel (.xlsx)
              </strong>
              <span>
                Pilih file yang sudah diisi untuk divalidasi dan disimpan otomatis.
              </span>
              <div className="mt-xs flex flex-wrap items-center gap-sm">
                <button
                  type="button"
                  onClick={onTriggerFileBrowser}
                  disabled={importingFile || restrictedMode}
                  className="min-h-[36px] px-lg py-xs rounded-sm bg-primary hover:bg-blue disabled:bg-text-disabled text-white text-xs font-semibold inline-flex items-center gap-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Upload size={14} />
                  <span>
                    {importingFile
                      ? 'Memproses File...'
                      : 'Pilih & Unggah File'}
                  </span>
                </button>
                {selectedImportFileName && (
                  <span className="text-xs font-medium text-navy truncate">
                    File: {selectedImportFileName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Banner Status / Validasi Inline di dalam Modal Impor */}
        {importModalBanner && (
          <AlertBanner
            variant={importModalBanner.variant}
            title={importModalBanner.title}
            message={importModalBanner.message}
            details={importModalBanner.details}
            onClose={onClearModalBanner}
          />
        )}

        {/* Ringkasan & Tabel Hasil Impor Per Baris (Berhasil, Dilewati, Error) */}
        {importRowResults.length > 0 && (
          <div className="flex flex-col gap-sm">
            {importSummary && (
              <div className="flex flex-wrap items-center gap-sm text-xs font-semibold">
                <span className="px-md py-xs rounded-pill bg-alert-success-bg text-alert-success-text">
                  Berhasil: {importSummary.imported}
                </span>
                <span className="px-md py-xs rounded-pill bg-alert-warning-bg text-alert-warning-text">
                  Dilewati: {importSummary.skipped}
                </span>
                <span className="px-md py-xs rounded-pill bg-alert-danger-bg text-alert-danger-text">
                  Error: {importSummary.errors}
                </span>
              </div>
            )}

            <div className="border border-border rounded-md overflow-hidden max-h-[220px] overflow-y-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-background border-b border-border text-text-secondary font-semibold uppercase">
                    <th className="py-sm px-md w-[60px]">Baris</th>
                    {codeColumnLabel && (
                      <th className="py-sm px-md w-[130px]">
                        {codeColumnLabel}
                      </th>
                    )}
                    <th className="py-sm px-md">{nameColumnLabel}</th>
                    <th className="py-sm px-md w-[90px]">Status</th>
                    <th className="py-sm px-md">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {importRowResults.map((item, idx) => {
                    const badgeClass =
                      item.status === 'berhasil'
                        ? 'bg-alert-success-bg text-alert-success-text'
                        : item.status === 'dilewati'
                        ? 'bg-alert-warning-bg text-alert-warning-text'
                        : 'bg-alert-danger-bg text-alert-danger-text';
                    const statusLabel =
                      item.status === 'berhasil'
                        ? 'Berhasil'
                        : item.status === 'dilewati'
                        ? 'Dilewati'
                        : 'Error';
                    return (
                      <tr key={idx}>
                        <td className="py-sm px-md text-text-secondary font-medium">
                          {item.row}
                        </td>
                        {codeColumnLabel && (
                          <td className="py-sm px-md font-semibold text-navy">
                            {item.code}
                          </td>
                        )}
                        <td className="py-sm px-md text-text">{item.name}</td>
                        <td className="py-sm px-md">
                          <span
                            className={`inline-block px-sm py-xxs rounded-pill font-bold ${badgeClass}`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-sm px-md text-text-secondary">
                          {item.reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={importingFile}
            className="min-h-[36px] px-lg py-xs rounded-sm border border-border bg-surface hover:bg-background text-text-secondary text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}

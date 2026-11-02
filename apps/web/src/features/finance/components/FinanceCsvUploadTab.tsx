import React from 'react';
import { Download, Upload, Check } from 'lucide-react';
import type { FinancialTransaction } from '../../../state/FinanceStoreContext';
import { formatRupiah } from '../../../utils/currency';

interface FinanceCsvUploadTabProps {
  csvPreviewData: Array<Omit<FinancialTransaction, 'id' | 'code'>>;
  csvFileName: string;
  isImporting: boolean;
  handleDownloadSampleTemplate: () => void;
  handleCsvFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCommitCsvImport: () => void;
}

export const FinanceCsvUploadTab: React.FC<FinanceCsvUploadTabProps> = ({
  csvPreviewData,
  csvFileName,
  isImporting,
  handleDownloadSampleTemplate,
  handleCsvFileUpload,
  handleCommitCsvImport,
}) => {
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
            Unggah Jurnal Kas Secara Massal (CSV Import)
          </h3>
          <p style={{ color: 'var(--gmh-text-muted)', fontSize: 13 }}>
            Impor banyak mutasi kas sekaligus menggunakan spreadsheet CSV. Sangat cocok untuk migrasi pembukuan kas bank &amp; belanja kantor.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleDownloadSampleTemplate}>
          <Download size={14} /> Unduh Format Template CSV
        </button>
      </div>

      {/* Upload Drop Zone */}
      <div
        style={{
          border: '2px dashed var(--gmh-border-dark)',
          borderRadius: 'var(--radius-md)',
          padding: '32px 20px',
          textAlign: 'center',
          background: '#f9fafb',
          marginBottom: 20,
        }}
      >
        <Upload size={36} color="var(--gmh-green)" style={{ margin: '0 auto 10px' }} />
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
          Pilih file CSV jurnal mutasi kas yayasan
        </div>
        <div style={{ color: 'var(--gmh-text-muted)', fontSize: 12, marginBottom: 14 }}>
          Kolom wajib: tanggal, kategori, deskripsi, pihak_relasi, aliran_kas (Pemasukan/Pengeluaran), nominal
        </div>
        <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', display: 'inline-block' }}>
          <input type="file" accept=".csv" onChange={handleCsvFileUpload} style={{ display: 'none' }} />
          Pilih Berkas CSV
        </label>
        {csvFileName && (
          <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: 'var(--gmh-green-dark)' }}>
            Berkas Terpilih: {csvFileName}
          </div>
        )}
      </div>

      {/* Preview Parsed Data */}
      {csvPreviewData.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700 }}>
              Pratinjau Data Impor ({csvPreviewData.length} Baris Mutasi Siap Disimpan)
            </h4>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleCommitCsvImport}
              disabled={isImporting}
              style={{ fontWeight: 600 }}
            >
              <Check size={14} /> {isImporting ? 'Menyimpan ke Jurnal…' : 'Simpan Semua ke Buku Jurnal Kas'}
            </button>
          </div>

          <div className="table-wrapper" style={{ maxHeight: 320, overflowY: 'auto' }}>
            <table className="table table-compact" style={{ fontSize: 11.5 }}>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kategori</th>
                  <th>Deskripsi</th>
                  <th>Pihak Relasi</th>
                  <th>Aliran Kas</th>
                  <th style={{ textAlign: 'right' }}>Nominal</th>
                  <th>Rekening</th>
                </tr>
              </thead>
              <tbody>
                {csvPreviewData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.date}</td>
                    <td>{row.category}</td>
                    <td>{row.desc}</td>
                    <td>{row.party}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: row.type === 'CREDIT' ? '#ecfdf5' : '#fef2f2',
                          color: row.type === 'CREDIT' ? '#065f46' : '#991b1b',
                        }}
                      >
                        {row.type === 'CREDIT' ? 'Pemasukan (+)' : 'Pengeluaran (-)'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(row.amount)}</td>
                    <td>{row.account}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

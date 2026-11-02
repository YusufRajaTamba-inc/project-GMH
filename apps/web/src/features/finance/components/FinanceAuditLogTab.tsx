import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import type { AuditLogEntry } from '../types';
import { Pagination } from '../../../components/common/Pagination';

interface FinanceAuditLogTabProps {
  auditLogs: AuditLogEntry[];
  isLoadingLogs: boolean;
  fetchAuditLogs: () => void;
  paginatedAuditLogs: AuditLogEntry[];
  logCurrentPage: number;
  totalLogPages: number;
  logPageSize: number;
  setLogCurrentPage: (page: number) => void;
  setLogPageSize: (size: number) => void;
}

export const FinanceAuditLogTab: React.FC<FinanceAuditLogTabProps> = ({
  auditLogs,
  isLoadingLogs,
  fetchAuditLogs,
  paginatedAuditLogs,
  logCurrentPage,
  totalLogPages,
  logPageSize,
  setLogCurrentPage,
  setLogPageSize,
}) => {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 14,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>
            Log Mutasi Kas &amp; Audit Trail Sistem
          </h3>
          <p style={{ color: 'var(--gmh-text-muted)', fontSize: 13, margin: 0 }}>
            Audit trail resmi sistem mencatat setiap aktivitas pencatatan transaksi, pembaruan data, penghapusan, dan import massal oleh petugas secara transparan dan akuntabel.
          </p>
        </div>
        <button
          className="btn btn-outline btn-sm"
          id="btn-refresh-audit"
          onClick={fetchAuditLogs}
          disabled={isLoadingLogs}
          title="Muat ulang log mutasi sistem"
        >
          <RefreshCw size={13} className={isLoadingLogs ? 'animate-spin' : ''} />
          {isLoadingLogs ? 'Memuat Log…' : 'Segarkan Log Sistem'}
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th style={{ minWidth: 150 }}>WAKTU &amp; TANGGAL</th>
                <th style={{ minWidth: 120 }}>JENIS AKTIVITAS</th>
                <th style={{ minWidth: 140 }}>NOMOR REF</th>
                <th style={{ minWidth: 150 }}>PIHAK RELASI</th>
                <th style={{ minWidth: 140 }}>PETUGAS / OPERATOR</th>
                <th>KETERANGAN AKTIVITAS</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--gmh-text-muted)' }}>
                    <AlertCircle size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    <div>Belum ada log mutasi kas yang tercatat di database sistem.</div>
                  </td>
                </tr>
              ) : (
                paginatedAuditLogs.map((log) => {
                  const actUpper = (log.action || '').toUpperCase();
                  const isCreate = actUpper.includes('PENCATATAN') || actUpper === 'CREATE' || actUpper.includes('INSERT');
                  const isUpdate = actUpper === 'UPDATE';
                  const isDelete = actUpper.includes('HAPUS') || actUpper === 'DELETE';
                  const isImport = actUpper.includes('IMPORT') || actUpper.includes('BATCH');

                  const badgeBg = isCreate ? '#ecfdf5' : isUpdate ? '#eff6ff' : isDelete ? '#fef2f2' : isImport ? '#f5f3ff' : '#f3f4f6';
                  const badgeColor = isCreate ? '#065f46' : isUpdate ? '#1e40af' : isDelete ? '#991b1b' : isImport ? '#5b21b6' : '#374151';

                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: 11.5, fontFamily: 'monospace', color: 'var(--gmh-text-muted)' }}>
                        {log.timestamp}
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: badgeBg,
                            color: badgeColor,
                            fontSize: 10.5,
                            fontWeight: 700,
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <code style={{ fontSize: 11.5, background: 'var(--gmh-surface-2)', padding: '2px 6px', borderRadius: 4 }}>
                          {log.refCode}
                        </code>
                      </td>
                      <td style={{ fontWeight: 500, fontSize: 12.5 }}>{log.party}</td>
                      <td style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>{log.operator}</td>
                      <td style={{ fontSize: 12.5 }}>{log.details}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination for Audit Logs */}
        {auditLogs.length > 0 && (
          <Pagination
            currentPage={logCurrentPage}
            totalPages={totalLogPages}
            totalItems={auditLogs.length}
            pageSize={logPageSize}
            pageSizeOptions={[10, 25, 50]}
            onPageChange={setLogCurrentPage}
            onPageSizeChange={setLogPageSize}
            itemName="log mutasi"
          />
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  FileClock,
  AlertCircle,
  X,
} from 'lucide-react';
import { api, type AuditLogEntry } from '../../services/api';
import { Pagination } from '../../components/common/Pagination';

// ============================================================================
// JEJAK AUDIT SISTEM
// Halaman read-only untuk memantau siapa, kapan, dan apa yang diubah pada
// seluruh modul yayasan. Data dibaca dari endpoint /audit-logs yang dilindungi
// modul hak akses AUDIT_LOGS.
// ============================================================================

const ACTION_META: Record<string, { label: string; badge: string }> = {
  INSERT: { label: 'Tambah Data', badge: 'badge-success' },
  UPDATE: { label: 'Ubah Data', badge: 'badge-warning' },
  DELETE: { label: 'Hapus Data', badge: 'badge-danger' },
  APPROVE: { label: 'Persetujuan', badge: 'badge-info' },
  REJECT: { label: 'Penolakan', badge: 'badge-danger' },
  PAYROLL_DISBURSE: { label: 'Pembayaran Gaji', badge: 'badge-primary' },
  PAYMENT: { label: 'Pembayaran', badge: 'badge-success' },
  VERIFY: { label: 'Verifikasi', badge: 'badge-info' },
};

const ACTION_OPTIONS = [
  { value: 'ALL', label: 'Semua Aktivitas' },
  ...Object.keys(ACTION_META).map((key) => ({
    value: key,
    label: ACTION_META[key].label,
  })),
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const formatDateTime = (value: string): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [entities, setEntities] = useState<Array<{ key: string; label: string; total: number }>>([]);
  const [operators, setOperators] = useState<Array<{ id: string; name: string; role: string; total: number }>>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [action, setAction] = useState('ALL');
  const [entity, setEntity] = useState('ALL');
  const [operator, setOperator] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.audit.getAuditLogs({
        search: search.trim() || undefined,
        action,
        entity,
        operator,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo ? `${dateTo}T23:59:59` : undefined,
        page,
        limit,
      });

      setLogs(res.logs || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setEntities(res.entities || []);
      setOperators(res.operators || []);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat jejak audit sistem.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [search, action, entity, operator, dateFrom, dateTo, page, limit]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  // Reset ke halaman pertama setiap kali filter berubah
  useEffect(() => {
    setPage(1);
  }, [search, action, entity, operator, dateFrom, dateTo, limit]);

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setAction('ALL');
    setEntity('ALL');
    setOperator('ALL');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilter =
    Boolean(search) ||
    action !== 'ALL' ||
    entity !== 'ALL' ||
    operator !== 'ALL' ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20 }}>
      <div className="page-header-text">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={22} style={{ color: 'var(--gmh-green, #1B4332)' }} />
          <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: 'var(--gmh-text, #0f172a)' }}>
            Jejak Audit Sistem
          </h1>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--gmh-text-muted, #64748b)' }}>
          Rekam aktivitas seluruh modul: siapa yang mengubah, kapan, dan nilai apa yang berubah.
          Halaman bersifat hanya-baca.
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => void fetchLogs()}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : undefined} />
          Muat Ulang
        </button>
      </div>
    </div>

    {/* Filter */}
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileClock size={16} />
          Penyaring Jejak
        </div>
        {hasActiveFilter && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={resetFilters}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <X size={13} />
            Atur Ulang
          </button>
        )}
      </div>
      <div className="card-body" style={{ padding: 16 }}>
        <form
          onSubmit={applySearch}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}
        >
          <div className="form-group">
            <label className="form-label" htmlFor="audit-search">
              Pencarian
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                id="audit-search"
                className="form-input"
                type="search"
                placeholder="ID, operator, atau nilai data…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm" aria-label="Cari jejak audit">
                <Search size={14} />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="audit-action">
              Aktivitas
            </label>
            <select
              id="audit-action"
              className="form-select"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="audit-entity">
              Modul Data
            </label>
            <select
              id="audit-entity"
              className="form-select"
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
            >
              <option value="ALL">Semua Modul</option>
              {entities.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label} ({opt.total})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="audit-operator">
              Operator
            </label>
            <select
              id="audit-operator"
              className="form-select"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
            >
              <option value="ALL">Semua Operator</option>
              {operators.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name} ({opt.total})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="audit-date-from">
              Dari Tanggal
            </label>
            <input
              id="audit-date-from"
              className="form-input"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="audit-date-to">
              Sampai Tanggal
            </label>
            <input
              id="audit-date-to"
              className="form-input"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </form>
      </div>
    </div>

    {error && (
      <div
        className="card"
        style={{
          marginBottom: 20,
          border: '1px solid #fecaca',
          background: '#fef2f2',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#b91c1c',
          fontSize: 13,
        }}
      >
        <AlertCircle size={16} />
        {error}
      </div>
    )}

    {/* Tabel jejak */}
    <div className="card" style={{ marginBottom: 24, overflow: 'hidden' }}>
      <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={16} />
          Daftar Aktivitas
        </div>
        <span style={{ fontSize: 12.5, color: 'var(--gmh-text-muted, #64748b)' }}>
          {loading ? 'Memuat…' : `${total} catatan ditemukan`}
        </span>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>Waktu</th>
              <th>Aktivitas</th>
              <th>Modul Data</th>
              <th>Operator</th>
              <th>Alamat IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '28px 12px', color: '#64748b' }}>
                  Memuat jejak audit…
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '28px 12px', color: '#64748b' }}>
                  {hasActiveFilter
                    ? 'Tidak ada jejak audit yang cocok dengan penyaring saat ini.'
                    : 'Belum ada jejak audit tercatat pada sistem.'}
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const meta = ACTION_META[log.action] || { label: log.action, badge: 'badge-neutral' };
                const isOpen = expanded === log.id;
                const changedFields = collectChangedFields(log);

                return (
                  <React.Fragment key={log.id}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : log.id)}>
                      <td>
                        {isOpen ? (
                          <ChevronDown size={15} style={{ color: '#64748b' }} />
                        ) : (
                          <ChevronRight size={15} style={{ color: '#94a3b8' }} />
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12.5 }}>{formatDateTime(log.createdAt)}</td>
                      <td>
                        <span className={`badge ${meta.badge}`}>{meta.label}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.entityLabel}</div>
                        {log.entityId && (
                          <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                            ID: {log.entityId}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.operatorName}</div>
                        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                          {log.operatorRole}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: '#475569' }}>{log.ipAddress || '-'}</td>
                    </tr>

                    {isOpen && (
                      <tr>
                        <td colSpan={6} style={{ background: '#f8fafc', padding: '14px 18px' }}>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                              gap: 14,
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.6,
                                  color: '#64748b',
                                  marginBottom: 6,
                                }}
                              >
                                Nilai Sebelum
                              </div>
                              {Object.keys(log.oldValues || {}).length === 0 ? (
                                <div style={{ fontSize: 12.5, color: '#94a3b8' }}>
                                  Tidak ada data sebelumnya (entri baru dibuat).
                                </div>
                              ) : (
                                <div
                                  style={{
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 8,
                                    padding: 10,
                                    fontSize: 12,
                                  }}
                                >
                                  {Object.entries(log.oldValues || {}).map(([key, value]) => (
                                    <div key={key} style={{ display: 'flex', gap: 8, padding: '2px 0' }}>
                                      <span style={{ color: '#64748b', minWidth: 130 }}>{key}</span>
                                      <span style={{ color: '#b91c1c', wordBreak: 'break-word' }}>
                                        {formatValue(value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.6,
                                  color: '#64748b',
                                  marginBottom: 6,
                                }}
                              >
                                Nilai Sesudah
                              </div>
                              {Object.keys(log.newValues || {}).length === 0 ? (
                                <div style={{ fontSize: 12.5, color: '#94a3b8' }}>
                                  Tidak ada data sesudahnya (entri dihapus).
                                </div>
                              ) : (
                                <div
                                  style={{
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 8,
                                    padding: 10,
                                    fontSize: 12,
                                  }}
                                >
                                  {Object.entries(log.newValues || {}).map(([key, value]) => (
                                    <div key={key} style={{ display: 'flex', gap: 8, padding: '2px 0' }}>
                                      <span style={{ color: '#64748b', minWidth: 130 }}>{key}</span>
                                      <span style={{ color: '#15803d', wordBreak: 'break-word' }}>
                                        {formatValue(value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.6,
                                  color: '#64748b',
                                  marginBottom: 6,
                                }}
                              >
                                Informasi Aktivitas
                              </div>
                              <div
                                style={{
                                  background: '#fff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 8,
                                  padding: 10,
                                  fontSize: 12,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 4,
                                }}
                              >
                                <div>
                                  <span style={{ color: '#64748b' }}>Operator: </span>
                                  {log.operatorName}
                                  {log.operatorUsername ? ` (${log.operatorUsername})` : ''}
                                </div>
                                <div>
                                  <span style={{ color: '#64748b' }}>Waktu: </span>
                                  {formatDateTime(log.createdAt)}
                                </div>
                                <div>
                                  <span style={{ color: '#64748b' }}>Alamat IP: </span>
                                  {log.ipAddress || '-'}
                                </div>
                                {changedFields.length > 0 && (
                                  <div>
                                    <span style={{ color: '#64748b' }}>Field berubah: </span>
                                    {changedFields.join(', ')}
                                  </div>
                                )}
                                {log.userAgent && (
                                  <div style={{ color: '#94a3b8', fontSize: 11.5, wordBreak: 'break-all' }}>
                                    {log.userAgent}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={limit}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setLimit(size);
          setPage(1);
        }}
        itemName="catatan"
      />
    </div>
    </div>
  );
};

/**
 * Menentukan nama field yang berubah antara nilai sebelum dan sesudah,
 * sehingga operator dapat cepat memverifikasi apa yang benar-benar dimodifikasi.
 */
const collectChangedFields = (log: AuditLogEntry): string[] => {
  const oldKeys = Object.keys(log.oldValues || {});
  const newKeys = Object.keys(log.newValues || {});
  const keys = Array.from(new Set([...oldKeys, ...newKeys]));

  return keys.filter((key) => {
    const before = formatValue(log.oldValues?.[key]);
    const after = formatValue(log.newValues?.[key]);
    return before !== after;
  });
};

export default AuditLogsPage;

import React from 'react';
import {
  Search,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Pagination } from '../../../components/common/Pagination';
import type { OutgoingLetter, LetterCategory } from '../types';
import { formatDateID } from '../types';

interface SecretariatOutgoingTabProps {
  outgoingLetters: OutgoingLetter[];
  outgoingSearch: string;
  setOutgoingSearch: (val: string) => void;
  outgoingCategoryFilter: string;
  setOutgoingCategoryFilter: (val: string) => void;
  outgoingStatusFilter: string;
  setOutgoingStatusFilter: (val: string) => void;
  outgoingPage: number;
  setOutgoingPage: (page: number) => void;
  outgoingPageSize: number;
  setOutgoingPageSize: (size: number) => void;
  outgoingTotal: number;
  categories: LetterCategory[];
  isLoading: boolean;
  loadOutgoing: () => void;
  handleUpdateLetterStatus: (letter: OutgoingLetter, newStatus: string) => Promise<void>;
  setPreviewOutgoing: (letter: OutgoingLetter) => void;
  setEditingOutgoing: (letter: OutgoingLetter) => void;
  handleDeleteOutgoing: (letter: OutgoingLetter) => Promise<void>;
}

export const SecretariatOutgoingTab: React.FC<SecretariatOutgoingTabProps> = ({
  outgoingLetters,
  outgoingSearch,
  setOutgoingSearch,
  outgoingCategoryFilter,
  setOutgoingCategoryFilter,
  outgoingStatusFilter,
  setOutgoingStatusFilter,
  outgoingPage,
  setOutgoingPage,
  outgoingPageSize,
  setOutgoingPageSize,
  outgoingTotal,
  categories,
  isLoading,
  loadOutgoing,
  handleUpdateLetterStatus,
  setPreviewOutgoing,
  setEditingOutgoing,
  handleDeleteOutgoing,
}) => {
  return (
    <div className="card">
      {/* Filter Bar */}
      <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="card-title">Daftar Arsip & Penerbitan Surat Keluar</div>
          <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
            Nomor surat digenerate otomatis secara atomic dari template Sistem Utility
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Cari no. surat, perihal, penerima..."
              value={outgoingSearch}
              onChange={(e) => {
                setOutgoingSearch(e.target.value);
                setOutgoingPage(1);
              }}
              className="form-input form-input-sm"
              style={{ width: 240, paddingLeft: 32, fontSize: 12.5 }}
            />
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--gmh-text-muted)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            className="form-select form-select-sm"
            value={outgoingCategoryFilter}
            onChange={(e) => {
              setOutgoingCategoryFilter(e.target.value);
              setOutgoingPage(1);
            }}
            style={{ width: 'auto', minWidth: 160, fontSize: 12.5 }}
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id || c.code} value={c.code}>
                {c.code} - {c.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="form-select form-select-sm"
            value={outgoingStatusFilter}
            onChange={(e) => {
              setOutgoingStatusFilter(e.target.value);
              setOutgoingPage(1);
            }}
            style={{ width: 'auto', fontSize: 12.5 }}
          >
            <option value="">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="TERKIRIM">Send (Terkirim)</option>
            <option value="DITERIMA">Arrived (Diterima)</option>
            <option value="DIARSIPKAN">Diarsipkan</option>
          </select>

          <button
            className="btn btn-outline btn-sm"
            onClick={loadOutgoing}
            disabled={isLoading}
            title="Segarkan data"
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Outgoing Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Nomor Surat Resmi</th>
              <th>Tanggal</th>
              <th>Jenis / Klasifikasi</th>
              <th>Perihal & Ringkasan</th>
              <th>Tujuan / Penerima</th>
              <th>Penandatangan</th>
              <th>Status</th>
              <th style={{ width: 110, textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 28, color: 'var(--gmh-text-muted)' }}>
                  Memuat data surat keluar...
                </td>
              </tr>
            ) : outgoingLetters.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--gmh-text-muted)' }}>
                  Belum ada surat keluar yang terdata. Klik tombol <strong>Buat Surat Keluar</strong> untuk menerbitkan surat pertama.
                </td>
              </tr>
            ) : (
              outgoingLetters.map((letter, idx) => (
                <tr key={letter.id}>
                  <td style={{ color: 'var(--gmh-text-muted)', fontSize: 12 }}>
                    {(outgoingPage - 1) * outgoingPageSize + idx + 1}
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: '#1d4ed8',
                        background: '#eff6ff',
                        padding: '3px 8px',
                        borderRadius: 5,
                        border: '1px solid #bfdbfe',
                        fontSize: 12.5,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {letter.letter_number}
                    </span>
                  </td>
                  <td style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>
                    {formatDateID(letter.letter_date)}
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ fontWeight: 600, fontSize: 11.5 }}>
                      {letter.category_code}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--gmh-text)' }}>{letter.subject}</div>
                    {letter.content_summary && (
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, maxWidth: 280 }} className="truncate">
                        {letter.content_summary}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--gmh-text)' }}>{letter.recipient}</div>
                    {letter.recipient_address && (
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>{letter.recipient_address}</div>
                    )}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    <div style={{ fontWeight: 600 }}>{letter.signer_name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{letter.signer_position}</div>
                  </td>
                  <td>
                    <select
                      value={letter.status?.toUpperCase() || 'TERKIRIM'}
                      onChange={(e) => void handleUpdateLetterStatus(letter, e.target.value)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: '1px solid',
                        outline: 'none',
                        background:
                          letter.status?.toUpperCase() === 'TERKIRIM' || letter.status?.toUpperCase() === 'SEND'
                            ? '#dcfce7'
                            : letter.status?.toUpperCase() === 'DITERIMA' || letter.status?.toUpperCase() === 'ARRIVED'
                            ? '#dbeafe'
                            : letter.status?.toUpperCase() === 'DRAFT'
                            ? '#f1f5f9'
                            : '#fef3c7',
                        color:
                          letter.status?.toUpperCase() === 'TERKIRIM' || letter.status?.toUpperCase() === 'SEND'
                            ? '#15803d'
                            : letter.status?.toUpperCase() === 'DITERIMA' || letter.status?.toUpperCase() === 'ARRIVED'
                            ? '#1d4ed8'
                            : letter.status?.toUpperCase() === 'DRAFT'
                            ? '#475569'
                            : '#b45309',
                        borderColor:
                          letter.status?.toUpperCase() === 'TERKIRIM' || letter.status?.toUpperCase() === 'SEND'
                            ? '#86efac'
                            : letter.status?.toUpperCase() === 'DITERIMA' || letter.status?.toUpperCase() === 'ARRIVED'
                            ? '#93c5fd'
                            : letter.status?.toUpperCase() === 'DRAFT'
                            ? '#cbd5e1'
                            : '#fde68a',
                        transition: 'all 0.15s ease',
                      }}
                      title="Klik untuk langsung mengubah status surat (Draft / Send / Arrived)"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="TERKIRIM">Send</option>
                      <option value="DITERIMA">Arrived</option>
                      <option value="DIARSIPKAN">Diarsipkan</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setPreviewOutgoing(letter)}
                        title="Lihat Informasi Surat & Buka di Word / Google Docs"
                        style={{ padding: '4px 6px', color: '#0284c7', borderColor: '#bae6fd' }}
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setEditingOutgoing(letter)}
                        title="Edit Data Surat Keluar"
                        style={{ padding: '4px 6px' }}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => void handleDeleteOutgoing(letter)}
                        title="Hapus Surat Keluar"
                        style={{ padding: '4px 6px', color: 'var(--gmh-danger)', borderColor: 'var(--gmh-danger)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={outgoingPage}
        totalPages={Math.ceil(outgoingTotal / outgoingPageSize) || 1}
        totalItems={outgoingTotal}
        pageSize={outgoingPageSize}
        onPageChange={setOutgoingPage}
        onPageSizeChange={setOutgoingPageSize}
        itemName="surat keluar"
      />
    </div>
  );
};

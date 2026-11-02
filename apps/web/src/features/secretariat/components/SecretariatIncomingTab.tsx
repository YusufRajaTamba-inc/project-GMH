import React from 'react';
import {
  Search,
  Inbox,
  RefreshCw,
  FileCheck,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Pagination } from '../../../components/common/Pagination';
import type { IncomingLetter } from '../types';
import { formatDateID } from '../types';

const renderStatusBadge = (status: string): React.ReactElement => {
  switch (status?.toUpperCase()) {
    case 'TERKIRIM':
    case 'SELESAI':
      return <span className="badge badge-success">{status}</span>;
    case 'DIDISPOSISIKAN':
    case 'DITINDAKLANJUTI':
      return <span className="badge badge-warning">{status}</span>;
    case 'DRAFT':
      return <span className="badge badge-neutral">DRAFT</span>;
    case 'DITERIMA':
      return <span className="badge badge-info">DITERIMA</span>;
    default:
      return <span className="badge badge-neutral">{status}</span>;
  }
};

interface SecretariatIncomingTabProps {
  incomingLetters: IncomingLetter[];
  incomingSearch: string;
  setIncomingSearch: (val: string) => void;
  incomingStatusFilter: string;
  setIncomingStatusFilter: (val: string) => void;
  incomingDispositionFilter: string;
  setIncomingDispositionFilter: (val: string) => void;
  incomingPage: number;
  setIncomingPage: (page: number) => void;
  incomingPageSize: number;
  setIncomingPageSize: (size: number) => void;
  incomingTotal: number;
  isLoading: boolean;
  loadIncoming: () => void;
  setShowCreateIncomingModal: (val: boolean) => void;
  setPreviewIncoming: (letter: IncomingLetter) => void;
  setEditingIncoming: (letter: IncomingLetter) => void;
  handleDeleteIncoming: (letter: IncomingLetter) => Promise<void>;
}

export const SecretariatIncomingTab: React.FC<SecretariatIncomingTabProps> = ({
  incomingLetters,
  incomingSearch,
  setIncomingSearch,
  incomingStatusFilter,
  setIncomingStatusFilter,
  incomingDispositionFilter,
  setIncomingDispositionFilter,
  incomingPage,
  setIncomingPage,
  incomingPageSize,
  setIncomingPageSize,
  incomingTotal,
  isLoading,
  loadIncoming,
  setShowCreateIncomingModal,
  setPreviewIncoming,
  setEditingIncoming,
  handleDeleteIncoming,
}) => {
  return (
    <div className="card">
      {/* Filter Bar */}
      <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="card-title">Buku Agenda & Arsip Surat Masuk</div>
          <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', marginTop: 2 }}>
            Pencatatan surat masuk dari dinas/lembaga luar serta tracking lembar disposisi
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Cari agenda, no. surat asal, instansi..."
              value={incomingSearch}
              onChange={(e) => {
                setIncomingSearch(e.target.value);
                setIncomingPage(1);
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

          {/* Status Filter */}
          <select
            className="form-select form-select-sm"
            value={incomingStatusFilter}
            onChange={(e) => {
              setIncomingStatusFilter(e.target.value);
              setIncomingPage(1);
            }}
            style={{ width: 'auto', fontSize: 12.5 }}
          >
            <option value="">Semua Status</option>
            <option value="DITERIMA">DITERIMA</option>
            <option value="DIDISPOSISIKAN">DIDISPOSISIKAN</option>
            <option value="DITINDAKLANJUTI">DITINDAKLANJUTI</option>
            <option value="SELESAI">SELESAI</option>
            <option value="DIARSIPKAN">DIARSIPKAN</option>
          </select>

          {/* Disposition Target Filter */}
          <select
            className="form-select form-select-sm"
            value={incomingDispositionFilter}
            onChange={(e) => {
              setIncomingDispositionFilter(e.target.value);
              setIncomingPage(1);
            }}
            style={{ width: 'auto', fontSize: 12.5 }}
          >
            <option value="">Semua Disposisi</option>
            <option value="Ketua Pembina">Ketua Pembina</option>
            <option value="Ketua Umum Pengurus Harian">Ketua Pengurus Harian</option>
            <option value="Sekretaris Umum">Sekretaris Umum</option>
            <option value="Bendahara Yayasan">Bendahara Yayasan</option>
            <option value="Koordinator Sarana & Aset">Koordinator Sarana</option>
          </select>

          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setShowCreateIncomingModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '5px 12px',
              fontWeight: 650,
              fontSize: 12,
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            <Inbox size={13} /> Catat Surat Masuk
          </button>

          <button
            className="btn btn-outline btn-sm"
            onClick={loadIncoming}
            disabled={isLoading}
            title="Segarkan data"
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Incoming Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>No. Agenda Masuk</th>
              <th>No. Surat Asal & Tanggal</th>
              <th>Pengirim / Instansi Asal</th>
              <th>Perihal</th>
              <th>Tanggal Diterima</th>
              <th>Disposisi Kepada</th>
              <th>Status Disposisi</th>
              <th style={{ width: 110, textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 28, color: 'var(--gmh-text-muted)' }}>
                  Memuat data surat masuk...
                </td>
              </tr>
            ) : incomingLetters.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--gmh-text-muted)' }}>
                  Belum ada surat masuk yang dicatat. Klik tombol <strong>Catat Surat Masuk</strong> untuk mencatat surat masuk baru.
                </td>
              </tr>
            ) : (
              incomingLetters.map((letter, idx) => (
                <tr key={letter.id}>
                  <td style={{ color: 'var(--gmh-text-muted)', fontSize: 12 }}>
                    {(incomingPage - 1) * incomingPageSize + idx + 1}
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: '#15803d',
                        background: '#f0fdf4',
                        padding: '3px 8px',
                        borderRadius: 5,
                        border: '1px solid #bbf7d0',
                        fontSize: 12.5,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {letter.agenda_number}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--gmh-text)', fontFamily: 'monospace', fontSize: 12 }}>
                      {letter.sender_letter_number}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b' }}>
                      Tgl: {formatDateID(letter.letter_date)}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--gmh-text)' }}>{letter.sender_name}</div>
                    {letter.sender_institution && (
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>{letter.sender_institution}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--gmh-text)' }}>{letter.subject}</div>
                    {letter.disposition_notes && (
                      <div style={{ fontSize: 11.5, color: '#0369a1', marginTop: 2, maxWidth: 260 }} className="truncate">
                        📌 {letter.disposition_notes}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>
                    {formatDateID(letter.received_date)}
                  </td>
                  <td>
                    {letter.disposition_to ? (
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          padding: '2px 7px',
                          borderRadius: 4,
                          border: '1px solid #bfdbfe',
                          display: 'inline-block',
                        }}
                      >
                        {letter.disposition_to}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>- Belum didisposisikan -</span>
                    )}
                  </td>
                  <td>{renderStatusBadge(letter.status)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setPreviewIncoming(letter)}
                        title="Lembar Disposisi & Preview Surat"
                        style={{ padding: '4px 6px', color: '#16a34a', borderColor: '#bbf7d0' }}
                      >
                        <FileCheck size={13} />
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setEditingIncoming(letter)}
                        title="Edit Data Surat Masuk & Update Disposisi"
                        style={{ padding: '4px 6px' }}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => void handleDeleteIncoming(letter)}
                        title="Hapus Surat Masuk"
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
        currentPage={incomingPage}
        totalPages={Math.ceil(incomingTotal / incomingPageSize) || 1}
        totalItems={incomingTotal}
        pageSize={incomingPageSize}
        onPageChange={setIncomingPage}
        onPageSizeChange={setIncomingPageSize}
        itemName="surat masuk"
      />
    </div>
  );
};

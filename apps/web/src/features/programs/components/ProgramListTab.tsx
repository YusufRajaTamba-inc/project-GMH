import React from 'react';
import {
  Calendar,
  Plus,
  RefreshCw,
  CheckCircle,
  MapPin,
  User,
  Clock,
  Search,
  Eye,
} from 'lucide-react';
import { Pagination } from '../../../components/common/Pagination';
import type { Program } from '../types';
import { CATEGORY_BADGE, CATEGORY_LABEL } from '../types';

interface ProgramListTabProps {
  fetchPrograms: () => void;
  isLoading: boolean;
  setShowAddModal: (show: boolean) => void;
  toastMsg: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  lookups: any;
  displayedPrograms: Program[];
  paginatedPrograms: Program[];
  setActiveProgram: (p: Program) => void;
  setViewMode: (mode: 'list' | 'dashboard') => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  setCurrentPage: (p: number) => void;
  setPageSize: (s: number) => void;
}

export const ProgramListTab: React.FC<ProgramListTabProps> = ({
  fetchPrograms,
  isLoading,
  setShowAddModal,
  toastMsg,
  searchQuery,
  setSearchQuery,
  filterCategory,
  setFilterCategory,
  lookups,
  displayedPrograms,
  paginatedPrograms,
  setActiveProgram,
  setViewMode,
  currentPage,
  totalPages,
  pageSize,
  setCurrentPage,
  setPageSize,
}) => {
  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Program &amp; Persekutuan</h2>
          <p>Jadwal kegiatan persekutuan alumni PA KMK, seminar pembekalan, dan program kerja yayasan</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={fetchPrograms}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Segarkan
          </button>
          <button
            className="btn btn-primary btn-sm"
            id="btn-add-program"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> Tambah Program
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <CheckCircle size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} color="var(--gmh-gold)" /> Agenda Program Yayasan
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 220 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Cari program, tema, lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: 12, padding: '6px 10px 6px 30px' }}
              />
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <select
              className="form-select"
              style={{ width: 'auto', fontSize: 12, padding: '6px 12px' }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              id="filter-program-type"
            >
              <option value="">Semua Kategori Program</option>
              {(lookups?.programCategories || [
                'Persekutuan Alumni',
                'Seminar & Workshop',
                'Retret & Doa Semalam',
                'Rapat Kerja Yayasan',
              ]).map((cat: string) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Program &amp; Tema</th>
                <th>Tanggal &amp; Waktu</th>
                <th>Tempat Pelaksanaan</th>
                <th>Pembicara / Pelayan</th>
                <th>Kategori</th>
                <th>Status</th>
                <th style={{ textAlign: 'center', width: 110 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--gmh-text-muted)' }}>
                    Memuat program dari API...
                  </td>
                </tr>
              ) : displayedPrograms.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--gmh-text-muted)' }}>
                    Belum ada program yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedPrograms.map((p) => {
                  const evtDate = new Date(p.event_datetime);
                  const isUpcoming = evtDate.getTime() > Date.now();
                  const isCompleted = p.status === 'COMPLETED' || (!isUpcoming && !p.status);

                  return (
                    <tr
                      key={p.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setActiveProgram(p);
                        setViewMode('dashboard');
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--gmh-text)' }}>
                          {p.program_title}
                        </div>
                        {p.theme && (
                          <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', fontStyle: 'italic' }}>
                            Tema: "{p.theme}"
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                          <Clock size={13} color="var(--gmh-text-muted)" />
                          {evtDate.toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--gmh-text-muted)', paddingLeft: 19 }}>
                          {evtDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <MapPin size={13} color="var(--gmh-gold)" />
                          {p.location || 'Rumah Persekutuan GMH'}
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {p.speaker_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <User size={13} color="var(--gmh-text-muted)" />
                            {p.speaker_name}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--gmh-text-muted)', fontSize: 12 }}>-</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${CATEGORY_BADGE[p.program_category] || 'badge-primary'}`}>
                          {CATEGORY_LABEL[p.program_category] || p.program_category}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isCompleted ? 'badge-neutral' : 'badge-info'}`}>
                          {isCompleted ? 'Terlaksana' : 'Akan Datang'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{
                            fontSize: 11.5,
                            padding: '4px 8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: 'var(--gmh-primary)',
                          }}
                          onClick={() => {
                            setActiveProgram(p);
                            setViewMode('dashboard');
                          }}
                        >
                          <Eye size={13} /> Lihat Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={displayedPrograms.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="program"
        />
      </div>
    </div>
  );
};

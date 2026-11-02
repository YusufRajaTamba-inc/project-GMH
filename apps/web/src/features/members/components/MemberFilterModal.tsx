import React from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import type { DraftFilters } from '../types';

interface MemberFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftFilters: DraftFilters;
  setDraftFilters: React.Dispatch<React.SetStateAction<DraftFilters>>;
  onApply: () => void;
  onReset: () => void;
  availableEntryYears: number[];
  availableCities: string[];
  availableProfessions: string[];
  lookups: any;
  fieldLabels: Record<string, string>;
}

export const MemberFilterModal: React.FC<MemberFilterModalProps> = ({
  isOpen,
  onClose,
  draftFilters,
  setDraftFilters,
  onApply,
  onReset,
  availableEntryYears,
  availableCities,
  availableProfessions,
  lookups,
  fieldLabels,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 640, width: '92%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--gmh-gold-pale)',
                color: 'var(--gmh-gold-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Filter size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ margin: 0 }}>Filter Data Anggota &amp; Alumni</h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                Pilih kriteria untuk menyaring database anggota Yayasan GMH
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {/* 1. Tahun Angkatan / Masuk */}
            <div className="form-group">
              <label className="form-label" htmlFor="modal-filter-entry-year" style={{ fontWeight: 600 }}>
                Tahun Angkatan / Masuk
              </label>
              <select
                className="form-select"
                id="modal-filter-entry-year"
                value={draftFilters.entryYear}
                onChange={(e) => setDraftFilters({ ...draftFilters, entryYear: e.target.value })}
              >
                <option value="">Semua Tahun Angkatan</option>
                {availableEntryYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Angkatan {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Kota Domisili */}
            <div className="form-group">
              <label className="form-label" htmlFor="modal-filter-city" style={{ fontWeight: 600 }}>
                Kota Domisili
              </label>
              <select
                className="form-select"
                id="modal-filter-city"
                value={draftFilters.city}
                onChange={(e) => setDraftFilters({ ...draftFilters, city: e.target.value })}
              >
                <option value="">Semua Kota Domisili</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Fakultas Asal USU */}
            <div className="form-group">
              <label className="form-label" htmlFor="modal-filter-faculty" style={{ fontWeight: 600 }}>
                {fieldLabels['member.faculty'] || 'Fakultas Asal USU'}
              </label>
              <select
                className="form-select"
                id="modal-filter-faculty"
                value={draftFilters.faculty}
                onChange={(e) => setDraftFilters({ ...draftFilters, faculty: e.target.value })}
              >
                <option value="">Semua {fieldLabels['member.faculty'] || 'Fakultas USU'}</option>
                {lookups.faculties.map((f: string) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Profesi / Pekerjaan */}
            <div className="form-group">
              <label className="form-label" htmlFor="modal-filter-profession" style={{ fontWeight: 600 }}>
                {fieldLabels['member.profession'] || 'Profesi / Pekerjaan'}
              </label>
              <select
                className="form-select"
                id="modal-filter-profession"
                value={draftFilters.profession}
                onChange={(e) => setDraftFilters({ ...draftFilters, profession: e.target.value })}
              >
                <option value="">Semua Profesi</option>
                {availableProfessions.map((prof) => (
                  <option key={prof} value={prof}>
                    {prof}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Status Pernikahan */}
            <div className="form-group">
              <label className="form-label" htmlFor="modal-filter-marital" style={{ fontWeight: 600 }}>
                {fieldLabels['member.maritalStatus'] || 'Status Pernikahan'}
              </label>
              <select
                className="form-select"
                id="modal-filter-marital"
                value={draftFilters.maritalStatus}
                onChange={(e) => setDraftFilters({ ...draftFilters, maritalStatus: e.target.value })}
              >
                <option value="">Semua Status Nikah</option>
                {(lookups.maritalStatuses || ['Lajang', 'Menikah', 'Duda/Janda']).map((st: string) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Tipe Anggota */}
            <div className="form-group">
              <label className="form-label" htmlFor="modal-filter-type" style={{ fontWeight: 600 }}>
                Tipe Anggota
              </label>
              <select
                className="form-select"
                id="modal-filter-type"
                value={draftFilters.type}
                onChange={(e) => setDraftFilters({ ...draftFilters, type: e.target.value })}
              >
                <option value="">Semua Tipe</option>
                <option value="ALUMNI">Alumni</option>
                <option value="MAHASISWA">Mahasiswa Binaan</option>
                <option value="STAF_YAYASAN">Staf Yayasan</option>
                <option value="MITRA">Mitra / Donatur Yayasan</option>
              </select>
            </div>

            {/* 7. Status Keanggotaan */}
            <div className="form-group">
              <label className="form-label" htmlFor="modal-filter-status" style={{ fontWeight: 600 }}>
                Status Keanggotaan
              </label>
              <select
                className="form-select"
                id="modal-filter-status"
                value={draftFilters.status}
                onChange={(e) => setDraftFilters({ ...draftFilters, status: e.target.value })}
              >
                <option value="">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="MUTATED">Mutasi</option>
                <option value="DECEASED">Meninggal</option>
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onReset}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--gmh-danger)' }}
          >
            <RotateCcw size={13} /> Reset Kriteria
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onClose}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onApply}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Filter size={14} /> Terapkan Filter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

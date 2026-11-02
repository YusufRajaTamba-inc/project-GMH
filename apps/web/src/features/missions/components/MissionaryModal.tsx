import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus } from 'lucide-react';
import type { MissionaryPerson } from '../types';

interface MissionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMissionary: MissionaryPerson | null;
  missionaries: MissionaryPerson[];
  saveMissionaries: (list: MissionaryPerson[]) => void;
  showToast: (msg: string) => void;
  members: any[];
}

export const MissionaryModal: React.FC<MissionaryModalProps> = ({
  isOpen,
  onClose,
  editingMissionary,
  missionaries,
  saveMissionaries,
  showToast,
  members,
}) => {
  const [formMissionary, setFormMissionary] = useState({
    name: '',
    member_id: '',
    pos: 'Pos Pelayanan Simalungun',
    region: 'Sumatera Utara',
    since: '2026-01',
    status: 'ACTIVE' as 'ACTIVE' | 'FURLOUGH',
    contact: '',
    isManual: false,
  });
  const [missionarySearchQuery, setMissionarySearchQuery] = useState('');
  const [showMissionaryDropdown, setShowMissionaryDropdown] = useState(false);

  useEffect(() => {
    if (editingMissionary) {
      setFormMissionary({
        name: editingMissionary.name,
        member_id: editingMissionary.member_id || '',
        pos: editingMissionary.pos,
        region: editingMissionary.region,
        since: editingMissionary.since,
        status: editingMissionary.status,
        contact: editingMissionary.contact || '',
        isManual: !editingMissionary.member_id,
      });
      setMissionarySearchQuery(editingMissionary.name);
    } else {
      setFormMissionary({
        name: '',
        member_id: '',
        pos: 'Pos Pelayanan Simalungun',
        region: 'Sumatera Utara',
        since: '2026-01',
        status: 'ACTIVE',
        contact: '',
        isManual: false,
      });
      setMissionarySearchQuery('');
    }
    setShowMissionaryDropdown(false);
  }, [editingMissionary, isOpen]);

  const filteredMissionaryMembers = useMemo(() => {
    const q = missionarySearchQuery.toLowerCase().trim();
    if (!q) return members.slice(0, 8);
    return members
      .filter(
        (m: any) =>
          m.name.toLowerCase().includes(q) ||
          (m.nia && m.nia.toLowerCase().includes(q)) ||
          (m.faculty && m.faculty.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [members, missionarySearchQuery]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMissionary.name.trim()) {
      alert('Nama pekabar injil wajib diisi.');
      return;
    }

    if (editingMissionary) {
      const updated = missionaries.map((m) =>
        m.id === editingMissionary.id
          ? {
              ...m,
              name: formMissionary.name.trim(),
              member_id: formMissionary.member_id || undefined,
              pos: formMissionary.pos,
              region: formMissionary.region,
              since: formMissionary.since,
              status: formMissionary.status,
              contact: formMissionary.contact.trim() || undefined,
            }
          : m
      );
      saveMissionaries(updated);
      showToast(`Data "${formMissionary.name}" berhasil diperbarui.`);
    } else {
      const newPerson: MissionaryPerson = {
        id: `m-staff-${Date.now()}`,
        name: formMissionary.name.trim(),
        member_id: formMissionary.member_id || undefined,
        pos: formMissionary.pos,
        region: formMissionary.region,
        since: formMissionary.since,
        status: formMissionary.status,
        contact: formMissionary.contact.trim() || undefined,
      };
      saveMissionaries([newPerson, ...missionaries]);
      showToast(`Personil "${newPerson.name}" berhasil ditambahkan.`);
    }

    onClose();
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8, 28, 21, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        className="modal"
        style={{
          maxWidth: 520,
          width: '100%',
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={18} color="var(--gmh-green)" />
            {editingMissionary ? 'Edit Data Pekabar Injil' : 'Tambah Personil Pekabar Injil'}
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label className="form-label" style={{ fontSize: 12, fontWeight: 600 }}>
                  Nama Lengkap Pekabar Injil
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setFormMissionary((prev) => ({
                      ...prev,
                      isManual: !prev.isManual,
                      name: '',
                      member_id: '',
                    }));
                    setMissionarySearchQuery('');
                    setShowMissionaryDropdown(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {formMissionary.isManual ? '← Cari dari Data Anggota' : '+ Opsi Input Manual'}
                </button>
              </div>

              {!formMissionary.isManual ? (
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ketik cari nama alumni / staf yayasan..."
                    value={missionarySearchQuery || formMissionary.name}
                    onChange={(e) => {
                      setMissionarySearchQuery(e.target.value);
                      setFormMissionary({ ...formMissionary, name: e.target.value, member_id: '' });
                      setShowMissionaryDropdown(true);
                    }}
                    onFocus={() => setShowMissionaryDropdown(true)}
                    required
                  />
                  {showMissionaryDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: '#ffffff',
                        border: '1px solid var(--gmh-border)',
                        borderRadius: 6,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        maxHeight: 180,
                        overflowY: 'auto',
                        zIndex: 50,
                        marginTop: 4,
                      }}
                    >
                      {filteredMissionaryMembers.length === 0 ? (
                        <div style={{ padding: '8px 10px', fontSize: 11.5, color: '#94a3b8' }}>
                          Tidak ditemukan.
                          <button
                            type="button"
                            onClick={() => {
                              setFormMissionary({ ...formMissionary, isManual: true, name: missionarySearchQuery });
                              setShowMissionaryDropdown(false);
                            }}
                            style={{
                              display: 'block',
                              marginTop: 4,
                              background: 'none',
                              border: 'none',
                              color: '#2563eb',
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            Gunakan "{missionarySearchQuery}" secara manual
                          </button>
                        </div>
                      ) : (
                        filteredMissionaryMembers.map((m: any) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              setFormMissionary({
                                ...formMissionary,
                                name: m.name,
                                member_id: m.id,
                                contact: m.phone || m.email || '',
                                isManual: false,
                              });
                              setMissionarySearchQuery(m.name);
                              setShowMissionaryDropdown(false);
                            }}
                            style={{
                              padding: '8px 10px',
                              fontSize: 12,
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                          >
                            <div style={{ fontWeight: 600, color: 'var(--gmh-text)' }}>{m.name}</div>
                            <div style={{ fontSize: 10.5, color: '#64748b' }}>
                              {m.nia} • {m.faculty || m.profession || 'Alumni'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ev. Benyamin Tobing, S.Th"
                  value={formMissionary.name}
                  onChange={(e) => setFormMissionary({ ...formMissionary, name: e.target.value })}
                  required
                />
              )}
              {formMissionary.member_id && (
                <div style={{ marginTop: 4, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                  ✓ Terhubung dengan ID Anggota Yayasan: {formMissionary.member_id}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>
                  Pos Pelayanan
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Pos Pelayanan Simalungun"
                  value={formMissionary.pos}
                  onChange={(e) => setFormMissionary({ ...formMissionary, pos: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>
                  Wilayah
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sumatera Utara"
                  value={formMissionary.region}
                  onChange={(e) => setFormMissionary({ ...formMissionary, region: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>
                  Mulai Melayani (Tahun-Bulan)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 2024-01"
                  value={formMissionary.since}
                  onChange={(e) => setFormMissionary({ ...formMissionary, since: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 12 }}>
                  Status Pelayanan
                </label>
                <select
                  className="form-select"
                  value={formMissionary.status}
                  onChange={(e) => setFormMissionary({ ...formMissionary, status: e.target.value as any })}
                >
                  <option value="ACTIVE">Aktif Melayani</option>
                  <option value="FURLOUGH">Cuti / Furlough</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 12 }}>
                Kontak / WhatsApp
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 0812-3456-7890"
                value={formMissionary.contact}
                onChange={(e) => setFormMissionary({ ...formMissionary, contact: e.target.value })}
              />
            </div>
          </div>

          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--gmh-border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              background: '#f8fafc',
            }}
          >
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" style={{ fontWeight: 600 }}>
              {editingMissionary ? 'Simpan Perubahan' : 'Tambahkan Personil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

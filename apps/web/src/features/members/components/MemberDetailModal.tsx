import React from 'react';
import {
  Cake,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Briefcase,
  Globe,
  Calendar,
  ShieldCheck,
  Receipt,
  Plus,
  Edit3,
  ExternalLink,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Member } from '../../../state/MemberStoreContext';
import type { MemberServiceRecord } from '../types';
import { formatIndonesianDate, getAgeString } from '../types';
import { formatRupiah } from '../../../utils/currency';
import MemberOrgHistory from '../MemberOrgHistory';

interface MemberDetailModalProps {
  selectedMember: Member | null;
  onClose: () => void;
  onEdit: (m: Member) => void;
  isSuperAdminOrAdmin: boolean;
  memberServiceRecords: MemberServiceRecord[];
  memberPledges: any[];
  memberDonationsLoading: boolean;
  memberTotalPledged: number;
  memberTotalDonated: number;
  onOpenAddPledge: () => void;
  onOpenDonationsPortfolio: () => void;
  onOpenInstallment: (pledge: any) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  selectedMember,
  onClose,
  onEdit,
  isSuperAdminOrAdmin,
  memberServiceRecords,
  memberPledges,
  memberDonationsLoading,
  memberTotalPledged,
  memberTotalDonated,
  onOpenAddPledge,
  onOpenDonationsPortfolio,
  onOpenInstallment,
}) => {
  const navigate = useNavigate();

  if (!selectedMember) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 760, maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header" style={{ alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--gmh-green-dark)' }}>{selectedMember.name}</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
              <code
                style={{
                  fontSize: 12,
                  background: 'var(--gmh-surface-2)',
                  color: 'var(--gmh-text)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontWeight: 600,
                  border: '1px solid var(--gmh-border)',
                }}
              >
                {selectedMember.nia || '-'}
              </code>
              <span className="badge badge-primary">{selectedMember.type || 'ALUMNI'}</span>
              <span
                className={`badge ${
                  selectedMember.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'
                }`}
              >
                {selectedMember.status === 'ACTIVE' ? 'Aktif' : selectedMember.status}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => navigate(`/members/${selectedMember.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gmh-green-dark)' }}
            >
              <ExternalLink size={13} /> Buka Halaman Profil Penuh
            </button>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* SECTION A: Data Diri & Detail Tanggal Lahir (Ultah) */}
          <div className="card" style={{ padding: '16px 20px', background: 'var(--gmh-card-bg)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--gmh-green-dark)' }}>
              Data Pribadi &amp; Status Keluarga
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Nomor Induk Anggota (NIA)</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedMember.nia || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>NIK KTP</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedMember.nik || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Jenis Kelamin</div>
                <div style={{ fontSize: 13 }}>{selectedMember.gender || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Golongan Darah</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {selectedMember.bloodType || selectedMember.customValues?.bloodType || selectedMember.customValues?.blood_type || '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>
                  <Cake size={11} style={{ display: 'inline', marginRight: 4 }} />
                  Tempat &amp; Tanggal Lahir (Ultah)
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gmh-text)' }}>
                  {selectedMember.birthPlace ? `${selectedMember.birthPlace}, ` : ''}
                  {formatIndonesianDate(selectedMember.birthDate)}
                  <span style={{ color: 'var(--gmh-green)', fontSize: 12, fontWeight: 500 }}>
                    {getAgeString(selectedMember.birthDate)}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Status Pernikahan</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {selectedMember.maritalStatus || 'Lajang'}
                </div>
              </div>
              {selectedMember.maritalStatus !== 'Lajang' && selectedMember.weddingDate && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--gmh-gold-dark)', fontWeight: 600 }}>
                    Tanggal Pernikahan (Ultah Nikah)
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--gmh-gold-dark)', fontWeight: 700 }}>
                    {formatIndonesianDate(selectedMember.weddingDate)}
                  </div>
                </div>
              )}
              {selectedMember.maritalStatus !== 'Lajang' && selectedMember.partnerName && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Nama Lengkap Pasangan</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedMember.partnerName}</div>
                </div>
              )}
              {selectedMember.maritalStatus !== 'Lajang' && selectedMember.childrenCount !== undefined && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Jumlah Anak</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedMember.childrenCount} Orang</div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION B: Tempat Tinggal Detail */}
          <div className="card" style={{ padding: '16px 20px', background: 'var(--gmh-card-bg)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--gmh-green-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={15} color="var(--gmh-gold)" /> Tempat Tinggal &amp; Domisili Detail
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Alamat Rumah Lengkap</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.5, fontWeight: 500 }}>
                  {selectedMember.address || 'Kompleks / Jalan belum diisi secara detail'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Kota / Kabupaten</div>
                <div style={{ fontSize: 13 }}>{selectedMember.city || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Wilayah / Kring Alumni</div>
                <div style={{ fontSize: 13 }}>{selectedMember.province || 'Sumatera Utara'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Kode Pos</div>
                <div style={{ fontSize: 13 }}>{selectedMember.postalCode || '-'}</div>
              </div>
            </div>
          </div>

          {/* SECTION C: Kontak & Media Sosial */}
          <div className="card" style={{ padding: '16px 20px', background: 'var(--gmh-card-bg)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--gmh-green-dark)' }}>
              Kontak &amp; Jejaring Media Sosial
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>No. WhatsApp / HP</div>
                <div style={{ fontSize: 13 }}>
                  {selectedMember.phone ? (
                    <a
                      href={`https://wa.me/${selectedMember.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--gmh-green)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                    >
                      <Phone size={13} /> {selectedMember.phone}
                    </a>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Email</div>
                <div style={{ fontSize: 13 }}>
                  {selectedMember.email ? (
                    <a
                      href={`mailto:${selectedMember.email}`}
                      style={{ color: 'var(--gmh-primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Mail size={13} /> {selectedMember.email}
                    </a>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>LinkedIn</div>
                <div style={{ fontSize: 13 }}>
                  {selectedMember.socialMedia?.linkedin ? (
                    <a
                      href={selectedMember.socialMedia.linkedin.startsWith('http') ? selectedMember.socialMedia.linkedin : `https://${selectedMember.socialMedia.linkedin}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#0077b5', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}
                    >
                      <ExternalLink size={12} /> {selectedMember.socialMedia.linkedin}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Belum ditambahkan</span>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Instagram</div>
                <div style={{ fontSize: 13 }}>
                  {selectedMember.socialMedia?.instagram ? (
                    <a
                      href={`https://instagram.com/${selectedMember.socialMedia.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#e1306c', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}
                    >
                      <ExternalLink size={12} /> {selectedMember.socialMedia.instagram}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--gmh-text-muted)' }}>Belum ditambahkan</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION D: Akademik USU & Komunitas PA KMK */}
          <div className="card" style={{ padding: '16px 20px', background: 'var(--gmh-card-bg)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--gmh-green-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <GraduationCap size={16} color="var(--gmh-gold)" /> Data Akademik USU &amp; Pelayanan PA KMK
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Fakultas Asal USU</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedMember.faculty}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Program Studi / Jurusan</div>
                <div style={{ fontSize: 13 }}>{selectedMember.major || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Tahun Masuk</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedMember.entryYear}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Tahun Kelulusan</div>
                <div style={{ fontSize: 13 }}>{selectedMember.graduationYear || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Kelompok Tumbuh Bersama (KTB)</div>
                <div style={{ fontSize: 13 }}>{selectedMember.ktb || '-'}</div>
              </div>
            </div>
          </div>

          {/* SECTION E: Karier & Pekerjaan */}
          <div className="card" style={{ padding: '16px 20px', background: 'var(--gmh-card-bg)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--gmh-green-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Briefcase size={15} color="var(--gmh-gold)" /> Karier &amp; Pekerjaan Saat Ini
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Profesi / Bidang Kerja</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedMember.profession || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Nama Perusahaan / Instansi</div>
                <div style={{ fontSize: 13 }}>{selectedMember.company || '-'}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Minat Keterlibatan Pelayanan Alumni</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gmh-green-dark)' }}>
                  {selectedMember.ministryInterest || 'Belum Menentukan'}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION F: Riwayat Pelayanan Misi & Kepanitiaan (Dimana & Kapan) */}
          <div className="card" style={{ padding: '16px 20px', background: 'var(--gmh-card-bg)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--gmh-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Globe size={16} color="var(--gmh-gold)" /> Riwayat Pelayanan Misi &amp; Kepanitiaan ({memberServiceRecords.length})
              </div>
              <span style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 500 }}>
                Informasi Dimana &amp; Kapan Melayani
              </span>
            </div>
            {memberServiceRecords.length === 0 ? (
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 6, fontSize: 12.5, color: '#64748b', textAlign: 'center' }}>
                Belum ada catatan riwayat kepanitiaan / kordinator dalam kegiatan pelayanan misi untuk anggota ini.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {memberServiceRecords.map((rec, idx) => (
                  <div
                    key={`${rec.activityId}-${idx}`}
                    style={{
                      padding: '10px 14px',
                      background: '#ffffff',
                      border: '1px solid var(--gmh-border)',
                      borderRadius: 6,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 13, color: 'var(--gmh-text)' }}>{rec.activityTitle}</strong>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: rec.status === 'COMPLETED' ? '#ecfdf5' : '#fef3c7',
                            color: rec.status === 'COMPLETED' ? '#065f46' : '#92400e',
                          }}
                        >
                          {rec.status === 'COMPLETED' ? 'SELESAI' : 'SEDANG BERJALAN'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: '#475569', marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Briefcase size={12} color="var(--gmh-gold-dark)" />
                          <strong>Peran:</strong> {rec.role}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} color="var(--gmh-green)" />
                          <strong>Lokasi (Dimana):</strong> {rec.location}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} color="#0284c7" />
                          <strong>Waktu (Kapan):</strong> {rec.timePreview || rec.eventDate}
                        </span>
                      </div>
                    </div>
                    <a
                      href={`/missions`}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 11, padding: '3px 8px', color: 'var(--gmh-green-dark)' }}
                    >
                      Lihat Misi
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION F2: JEJAK KEPENGURUSAN & TUGAS STRUKTUR */}
          <div className="card" style={{ padding: '16px 20px', background: 'var(--gmh-card-bg)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--gmh-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={16} color="var(--gmh-gold)" /> Jejak Kepengurusan &amp; Tugas Struktur
              </div>
              <span style={{ fontSize: 11, color: 'var(--gmh-text-muted)', fontWeight: 500 }}>
                Disinkronkan dari Modul Struktur &amp; Kepengurusan
              </span>
            </div>
            <MemberOrgHistory memberId={selectedMember.id} />
          </div>

          {/* SECTION G: Portofolio Donasi & Janji Iman */}
          <div className="card" style={{ padding: '16px 20px', background: 'var(--gmh-card-bg)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--gmh-green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Receipt size={16} color="var(--gmh-gold)" /> Portofolio Donasi &amp; Janji Iman ({memberPledges.length})
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={onOpenAddPledge}
                  style={{ fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Plus size={12} /> Catat Komitmen
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={onOpenDonationsPortfolio}
                  style={{ fontSize: 11, padding: '3px 8px', color: 'var(--gmh-green-dark)', borderColor: 'var(--gmh-green)' }}
                >
                  Buka Portofolio Lengkap &rarr;
                </button>
              </div>
            </div>

            {memberDonationsLoading ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--gmh-text-muted)', fontSize: 12.5 }}>
                Memuat data donasi dan komitmen janji iman...
              </div>
            ) : memberPledges.length === 0 ? (
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 6, fontSize: 12.5, color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span>Belum ada catatan komitmen donasi atau janji iman untuk anggota ini.</span>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={onOpenAddPledge}
                  style={{ fontSize: 11, padding: '3px 8px' }}
                >
                  + Buat Janji Iman Baru
                </button>
              </div>
            ) : (
              <div>
                {/* Ringkasan Finansial Singkat */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 12 }}>
                  <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid var(--gmh-border)' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Total Komitmen</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gmh-text)' }}>
                      {formatRupiah(memberTotalPledged)}
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', background: '#ecfdf5', borderRadius: 6, border: '1px solid #a7f3d0' }}>
                    <div style={{ fontSize: 10.5, color: '#065f46', fontWeight: 600 }}>Realisasi Terbayar</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#047857' }}>
                      {formatRupiah(memberTotalDonated)}
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', background: memberTotalPledged > memberTotalDonated ? '#fffbeb' : '#f0fdf4', borderRadius: 6, border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: 10.5, color: '#92400e', fontWeight: 600 }}>Sisa Kewajiban</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: memberTotalPledged > memberTotalDonated ? '#b45309' : '#059669' }}>
                      {formatRupiah(Math.max(0, memberTotalPledged - memberTotalDonated))}
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', background: '#f1f5f9', borderRadius: 6, border: '1px solid var(--gmh-border)' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Capaian</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gmh-green-dark)' }}>
                      {memberTotalPledged > 0 ? Math.round((memberTotalDonated / memberTotalPledged) * 100) : 0}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar Visual */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: 'var(--gmh-green)',
                        width: `${Math.min(100, memberTotalPledged > 0 ? Math.round((memberTotalDonated / memberTotalPledged) * 100) : 0)}%`,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* List Pledges Singkat */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {memberPledges.slice(0, 3).map((p) => {
                    const tot = Number(p.total_pledge || 0);
                    const pd = Number(p.fulfilled_amount || 0);
                    const isDone = pd >= tot || p.status === 'COMPLETED';
                    return (
                      <div
                        key={p.id}
                        style={{
                          padding: '8px 12px',
                          background: '#fff',
                          border: '1px solid var(--gmh-border)',
                          borderRadius: 6,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: 12,
                          flexWrap: 'wrap',
                          gap: 6,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--gmh-text)' }}>
                            {p.category || 'Pembangunan Rumah Persekutuan'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--gmh-text-muted)' }}>
                            {p.pledge_type === 'PLEDGE' ? 'Janji Iman' : 'Donasi'} · {p.installments_count || 0}x angsuran · Kuitansi: {p.receipt_number || '-'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 600, color: isDone ? '#059669' : '#b45309' }}>
                              {formatRupiah(pd)} / {formatRupiah(tot)}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: isDone ? '#dcfce7' : '#fef3c7',
                              color: isDone ? '#15803d' : '#b45309',
                            }}
                          >
                            {isDone ? 'LUNAS' : 'AKTIF'}
                          </span>
                          {!isDone && (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => onOpenInstallment(p)}
                              style={{ fontSize: 10.5, padding: '2px 6px', color: 'var(--gmh-green-dark)' }}
                            >
                              + Angsur
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {isSuperAdminOrAdmin && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  const m = selectedMember;
                  onClose();
                  onEdit(m);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gmh-gold-dark)' }}
              >
                <Edit3 size={14} /> Ubah Data Anggota
              </button>
            )}
            <button
              className="btn btn-outline btn-sm"
              onClick={onOpenDonationsPortfolio}
              style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gmh-green-dark)', borderColor: 'var(--gmh-green)', fontWeight: 600 }}
            >
              <Receipt size={14} /> Donasi &amp; Janji Iman ({memberPledges.length})
            </button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Tutup Profil
          </button>
        </div>
      </div>
    </div>
  );
};

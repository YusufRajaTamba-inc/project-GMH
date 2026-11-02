import React from 'react';
import type { Program } from '../types';
import { formatRupiah } from '../types';

interface ProgramPrintReportProps {
  activeProgram: Program;
}

export const ProgramPrintReport: React.FC<ProgramPrintReportProps> = ({ activeProgram }) => {
  const progTotalMasuk = (activeProgram.transactions || [])
    .filter((t) => t.type === 'IN')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const progTotalKeluar = (activeProgram.transactions || [])
    .filter((t) => t.type === 'OUT')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return (
    <div
      id="program-official-print-report"
      className="print-only"
      style={{
        color: '#0f172a',
        fontFamily: "'Inter', sans-serif",
        lineHeight: 1.45,
      }}
    >
      {/* ========================================================================= */}
      {/* LEMBAR 1: INFORMASI PROGRAM & REKAPITULASI KAS MANDIRI                   */}
      {/* ========================================================================= */}
      <div
        className="pdf-page"
        style={{
          width: 794,
          minHeight: 1120,
          boxSizing: 'border-box',
          padding: '24px 32px',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pageBreakAfter: 'always',
          breakAfter: 'page',
          marginBottom: 20,
        }}
      >
        <div>
          {/* 1. KOP SURAT FORMAL YAYASAN (HALAMAN 1) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 10,
              borderBottom: '3px double #0f172a',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src="/logo-yayasan.png"
                alt="Logo Yayasan GMH"
                style={{
                  width: 52,
                  height: 52,
                  objectFit: 'contain',
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    color: '#1b4332',
                  }}
                >
                  YAYASAN GLOBAL MISSION HOUSE (GMH PA KMK)
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: 0.3 }}>
                  BADAN PENGURUS PELAYANAN PROGRAM &amp; PERSEKUTUAN ALUMNI
                </div>
                <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2 }}>
                  Sekretariat: Jl. PA KMK No. 12, Medan • Email: info@gmhpakmk.org • Website: www.gmhpakmk.org
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                KODE DOKUMEN LPJ
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, fontFamily: 'monospace' }}>
                LPJ/GMH-PROG/{activeProgram.id.slice(0, 12)}
              </div>
              <div style={{ fontSize: 8.5, color: '#64748b', marginTop: 2 }}>
                Tgl Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: '#047857', marginTop: 2 }}>
                Halaman 1 dari 2
              </div>
            </div>
          </div>

          {/* 2. JUDUL DOKUMEN RESMI */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h1
              style={{
                fontSize: 15,
                fontWeight: 800,
                textTransform: 'uppercase',
                margin: 0,
                letterSpacing: 0.8,
                color: '#0f172a',
              }}
            >
              LAPORAN PERTANGGUNGJAWABAN KEGIATAN &amp; REALISASI KAS PROGRAM
            </h1>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#475569', marginTop: 3 }}>
              DOKUMEN INTEGRASI ARUS KAS &amp; AKTIVITAS PROGRAM YAYASAN
            </div>
          </div>

          {/* 3. INFORMASI POKOK PROGRAM */}
          <div style={{ marginBottom: 18, pageBreakInside: 'avoid' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: 4,
                marginBottom: 8,
                color: '#1e293b',
              }}
            >
              I. Informasi Pokok Program Kegiatan
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
              <tbody>
                <tr>
                  <td style={{ width: 180, padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Nama Program</td>
                  <td style={{ width: 10, padding: '3px 0' }}>:</td>
                  <td style={{ padding: '3px 4px', fontWeight: 700, color: '#0f172a' }}>{activeProgram.program_title}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Kategori Program</td>
                  <td style={{ padding: '3px 0' }}>:</td>
                  <td style={{ padding: '3px 4px', fontWeight: 600 }}>{activeProgram.program_category}</td>
                </tr>
                {activeProgram.theme && (
                  <tr>
                    <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Tema Acara</td>
                    <td style={{ padding: '3px 0' }}>:</td>
                    <td style={{ padding: '3px 4px', fontStyle: 'italic' }}>"{activeProgram.theme}"</td>
                  </tr>
                )}
                {activeProgram.speaker_name && (
                  <tr>
                    <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Pembicara / Pelayan</td>
                    <td style={{ padding: '3px 0' }}>:</td>
                    <td style={{ padding: '3px 4px', fontWeight: 600 }}>{activeProgram.speaker_name}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Lokasi / Tempat</td>
                  <td style={{ padding: '3px 0' }}>:</td>
                  <td style={{ padding: '3px 4px' }}>{activeProgram.location || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Waktu Pelaksanaan</td>
                  <td style={{ padding: '3px 0' }}>:</td>
                  <td style={{ padding: '3px 4px' }}>
                    {new Date(activeProgram.event_datetime).toLocaleString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569' }}>Status Penyelenggaraan</td>
                  <td style={{ padding: '3px 0' }}>:</td>
                  <td
                    style={{
                      padding: '3px 4px',
                      fontWeight: 700,
                      color: activeProgram.status === 'COMPLETED' ? '#15803d' : '#854d0e',
                    }}
                  >
                    {activeProgram.status === 'COMPLETED' ? 'TERLAKSANA & TUTUP KAS' : 'SEDANG BERJALAN'}
                  </td>
                </tr>
                {activeProgram.description && (
                  <tr>
                    <td style={{ padding: '3px 4px', fontWeight: 600, color: '#475569', verticalAlign: 'top' }}>
                      Uraian Program
                    </td>
                    <td style={{ padding: '3px 0', verticalAlign: 'top' }}>:</td>
                    <td style={{ padding: '3px 4px', color: '#334155' }}>{activeProgram.description}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 4. REKAPITULASI REALISASI KEUANGAN (4 KARTU) */}
          <div style={{ marginBottom: 18, pageBreakInside: 'avoid' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: 4,
                marginBottom: 8,
                color: '#1e293b',
              }}
            >
              II. Ringkasan Realisasi Keuangan &amp; Kas Mandiri Program
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 10px', background: '#f8fafc' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Taksasi Anggaran (Rencana)
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                  {formatRupiah(Number(activeProgram.budget_estimate))}
                </div>
              </div>

              <div style={{ border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 10px', background: '#f0fdf4' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                  Total Pemasukan Kas Acara
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#15803d', marginTop: 2 }}>
                  + {formatRupiah(progTotalMasuk)}
                </div>
              </div>

              <div style={{ border: '1px solid #fecaca', borderRadius: 6, padding: '8px 10px', background: '#fef2f2' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                  Total Pengeluaran Kas Acara
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#b91c1c', marginTop: 2 }}>
                  - {formatRupiah(progTotalKeluar)}
                </div>
              </div>

              <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 10px', background: '#f8fafc' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                  Sisa Saldo Kas Program
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                  {formatRupiah(Number(activeProgram.cash_balance))}
                </div>
              </div>
            </div>
          </div>

          {/* 5. TABEL MUTASI KAS MANDIRI */}
          <div style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: 4,
                marginBottom: 8,
                color: '#1e293b',
              }}
            >
              III. Buku Log Mutasi Kas Mandiri Program ({(activeProgram.transactions || []).length} Transaksi)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '5px 6px', textAlign: 'center', width: 28 }}>NO</th>
                  <th style={{ padding: '5px 6px', textAlign: 'left', width: 85 }}>TANGGAL</th>
                  <th style={{ padding: '5px 6px', textAlign: 'left', width: 95 }}>ARUS</th>
                  <th style={{ padding: '5px 6px', textAlign: 'left', width: 160 }}>KATEGORI / SUMBER</th>
                  <th style={{ padding: '5px 6px', textAlign: 'left' }}>KETERANGAN / URAIAN</th>
                  <th style={{ padding: '5px 6px', textAlign: 'right', width: 110 }}>JUMLAH (RP)</th>
                </tr>
              </thead>
              <tbody>
                {(activeProgram.transactions || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 12, color: '#94a3b8' }}>
                      Belum ada catatan mutasi transaksi kas pada program ini.
                    </td>
                  </tr>
                ) : (
                  (activeProgram.transactions || []).map((t, idx) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '5px 6px', color: '#334155' }}>{t.date}</td>
                      <td
                        style={{
                          padding: '5px 6px',
                          fontWeight: 700,
                          color: t.type === 'IN' ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {t.type === 'IN' ? 'PEMASUKAN' : 'PENGELUARAN'}
                      </td>
                      <td style={{ padding: '5px 6px', fontWeight: 600 }}>{t.category}</td>
                      <td style={{ padding: '5px 6px', color: '#334155' }}>{t.description || '-'}</td>
                      <td
                        style={{
                          padding: '5px 6px',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: t.type === 'IN' ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {t.type === 'IN' ? `+ ${formatRupiah(t.amount)}` : `- ${formatRupiah(t.amount)}`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 800 }}>
                  <td colSpan={5} style={{ padding: '6px 8px', textAlign: 'right' }}>
                    SISA SALDO KAS PROGRAM:
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#0f172a' }}>
                    {formatRupiah(Number(activeProgram.cash_balance))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* FOOTER HALAMAN 1 */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 10,
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 8.5,
            color: '#64748b',
          }}
        >
          <span>Yayasan Global Mission House (GMH PA KMK) • Sistem Informasi Manajemen Terpadu</span>
          <span>Dokumen Resmi LPJ • Halaman 1 dari 2</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LEMBAR 2: RUNDOWN, TUGAS, SUSUNAN PANITIA & LEMBAR PENGESAHAN            */}
      {/* ========================================================================= */}
      <div
        className="pdf-page"
        style={{
          width: 794,
          minHeight: 1120,
          boxSizing: 'border-box',
          padding: '24px 32px',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pageBreakAfter: 'always',
          breakAfter: 'page',
        }}
      >
        <div>
          {/* 1. KOP SURAT FORMAL YAYASAN (HALAMAN 2) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 10,
              borderBottom: '3px double #0f172a',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src="/logo-yayasan.png"
                alt="Logo Yayasan GMH"
                style={{
                  width: 52,
                  height: 52,
                  objectFit: 'contain',
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    color: '#1b4332',
                  }}
                >
                  YAYASAN GLOBAL MISSION HOUSE (GMH PA KMK)
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: 0.3 }}>
                  BADAN PENGURUS PELAYANAN PROGRAM &amp; PERSEKUTUAN ALUMNI
                </div>
                <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2 }}>
                  Sekretariat: Jl. PA KMK No. 12, Medan • Email: info@gmhpakmk.org • Website: www.gmhpakmk.org
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                KODE DOKUMEN LPJ
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, fontFamily: 'monospace' }}>
                LPJ/GMH-PROG/{activeProgram.id.slice(0, 12)}
              </div>
              <div style={{ fontSize: 8.5, color: '#64748b', marginTop: 2 }}>
                Tgl Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: '#047857', marginTop: 2 }}>
                Halaman 2 dari 2
              </div>
            </div>
          </div>

          {/* SUB-HEADER LAMPIRAN */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
              padding: '6px 12px',
              borderRadius: 4,
              border: '1px solid #e2e8f0',
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b' }}>
              LAMPIRAN RESMI LPJ: {activeProgram.program_title.toUpperCase()}
            </div>
            <div style={{ fontSize: 9, color: '#64748b' }}>
              Lembar Pelaksanaan Agenda, Checklist Tugas &amp; Pengesahan
            </div>
          </div>
          <div style={{ marginBottom: 18, pageBreakInside: 'avoid' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: 4,
                marginBottom: 6,
                color: '#1e293b',
              }}
            >
              IV. Agenda Rundown Acara
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '5px 6px', textAlign: 'center', width: 35 }}>NO</th>
                  <th style={{ padding: '5px 6px', textAlign: 'left', width: 120 }}>WAKTU</th>
                  <th style={{ padding: '5px 6px', textAlign: 'left', width: 170 }}>PENANGGUNG JAWAB (PIC)</th>
                  <th style={{ padding: '5px 6px', textAlign: 'left' }}>URAIAN AGENDA ACARA</th>
                </tr>
              </thead>
              <tbody>
                {(activeProgram.rundown || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '8px 6px', textAlign: 'center', color: '#94a3b8' }}>
                      Belum ada agenda rundown yang dicatat.
                    </td>
                  </tr>
                ) : (
                  (activeProgram.rundown || []).map((rd, idx) => (
                    <tr key={rd.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '5px 6px', fontWeight: 600 }}>{rd.time}</td>
                      <td style={{ padding: '5px 6px', color: '#334155' }}>{rd.pic}</td>
                      <td style={{ padding: '5px 6px' }}>{rd.note}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 7. TUGAS PERSIAPAN KEGIATAN (Checklist) */}
          <div style={{ marginBottom: 18, pageBreakInside: 'avoid' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: 4,
                marginBottom: 6,
                color: '#1e293b',
              }}
            >
              V. Daftar Tugas Persiapan Kegiatan &amp; Estimasi Biaya (Checklist)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '5px 6px', textAlign: 'center', width: 35 }}>NO</th>
                  <th style={{ padding: '5px 6px', textAlign: 'left' }}>URAIAN TUGAS PERSIAPAN</th>
                  <th style={{ padding: '5px 6px', textAlign: 'left', width: 140 }}>PENANGGUNG JAWAB (PIC)</th>
                  <th style={{ padding: '5px 6px', textAlign: 'right', width: 120 }}>ESTIMASI BIAYA (RP)</th>
                  <th style={{ padding: '5px 6px', textAlign: 'center', width: 110 }}>STATUS REALISASI</th>
                </tr>
              </thead>
              <tbody>
                {(activeProgram.tasks || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '8px 6px', textAlign: 'center', color: '#94a3b8' }}>
                      Belum ada tugas persiapan yang dicatat.
                    </td>
                  </tr>
                ) : (
                  (activeProgram.tasks || []).map((tsk, idx) => (
                    <tr key={tsk.id} style={{ borderBottom: '1px solid #e2e8f0', background: tsk.done ? '#fcfdfd' : '#ffffff' }}>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '5px 6px', fontWeight: tsk.done ? 400 : 600 }}>
                        {tsk.task}
                      </td>
                      <td style={{ padding: '5px 6px', color: '#334155' }}>{tsk.pic}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600, color: tsk.estimated_cost ? '#0f172a' : '#94a3b8' }}>
                        {tsk.estimated_cost ? formatRupiah(Number(tsk.estimated_cost)) : '-'}
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 8.5,
                            fontWeight: 700,
                            letterSpacing: 0.3,
                            background: tsk.done ? '#dcfce7' : '#fef3c7',
                            color: tsk.done ? '#15803d' : '#b45309',
                            border: `1px solid ${tsk.done ? '#86efac' : '#fde68a'}`,
                          }}
                        >
                          {tsk.done ? '✓ SELESAI' : '⏳ DALAM PROSES'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {(activeProgram.tasks || []).length > 0 && (() => {
                const totalTskCost = (activeProgram.tasks || []).reduce(
                  (sum, t) => sum + (Number(t.estimated_cost) || 0),
                  0
                );
                return (
                  <tfoot>
                    <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1' }}>
                      <td colSpan={3} style={{ padding: '6px', textAlign: 'right', fontWeight: 800 }}>
                        TOTAL ESTIMASI BIAYA PERSIAPAN:
                      </td>
                      <td style={{ padding: '6px', textAlign: 'right', fontWeight: 800, color: '#047857' }}>
                        {formatRupiah(totalTskCost)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                );
              })()}
            </table>
          </div>

          {/* 8. SUSUNAN PANITIA & PELAYAN */}
          <div style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: 4,
                marginBottom: 6,
                color: '#1e293b',
              }}
            >
              VI. Susunan Panitia &amp; Tim Pelayan Program
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '5px 6px', textAlign: 'center', width: 35 }}>NO</th>
                  <th style={{ padding: '5px 6px', textAlign: 'left', width: 220 }}>PERAN / SEKSI / JABATAN</th>
                  <th style={{ padding: '5px 6px', textAlign: 'left' }}>NAMA PELAYAN / ANGGOTA</th>
                  <th style={{ padding: '5px 6px', textAlign: 'left', width: 170 }}>KONTAK / KETERANGAN</th>
                </tr>
              </thead>
              <tbody>
                {(activeProgram.committees || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '8px 6px', textAlign: 'center', color: '#94a3b8' }}>
                      Belum ada struktur panitia/pelayan yang dicatat.
                    </td>
                  </tr>
                ) : (
                  (activeProgram.committees || []).map((com, idx) => (
                    <tr key={com.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '5px 6px', fontWeight: 600 }}>{com.role}</td>
                      <td style={{ padding: '5px 6px', fontWeight: 500, color: '#1e293b' }}>{com.name}</td>
                      <td style={{ padding: '5px 6px', color: '#475569' }}>{com.contact || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 9. LEMBAR PENGESAHAN & TANDA TANGAN */}
          <div
            className="signature-section print-avoid-break"
            style={{
              marginTop: 36,
              paddingTop: 22,
              borderTop: '1px dashed #94a3b8',
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
            }}
          >
            <table
              style={{
                width: '100%',
                fontSize: 10,
              }}
            >
              <tbody>
                <tr>
                  {/* Kolom Kiri: Pelaksana Teknis / Pembuat Laporan */}
                  <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', paddingBottom: 65 }}>
                    <div style={{ fontWeight: 600, color: '#334155', lineHeight: 1.5 }}>
                      Kordinator / Panitia Program,
                    </div>
                  </td>

                  {/* Kolom Kanan: Pengesah / Pimpinan Yayasan */}
                  <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top', paddingBottom: 65 }}>
                    <div style={{ color: '#475569', marginBottom: 4 }}>
                      Medan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ fontWeight: 600, color: '#334155', lineHeight: 1.5 }}>
                      Mengetahui,<br />
                      <strong>Ketua Yayasan GMH PA KMK</strong>
                    </div>
                  </td>
                </tr>

                <tr>
                  {/* Nama Kordinator */}
                  <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'bottom' }}>
                    <strong style={{ borderBottom: '1px solid #0f172a', paddingBottom: 4, display: 'inline-block', minWidth: 200 }}>
                      {activeProgram.speaker_name || 'Kordinator Program'}
                    </strong>
                  </td>

                  {/* Nama Ketua Yayasan */}
                  <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'bottom' }}>
                    <strong style={{ borderBottom: '1px solid #0f172a', paddingBottom: 4, display: 'inline-block', minWidth: 200 }}>
                      BPH Yayasan GMH PA KMK
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER HALAMAN 2 */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 10,
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 8.5,
            color: '#64748b',
          }}
        >
          <span>Yayasan Global Mission House (GMH PA KMK) • Sistem Informasi Manajemen Terpadu</span>
          <span>Dokumen Resmi LPJ • Halaman 2 dari 2</span>
        </div>
      </div>
    </div>
  );
};

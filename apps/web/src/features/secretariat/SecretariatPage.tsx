import React, { useState, useEffect, useCallback } from 'react';
import {
  Send,
  Inbox,
  Search,
  Printer,
  Edit3,
  Trash2,
  CheckCircle,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  RefreshCw,
  Clock,
  X,
  FileCheck,
  Copy,
  Check,
  FileText,
  ExternalLink,
  Download,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Pagination } from '../../components/common/Pagination';

interface OutgoingLetter {
  id: string;
  letter_number: string;
  category_code: string;
  category_label: string;
  letter_date: string;
  subject: string;
  recipient: string;
  recipient_address?: string;
  signer_name: string;
  signer_position?: string;
  attachment_count: string;
  content_summary?: string;
  file_url?: string;
  status: string;
  created_at: string;
}

interface IncomingLetter {
  id: string;
  agenda_number: string;
  sender_letter_number: string;
  sender_name: string;
  sender_institution?: string;
  subject: string;
  letter_date: string;
  received_date: string;
  disposition_to?: string;
  disposition_notes?: string;
  status: string;
  file_url?: string;
  created_at: string;
}

interface StatsData {
  outgoing: { total: number; thisYear: number; drafts: number };
  incoming: { total: number; thisYear: number; pendingDisposition: number };
}

export const SecretariatPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');
  const [stats, setStats] = useState<StatsData>({
    outgoing: { total: 0, thisYear: 0, drafts: 0 },
    incoming: { total: 0, thisYear: 0, pendingDisposition: 0 },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Setup / Categories from system_lookups
  const [categories, setCategories] = useState<Array<{ id: string; code: string; label: string }>>([]);
  const [numberingPattern, setNumberingPattern] = useState('{NOMOR}/{PREFIX}/{CATEGORY}/{ROMAN_MONTH}/{YEAR}');

  // --- OUTGOING LETTERS STATE ---
  const [outgoingLetters, setOutgoingLetters] = useState<OutgoingLetter[]>([]);
  const [outgoingSearch, setOutgoingSearch] = useState('');
  const [outgoingCategoryFilter, setOutgoingCategoryFilter] = useState('');
  const [outgoingStatusFilter, setOutgoingStatusFilter] = useState('');
  const [outgoingPage, setOutgoingPage] = useState(1);
  const [outgoingPageSize, setOutgoingPageSize] = useState(10);
  const [outgoingTotal, setOutgoingTotal] = useState(0);

  // Modal Create Outgoing
  const [showCreateOutgoingModal, setShowCreateOutgoingModal] = useState(false);
  const [isAutoNumber, setIsAutoNumber] = useState(true);
  const [generatedPreviewNumber, setGeneratedPreviewNumber] = useState('');
  const [outgoingFormData, setOutgoingFormData] = useState({
    letter_number: '',
    category_code: 'SK',
    category_label: 'Surat Keputusan (SK)',
    letter_date: new Date().toISOString().split('T')[0],
    subject: '',
    recipient: '',
    recipient_address: '',
    signer_name: 'dr. Budi Setiawan, Sp.B',
    signer_position: 'Ketua Umum Pengurus Yayasan',
    attachment_count: '-',
    content_summary: '',
    file_url: '',
    status: 'TERKIRIM',
  });

  // Modal View/Print Outgoing
  const [previewOutgoing, setPreviewOutgoing] = useState<OutgoingLetter | null>(null);

  // Modal Edit Outgoing
  const [editingOutgoing, setEditingOutgoing] = useState<OutgoingLetter | null>(null);

  // --- INCOMING LETTERS STATE ---
  const [incomingLetters, setIncomingLetters] = useState<IncomingLetter[]>([]);
  const [incomingSearch, setIncomingSearch] = useState('');
  const [incomingStatusFilter, setIncomingStatusFilter] = useState('');
  const [incomingDispositionFilter, setIncomingDispositionFilter] = useState('');
  const [incomingPage, setIncomingPage] = useState(1);
  const [incomingPageSize, setIncomingPageSize] = useState(10);
  const [incomingTotal, setIncomingTotal] = useState(0);

  // Modal Create Incoming
  const [showCreateIncomingModal, setShowCreateIncomingModal] = useState(false);
  const [incomingFormData, setIncomingFormData] = useState({
    agenda_number: '',
    sender_letter_number: '',
    sender_name: '',
    sender_institution: '',
    subject: '',
    letter_date: new Date().toISOString().split('T')[0],
    received_date: new Date().toISOString().split('T')[0],
    disposition_to: 'Ketua Umum Pengurus Harian',
    disposition_notes: '',
    status: 'DITERIMA',
    file_url: '',
  });

  // Modal View/Print Disposition
  const [previewIncoming, setPreviewIncoming] = useState<IncomingLetter | null>(null);

  // Modal Edit Incoming
  const [editingIncoming, setEditingIncoming] = useState<IncomingLetter | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // 1. Fetch Stats & Numbering Config
  const loadStatsAndConfig = useCallback(async () => {
    try {
      const [statsRes, configRes] = await Promise.all([
        api.secretariat.getStats(),
        api.secretariat.getNumberingConfig(),
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (configRes?.categories) setCategories(configRes.categories);
      if (configRes?.config?.pattern) setNumberingPattern(configRes.config.pattern);
    } catch (err: any) {
      console.error('Failed to load stats/config', err);
    }
  }, []);

  // 2. Fetch Outgoing Letters
  const loadOutgoing = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.secretariat.getOutgoing({
        search: outgoingSearch,
        category: outgoingCategoryFilter,
        status: outgoingStatusFilter,
        page: outgoingPage,
        limit: outgoingPageSize,
      });

      if (res?.success) {
        setOutgoingLetters(res.letters || []);
        setOutgoingTotal(res.meta?.total || 0);
      }
    } catch (err: any) {
      showToast('Gagal memuat surat keluar: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [outgoingSearch, outgoingCategoryFilter, outgoingStatusFilter, outgoingPage, outgoingPageSize]);

  // 3. Fetch Incoming Letters
  const loadIncoming = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.secretariat.getIncoming({
        search: incomingSearch,
        status: incomingStatusFilter,
        disposition_to: incomingDispositionFilter,
        page: incomingPage,
        limit: incomingPageSize,
      });

      if (res?.success) {
        setIncomingLetters(res.letters || []);
        setIncomingTotal(res.meta?.total || 0);
      }
    } catch (err: any) {
      showToast('Gagal memuat surat masuk: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [incomingSearch, incomingStatusFilter, incomingDispositionFilter, incomingPage, incomingPageSize]);

  useEffect(() => {
    loadStatsAndConfig();
  }, [loadStatsAndConfig]);

  useEffect(() => {
    if (activeTab === 'outgoing') {
      loadOutgoing();
    } else {
      loadIncoming();
    }
  }, [activeTab, loadOutgoing, loadIncoming]);

  // Recalculate auto-generated number preview whenever category or date changes
  useEffect(() => {
    if (showCreateOutgoingModal && isAutoNumber) {
      api.secretariat
        .getNextNumber(outgoingFormData.category_code, outgoingFormData.letter_date)
        .then((res) => {
          if (res?.nextNumber) {
            setGeneratedPreviewNumber(res.nextNumber);
          }
        })
        .catch(console.error);
    }
  }, [showCreateOutgoingModal, isAutoNumber, outgoingFormData.category_code, outgoingFormData.letter_date]);

  // Handle Create Outgoing Submit
  const handleCreateOutgoing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outgoingFormData.subject.trim() || !outgoingFormData.recipient.trim() || !outgoingFormData.signer_name.trim()) {
      showToast('Perihal, Tujuan/Penerima, dan Penandatangan wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...outgoingFormData,
        letter_number: isAutoNumber ? 'AUTO' : outgoingFormData.letter_number,
      };

      const res = await api.secretariat.createOutgoing(payload);
      if (res.success) {
        showToast(res.message || 'Surat keluar berhasil dibuat!');
        setShowCreateOutgoingModal(false);
        if (res.letter) {
          setPreviewOutgoing(res.letter);
        }
        // Reset form
        setOutgoingFormData({
          letter_number: '',
          category_code: 'SK',
          category_label: 'Surat Keputusan (SK)',
          letter_date: new Date().toISOString().split('T')[0],
          subject: '',
          recipient: '',
          recipient_address: '',
          signer_name: 'dr. Budi Setiawan, Sp.B',
          signer_position: 'Ketua Umum Pengurus Yayasan',
          attachment_count: '-',
          content_summary: '',
          file_url: '',
          status: 'TERKIRIM',
        });
        setIsAutoNumber(true);
        loadOutgoing();
        loadStatsAndConfig();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat surat keluar.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Update Outgoing
  const handleUpdateOutgoing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOutgoing) return;

    setIsSubmitting(true);
    try {
      const res = await api.secretariat.updateOutgoing(editingOutgoing.id, editingOutgoing);
      if (res.success) {
        showToast('Data surat keluar berhasil diperbarui!');
        setEditingOutgoing(null);
        loadOutgoing();
        loadStatsAndConfig();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui surat keluar.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Status Change for Outgoing Letters (Draft, Send, Arrived, Diarsipkan)
  const handleUpdateLetterStatus = async (letter: OutgoingLetter, newStatus: string) => {
    try {
      const res = await api.secretariat.updateOutgoing(letter.id, {
        status: newStatus,
      });
      if (res.success) {
        showToast(`Status surat ${letter.letter_number} diubah menjadi ${newStatus}`);
        setOutgoingLetters((prev) =>
          prev.map((item) => (item.id === letter.id ? { ...item, status: newStatus } : item))
        );
        loadStatsAndConfig();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status surat.', 'error');
    }
  };

  // Handle Delete Outgoing
  const handleDeleteOutgoing = async (letter: OutgoingLetter) => {
    if (!window.confirm(`Hapus surat keluar "${letter.letter_number}" (${letter.subject})?`)) return;

    try {
      const res = await api.secretariat.deleteOutgoing(letter.id);
      if (res.success) {
        showToast(res.message);
        loadOutgoing();
        loadStatsAndConfig();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus surat keluar.', 'error');
    }
  };

  // Handle Create Incoming Submit
  const handleCreateIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomingFormData.sender_letter_number.trim() || !incomingFormData.sender_name.trim() || !incomingFormData.subject.trim()) {
      showToast('Nomor Surat Asal, Pengirim, dan Perihal wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...incomingFormData,
        agenda_number: incomingFormData.agenda_number.trim() || 'AUTO',
      };

      const res = await api.secretariat.createIncoming(payload);
      if (res.success) {
        showToast(res.message || 'Surat masuk berhasil dicatat!');
        setShowCreateIncomingModal(false);
        // Reset form
        setIncomingFormData({
          agenda_number: '',
          sender_letter_number: '',
          sender_name: '',
          sender_institution: '',
          subject: '',
          letter_date: new Date().toISOString().split('T')[0],
          received_date: new Date().toISOString().split('T')[0],
          disposition_to: 'Ketua Umum Pengurus Harian',
          disposition_notes: '',
          status: 'DITERIMA',
          file_url: '',
        });
        loadIncoming();
        loadStatsAndConfig();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal mencatat surat masuk.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Update Incoming
  const handleUpdateIncoming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncoming) return;

    setIsSubmitting(true);
    try {
      const res = await api.secretariat.updateIncoming(editingIncoming.id, editingIncoming);
      if (res.success) {
        showToast('Data surat masuk berhasil diperbarui!');
        setEditingIncoming(null);
        loadIncoming();
        loadStatsAndConfig();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui surat masuk.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Incoming
  const handleDeleteIncoming = async (letter: IncomingLetter) => {
    if (!window.confirm(`Hapus surat masuk "${letter.agenda_number}" (${letter.sender_letter_number})?`)) return;

    try {
      const res = await api.secretariat.deleteIncoming(letter.id);
      if (res.success) {
        showToast(res.message);
        loadIncoming();
        loadStatsAndConfig();
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus surat masuk.', 'error');
    }
  };

  // Helper date formatter
  const formatDateID = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // State & helpers for copying data and Word (.doc) export
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Helper to construct concise file title from "tujuan surat" (subject) and "kepada tujuan" (recipient)
  const getLetterFileTitle = (letter: OutgoingLetter) => {
    const sanitize = (text?: string, maxLen = 30) => {
      if (!text) return '';
      const clean = text
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (clean.length <= maxLen) return clean;
      const truncated = clean.slice(0, maxLen);
      const lastSpace = truncated.lastIndexOf(' ');
      return (lastSpace > 14 ? truncated.slice(0, lastSpace) : truncated).trim();
    };

    const subjectPart = sanitize(letter.subject, 32) || 'Surat Keluar';
    const recipientPart = sanitize(letter.recipient, 28);

    if (recipientPart) {
      return `${subjectPart} - ${recipientPart}`;
    }
    return subjectPart;
  };

  const downloadWordDraft = (letter: OutgoingLetter) => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${letter.subject}</title>
        <style>
          body { font-family: 'Calibri', 'Times New Roman', serif; font-size: 11pt; color: #000000; line-height: 1.5; margin: 2.5cm; }
          .kop { text-align: center; border-bottom: 3px double #000000; padding-bottom: 12px; margin-bottom: 24px; }
          .kop-title { font-size: 15pt; font-weight: bold; }
          .kop-sub { font-size: 12pt; font-weight: bold; color: #047857; }
          .kop-info { font-size: 9pt; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt; }
          td { vertical-align: top; padding: 2px 0; }
          .content { margin-top: 20px; min-height: 150px; text-align: justify; }
          .signature { margin-top: 40px; float: right; width: 280px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="kop">
          <div class="kop-title">YAYASAN GLOBAL MISSION HOUSE</div>
          <div class="kop-sub">PERSEKUTUAN ALUMNI KMK USU (GMH PA KMK)</div>
          <div class="kop-info">SK Kemenkumham RI No. AHU-0012345.AH.01.04.Tahun 2024 · NPWP: 98.765.432.1-123.000</div>
          <div class="kop-info">Sekretariat: Jl. Harmonika Baru No. 12, Medan 20132 · Email: sekretariat@gmhpakmk.org</div>
        </div>

        <table>
          <tr>
            <td style="width: 80px;"><b>Nomor</b></td>
            <td style="width: 15px;">:</td>
            <td><b>${letter.letter_number}</b></td>
            <td style="text-align: right;">Medan, ${formatDateID(letter.letter_date)}</td>
          </tr>
          <tr>
            <td><b>Lampiran</b></td>
            <td>:</td>
            <td>${letter.attachment_count || '-'}</td>
            <td></td>
          </tr>
          <tr>
            <td><b>Perihal</b></td>
            <td>:</td>
            <td><b>${letter.subject}</b></td>
            <td></td>
          </tr>
        </table>

        <div style="margin-top: 15px;">
          <div>Kepada Yth.</div>
          <div><b>${letter.recipient}</b></div>
          ${letter.recipient_address ? `<div>${letter.recipient_address}</div>` : ''}
        </div>

        <div class="content">
          <p>Dengan hormat,</p>
          <p style="text-indent: 35px;">
            ${letter.content_summary || 'Tuliskan naskah isi surat lengkap di sini...'}
          </p>
          <p>Demikian surat ini kami sampaikan, atas perhatian dan kerjasama yang baik kami ucapkan terima kasih.</p>
        </div>

        <div class="signature">
          <div>Pengurus Yayasan Global Mission House,</div>
          <br/><br/><br/>
          <div><u><b>${letter.signer_name}</b></u></div>
          <div>${letter.signer_position || 'Ketua Umum Pengurus Yayasan'}</div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileTitle = getLetterFileTitle(letter);
    const safeFilename = `${fileTitle}.doc`;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
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

  return (
    <div className="secretariat-page">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`alert ${toastMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`}
          style={{ marginBottom: 16 }}
        >
          {toastMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header & Stats Cards */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h2>Sekretariat & Tata Kelola Persuratan Yayasan</h2>
          <p>
            Penerbitan surat keluar dengan formula penomoran otomatis dinamis, pencatatan surat masuk, dan lembar disposisi resmi GMH PA KMK.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            to="/utility"
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            title="Konfigurasi formula penomoran surat di Sistem Utility"
          >
            <SlidersHorizontal size={14} /> Setup Penomoran di Utility
          </Link>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setShowCreateOutgoingModal(true);
              setIsAutoNumber(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#047857',
              color: '#ffffff',
              border: 'none',
              padding: '7px 15px',
              fontWeight: 650,
              fontSize: 12.5,
              borderRadius: 8,
              boxShadow: '0 2px 6px rgba(4, 120, 87, 0.25)',
              cursor: 'pointer',
            }}
          >
            <Send size={14} /> Buat Surat Keluar
          </button>
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
              padding: '7px 15px',
              fontWeight: 650,
              fontSize: 12.5,
              borderRadius: 8,
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
              cursor: 'pointer',
            }}
          >
            <Inbox size={14} /> Catat Surat Masuk
          </button>
        </div>
      </div>

      {/* Stat Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Total Surat Keluar</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gmh-text)' }}>
              {stats.outgoing.total}{' '}
              <span style={{ fontSize: 12, fontWeight: 500, color: '#2563eb' }}>
                ({stats.outgoing.thisYear} tahun ini)
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              Formula Aktif: <code style={{ fontSize: 10.5 }}>{numberingPattern}</code>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Inbox size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Total Surat Masuk</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gmh-text)' }}>
              {stats.incoming.total}{' '}
              <span style={{ fontSize: 12, fontWeight: 500, color: '#16a34a' }}>
                ({stats.incoming.thisYear} tahun ini)
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              Format Agenda: <code>AG-YYYY-XXXX</code>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#fffbeb',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', fontWeight: 600 }}>Perlu Tindak Lanjut</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#d97706' }}>
              {stats.incoming.pendingDisposition}{' '}
              <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>surat masuk</span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              Menunggu / sedang dalam proses disposisi
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--gmh-border)', marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('outgoing')}
          className="btn"
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'outgoing' ? '3px solid var(--gmh-green)' : '3px solid transparent',
            color: activeTab === 'outgoing' ? 'var(--gmh-green)' : 'var(--gmh-text-muted)',
            fontWeight: 700,
            fontSize: 14,
            padding: '10px 18px',
            borderRadius: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <Send size={16} /> 1. Surat Keluar ({stats.outgoing.total})
        </button>

        <button
          onClick={() => setActiveTab('incoming')}
          className="btn"
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'incoming' ? '3px solid var(--gmh-green)' : '3px solid transparent',
            color: activeTab === 'incoming' ? 'var(--gmh-green)' : 'var(--gmh-text-muted)',
            fontWeight: 700,
            fontSize: 14,
            padding: '10px 18px',
            borderRadius: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <Inbox size={16} /> 2. Data Surat Masuk ({stats.incoming.total})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SURAT KELUAR */}
      {/* ========================================================================= */}
      {activeTab === 'outgoing' && (
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
                          onChange={(e) => handleUpdateLetterStatus(letter, e.target.value)}
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
                            onClick={() => handleDeleteOutgoing(letter)}
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
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DATA SURAT MASUK */}
      {/* ========================================================================= */}
      {activeTab === 'incoming' && (
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
                      <td>{getStatusBadge(letter.status)}</td>
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
                            onClick={() => handleDeleteIncoming(letter)}
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
      )}

      {/* ========================================================================= */}
      {/* MODAL: BUAT SURAT KELUAR */}
      {/* ========================================================================= */}
      {showCreateOutgoingModal && (
        <div className="modal-backdrop">
          <div className="modal modal-card" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Send size={18} color="var(--gmh-green)" />
                <div style={{ fontWeight: 700, fontSize: 16 }}>Formulir Buat Surat Keluar Yayasan</div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowCreateOutgoingModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOutgoing}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Auto Numbering Banner */}
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 8,
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#166534', fontSize: 13 }}>
                      <CheckCircle size={15} /> Penomoran Otomatis Dinamis (Sistem Utility)
                    </div>
                    <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#166534' }}>
                      <input
                        type="checkbox"
                        checked={!isAutoNumber}
                        onChange={(e) => setIsAutoNumber(!e.target.checked)}
                      />
                      Edit manual nomor
                    </label>
                  </div>

                  {isAutoNumber ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#166534' }}>Nomor Surat yang akan diterbitkan:</span>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: 14,
                          color: '#15803d',
                          background: '#ffffff',
                          padding: '3px 10px',
                          borderRadius: 4,
                          border: '1px solid #86efac',
                        }}
                      >
                        {generatedPreviewNumber || 'Menghitung nomor surat...'}
                      </span>
                    </div>
                  ) : (
                    <div style={{ marginTop: 4 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ketik nomor surat manual..."
                        value={outgoingFormData.letter_number}
                        onChange={(e) => setOutgoingFormData({ ...outgoingFormData, letter_number: e.target.value })}
                        required={!isAutoNumber}
                        style={{ fontFamily: 'monospace', fontWeight: 600 }}
                      />
                    </div>
                  )}
                </div>

                {/* Grid Category & Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Klasifikasi Jenis Surat *</label>
                    <select
                      className="form-select"
                      value={outgoingFormData.category_code}
                      onChange={(e) => {
                        const selected = categories.find((c) => c.code === e.target.value);
                        setOutgoingFormData({
                          ...outgoingFormData,
                          category_code: e.target.value,
                          category_label: selected?.label || e.target.value,
                        });
                      }}
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id || c.code} value={c.code}>
                          {c.code} - {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Tanggal Surat *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={outgoingFormData.letter_date}
                      onChange={(e) => setOutgoingFormData({ ...outgoingFormData, letter_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Perihal / Hal Surat *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Undangan Rapat Evaluasi Proyek Rumah Persekutuan"
                    value={outgoingFormData.subject}
                    onChange={(e) => setOutgoingFormData({ ...outgoingFormData, subject: e.target.value })}
                    required
                  />
                </div>

                {/* Recipient & Address */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Kepada Yth. (Tujuan / Penerima) *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nama Instansi, Pejabat, atau Anggota"
                      value={outgoingFormData.recipient}
                      onChange={(e) => setOutgoingFormData({ ...outgoingFormData, recipient: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Alamat / Kota Penerima</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Medan / Jl. Balai Kota No. 1"
                      value={outgoingFormData.recipient_address}
                      onChange={(e) => setOutgoingFormData({ ...outgoingFormData, recipient_address: e.target.value })}
                    />
                  </div>
                </div>

                {/* Signer Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Nama Penandatangan *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={outgoingFormData.signer_name}
                      onChange={(e) => setOutgoingFormData({ ...outgoingFormData, signer_name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Jabatan Penandatangan</label>
                    <input
                      type="text"
                      className="form-input"
                      value={outgoingFormData.signer_position}
                      onChange={(e) => setOutgoingFormData({ ...outgoingFormData, signer_position: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Lampiran</label>
                    <input
                      type="text"
                      className="form-input"
                      value={outgoingFormData.attachment_count}
                      onChange={(e) => setOutgoingFormData({ ...outgoingFormData, attachment_count: e.target.value })}
                      placeholder="-"
                    />
                  </div>
                </div>

                {/* Content Summary */}
                <div>
                  <label className="form-label">Ringkasan Isi / Keterangan Surat</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Tuliskan intisari pokok surat atau keterangan arsip sekretariat..."
                    value={outgoingFormData.content_summary}
                    onChange={(e) => setOutgoingFormData({ ...outgoingFormData, content_summary: e.target.value })}
                  />
                </div>

                {/* Status & File URL */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Status Penerbitan</label>
                    <select
                      className="form-select"
                      value={outgoingFormData.status}
                      onChange={(e) => setOutgoingFormData({ ...outgoingFormData, status: e.target.value })}
                    >
                      <option value="TERKIRIM">Send (Terkirim)</option>
                      <option value="DRAFT">Draft</option>
                      <option value="DITERIMA">Arrived (Diterima)</option>
                      <option value="DIARSIPKAN">Diarsipkan</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Tautan Dokumen / Scan Surat (Opsional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://... atau nomor rak arsip"
                      value={outgoingFormData.file_url}
                      onChange={(e) => setOutgoingFormData({ ...outgoingFormData, file_url: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--gmh-border)', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCreateOutgoingModal(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Send size={15} /> {isSubmitting ? 'Menerbitkan...' : 'Simpan & Terbitkan Surat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INFORMASI SURAT KELUAR & PANDUAN DOKUMEN (WORD / GOOGLE DOCS) */}
      {/* ========================================================================= */}
      {previewOutgoing && (
        <div className="modal-backdrop">
          <div
            className="modal modal-card"
            style={{
              maxWidth: 720,
              maxHeight: '92vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={18} color="var(--gmh-green)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Informasi Surat Keluar & Nomor Resmi</div>
                  <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)', fontWeight: 400 }}>
                    Nomor surat resmi yayasan telah diterbitkan & tercatat di database
                  </div>
                </div>
              </div>
              <button type="button" className="btn-icon" onClick={() => setPreviewOutgoing(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Hero Banner: Nomor Surat Resmi */}
              <div
                style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 12,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Nomor Surat Resmi yang Diterbitkan:
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0284c7', fontFamily: 'monospace', marginTop: 4 }}>
                    {previewOutgoing.letter_number}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>
                    Klasifikasi: <strong>{previewOutgoing.category_label || previewOutgoing.category_code}</strong> · Tanggal:{' '}
                    <strong>{formatDateID(previewOutgoing.letter_date)}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleCopyText(previewOutgoing.letter_number, 'number')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: copiedField === 'number' ? '#ecfdf5' : '#ffffff',
                    borderColor: copiedField === 'number' ? '#10b981' : '#0284c7',
                    color: copiedField === 'number' ? '#047857' : '#0284c7',
                    fontWeight: 600,
                    fontSize: 12.5,
                    padding: '8px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                  title="Salin nomor surat ke clipboard"
                >
                  {copiedField === 'number' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedField === 'number' ? 'Nomor Tersalin!' : 'Salin Nomor'}
                </button>
              </div>

              {/* Panduan Arahkan Buka di Word / Google Docs */}
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <FileText size={20} color="#b45309" style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ fontSize: 12.5, color: '#92400e', lineHeight: 1.55 }}>
                  <strong>Lanjutkan Penulisan Naskah Surat:</strong>
                  <br />
                  Sistem telah mencatat nomor surat dan metadata arsip di database. Untuk menyusun naskah surat lengkap, penataan paragraf, dan cetak kop surat, silakan buka atau salin ke pengolah kata pilihan Anda:
                </div>
              </div>

              {/* Info Judul File Otomatis */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '9px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  fontSize: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                  <span style={{ color: '#64748b', whiteSpace: 'nowrap' }}>Judul File Dokumen:</span>
                  <strong style={{ color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {getLetterFileTitle(previewOutgoing)}
                  </strong>
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>.doc / Google Docs</span>
              </div>

              {/* Action Buttons: Word Desktop, Google Docs, Salin Judul File */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => downloadWordDraft(previewOutgoing)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: 12.5,
                    padding: '10px 14px',
                    fontWeight: 600,
                    borderRadius: 8,
                  }}
                  title="Download template file Word (.doc) menggunakan judul tujuan surat & kepada untuk diedit di desktop"
                >
                  <Download size={15} /> Buka / Unduh di Word (.doc)
                </button>

                <a
                  href={`https://docs.new?title=${encodeURIComponent(getLetterFileTitle(previewOutgoing))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: 12.5,
                    padding: '10px 14px',
                    fontWeight: 600,
                    borderColor: '#4285F4',
                    color: '#1a73e8',
                    background: '#f8fafd',
                    textDecoration: 'none',
                    borderRadius: 8,
                  }}
                  title="Buka dokumen baru di Google Docs dengan judul tujuan surat & kepada"
                >
                  <ExternalLink size={15} color="#4285F4" /> Buka Google Docs (Baru)
                </a>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleCopyText(getLetterFileTitle(previewOutgoing), 'title')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontSize: 12.5,
                    padding: '10px 14px',
                    fontWeight: 600,
                    borderColor: copiedField === 'title' ? '#10b981' : 'var(--gmh-border)',
                    color: copiedField === 'title' ? '#047857' : 'var(--gmh-text)',
                    borderRadius: 8,
                  }}
                  title="Salin judul file dokumen (perihal surat & tujuan penerima) ke clipboard"
                >
                  {copiedField === 'title' ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                  {copiedField === 'title' ? 'Judul File Tersalin!' : 'Salin Judul File'}
                </button>
              </div>

              {/* Metadata Informasi Terdaftar */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '16px 18px',
                }}
              >
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 12 }}>
                  Ringkasan Informasi yang Tercatat:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px 20px', fontSize: 12.5 }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 11.5 }}>Perihal / Hal Surat:</span>
                    <div style={{ fontWeight: 650, color: '#0f172a', marginTop: 2 }}>{previewOutgoing.subject}</div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', fontSize: 11.5 }}>Kepada Yth. (Tujuan / Penerima):</span>
                    <div style={{ fontWeight: 650, color: '#0f172a', marginTop: 2 }}>{previewOutgoing.recipient}</div>
                    {previewOutgoing.recipient_address && (
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>{previewOutgoing.recipient_address}</div>
                    )}
                  </div>

                  <div>
                    <span style={{ color: '#64748b', fontSize: 11.5 }}>Nama & Jabatan Penandatangan:</span>
                    <div style={{ fontWeight: 650, color: '#0f172a', marginTop: 2 }}>{previewOutgoing.signer_name}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>
                      {previewOutgoing.signer_position || 'Ketua Umum Pengurus Yayasan'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', fontSize: 11.5 }}>Lampiran & Status:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{previewOutgoing.attachment_count || '-'}</span>
                      <select
                        value={previewOutgoing.status?.toUpperCase() || 'TERKIRIM'}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          await handleUpdateLetterStatus(previewOutgoing, newStatus);
                          setPreviewOutgoing({ ...previewOutgoing, status: newStatus });
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 14,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: '1px solid',
                          outline: 'none',
                          background:
                            previewOutgoing.status?.toUpperCase() === 'TERKIRIM' || previewOutgoing.status?.toUpperCase() === 'SEND'
                              ? '#dcfce7'
                              : previewOutgoing.status?.toUpperCase() === 'DITERIMA' || previewOutgoing.status?.toUpperCase() === 'ARRIVED'
                              ? '#dbeafe'
                              : previewOutgoing.status?.toUpperCase() === 'DRAFT'
                              ? '#f1f5f9'
                              : '#fef3c7',
                          color:
                            previewOutgoing.status?.toUpperCase() === 'TERKIRIM' || previewOutgoing.status?.toUpperCase() === 'SEND'
                              ? '#15803d'
                              : previewOutgoing.status?.toUpperCase() === 'DITERIMA' || previewOutgoing.status?.toUpperCase() === 'ARRIVED'
                              ? '#1d4ed8'
                              : previewOutgoing.status?.toUpperCase() === 'DRAFT'
                              ? '#475569'
                              : '#b45309',
                          borderColor:
                            previewOutgoing.status?.toUpperCase() === 'TERKIRIM' || previewOutgoing.status?.toUpperCase() === 'SEND'
                              ? '#86efac'
                              : previewOutgoing.status?.toUpperCase() === 'DITERIMA' || previewOutgoing.status?.toUpperCase() === 'ARRIVED'
                              ? '#93c5fd'
                              : previewOutgoing.status?.toUpperCase() === 'DRAFT'
                              ? '#cbd5e1'
                              : '#fde68a',
                        }}
                        title="Ubah status surat langsung"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="TERKIRIM">Send</option>
                        <option value="DITERIMA">Arrived</option>
                        <option value="DIARSIPKAN">Diarsipkan</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: '#64748b', fontSize: 11.5 }}>Ringkasan Isi / Catatan Khusus:</span>
                    <div
                      style={{
                        color: '#334155',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        padding: '10px 14px',
                        marginTop: 4,
                        lineHeight: 1.5,
                      }}
                    >
                      {previewOutgoing.content_summary || 'Tidak ada catatan ringkasan khusus.'}
                    </div>
                  </div>

                  {previewOutgoing.file_url && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: '#64748b', fontSize: 11.5 }}>Tautan Dokumen / File Scan:</span>
                      <div style={{ marginTop: 4 }}>
                        <a
                          href={previewOutgoing.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            color: '#0284c7',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          <ExternalLink size={13} /> {previewOutgoing.file_url}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              className="modal-footer"
              style={{
                borderTop: '1px solid var(--gmh-border)',
                padding: '14px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--gmh-text-muted)' }}>
                ID Arsip: <code style={{ fontSize: 11 }}>{previewOutgoing.id?.slice(0, 8)}</code>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    const letterToEdit = previewOutgoing;
                    setPreviewOutgoing(null);
                    setEditingOutgoing(letterToEdit);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Edit3 size={14} /> Ubah Data
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setPreviewOutgoing(null)}>
                  Selesai / Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT SURAT KELUAR */}
      {/* ========================================================================= */}
      {editingOutgoing && (
        <div className="modal-backdrop">
          <div className="modal modal-card" style={{ maxWidth: 640, background: '#ffffff', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                Ubah Surat Keluar: {editingOutgoing.letter_number}
              </div>
              <button type="button" className="btn-icon" onClick={() => setEditingOutgoing(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateOutgoing}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Tanggal Surat</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editingOutgoing.letter_date}
                      onChange={(e) => setEditingOutgoing({ ...editingOutgoing, letter_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Status</label>
                    <select
                      className="form-select"
                      value={editingOutgoing.status}
                      onChange={(e) => setEditingOutgoing({ ...editingOutgoing, status: e.target.value })}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="TERKIRIM">Send (Terkirim)</option>
                      <option value="DITERIMA">Arrived (Diterima)</option>
                      <option value="DIARSIPKAN">Diarsipkan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Perihal Surat *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingOutgoing.subject}
                    onChange={(e) => setEditingOutgoing({ ...editingOutgoing, subject: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Kepada Yth. (Penerima) *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingOutgoing.recipient}
                      onChange={(e) => setEditingOutgoing({ ...editingOutgoing, recipient: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Alamat Penerima</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingOutgoing.recipient_address || ''}
                      onChange={(e) => setEditingOutgoing({ ...editingOutgoing, recipient_address: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Penandatangan</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingOutgoing.signer_name}
                      onChange={(e) => setEditingOutgoing({ ...editingOutgoing, signer_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Jabatan</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingOutgoing.signer_position || ''}
                      onChange={(e) => setEditingOutgoing({ ...editingOutgoing, signer_position: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Ringkasan Isi Surat</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={editingOutgoing.content_summary || ''}
                    onChange={(e) => setEditingOutgoing({ ...editingOutgoing, content_summary: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--gmh-border)', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingOutgoing(null)}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CATAT SURAT MASUK */}
      {/* ========================================================================= */}
      {showCreateIncomingModal && (
        <div className="modal-backdrop">
          <div className="modal modal-card" style={{ maxWidth: 660, maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Inbox size={18} color="#16a34a" />
                <div style={{ fontWeight: 700, fontSize: 16 }}>Formulir Pencatatan Surat Masuk</div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowCreateIncomingModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateIncoming}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Nomor Surat Asal (Dari Pengirim) *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: 054/DPMPTSP-MDN/II/2026"
                      value={incomingFormData.sender_letter_number}
                      onChange={(e) => setIncomingFormData({ ...incomingFormData, sender_letter_number: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>No. Agenda Masuk</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Auto (AG-YYYY-XXXX)"
                      value={incomingFormData.agenda_number}
                      onChange={(e) => setIncomingFormData({ ...incomingFormData, agenda_number: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Tanggal Surat Pengirim *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={incomingFormData.letter_date}
                      onChange={(e) => setIncomingFormData({ ...incomingFormData, letter_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Tanggal Diterima *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={incomingFormData.received_date}
                      onChange={(e) => setIncomingFormData({ ...incomingFormData, received_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Nama Pengirim *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nama individu / kepala dinas"
                      value={incomingFormData.sender_name}
                      onChange={(e) => setIncomingFormData({ ...incomingFormData, sender_name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Instansi / Lembaga Asal</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Dinas PTSP Kota Medan / Bank BNI"
                      value={incomingFormData.sender_institution}
                      onChange={(e) => setIncomingFormData({ ...incomingFormData, sender_institution: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Perihal Surat *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Tanggapan Dokumen Administrasi PBG Gedung GMH"
                    value={incomingFormData.subject}
                    onChange={(e) => setIncomingFormData({ ...incomingFormData, subject: e.target.value })}
                    required
                  />
                </div>

                {/* Disposition section */}
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: 8,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af' }}>
                    Lembar Disposisi Surat Masuk
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600, color: '#1e3a8a' }}>Disposisi Diteruskan Kepada:</label>
                      <select
                        className="form-select"
                        value={incomingFormData.disposition_to}
                        onChange={(e) => setIncomingFormData({ ...incomingFormData, disposition_to: e.target.value })}
                      >
                        <option value="Ketua Pembina Yayasan">Ketua Pembina Yayasan</option>
                        <option value="Ketua Umum Pengurus Harian">Ketua Umum Pengurus Harian</option>
                        <option value="Sekretaris Umum">Sekretaris Umum</option>
                        <option value="Bendahara Yayasan">Bendahara Yayasan</option>
                        <option value="Koordinator Sarana & Aset">Koordinator Sarana & Aset</option>
                        <option value="Bidang Misi & Pelayanan">Bidang Misi & Pelayanan</option>
                        <option value="Bidang KTB & Alumni">Bidang KTB & Alumni</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontWeight: 600, color: '#1e3a8a' }}>Status Disposisi:</label>
                      <select
                        className="form-select"
                        value={incomingFormData.status}
                        onChange={(e) => setIncomingFormData({ ...incomingFormData, status: e.target.value })}
                      >
                        <option value="DITERIMA">DITERIMA (Baru)</option>
                        <option value="DIDISPOSISIKAN">DIDISPOSISIKAN</option>
                        <option value="DITINDAKLANJUTI">DITINDAKLANJUTI</option>
                        <option value="SELESAI">SELESAI</option>
                        <option value="DIARSIPKAN">DIARSIPKAN</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600, color: '#1e3a8a' }}>Petunjuk / Catatan Instruksi Disposisi:</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="Instruksi tindak lanjut dari pimpinan yayasan..."
                      value={incomingFormData.disposition_notes}
                      onChange={(e) => setIncomingFormData({ ...incomingFormData, disposition_notes: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Tautan Dokumen / File Scan Surat</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://... atau nomor ordner fisik"
                    value={incomingFormData.file_url}
                    onChange={(e) => setIncomingFormData({ ...incomingFormData, file_url: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--gmh-border)', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCreateIncomingModal(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff' }}
                >
                  <Inbox size={15} /> {isSubmitting ? 'Menyimpan...' : 'Simpan Surat Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LEMBAR DISPOSISI SURAT MASUK */}
      {/* ========================================================================= */}
      {previewIncoming && (
        <div className="modal-backdrop">
          <div className="modal modal-card" style={{ maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', background: '#ffffff', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                <FileCheck size={18} color="#16a34a" /> Lembar Disposisi Surat Masuk
              </div>
              <button type="button" className="btn-icon" onClick={() => setPreviewIncoming(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: 24 }}>
              <div
                style={{
                  border: '2px solid #0f172a',
                  padding: 24,
                  background: '#ffffff',
                  color: '#0f172a',
                }}
              >
                {/* Header Disposisi */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase' }}>
                    Yayasan Global Mission House (GMH PA KMK)
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em' }}>
                    LEMBAR DISPOSISI SURAT MASUK
                  </div>
                </div>

                {/* Agenda Info Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 13 }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 0', width: 150, fontWeight: 600 }}>Nomor Agenda</td>
                      <td style={{ width: 10 }}>:</td>
                      <td style={{ fontWeight: 700, color: '#15803d', fontFamily: 'monospace' }}>
                        {previewIncoming.agenda_number}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 0', fontWeight: 600 }}>Tanggal Diterima</td>
                      <td>:</td>
                      <td>{formatDateID(previewIncoming.received_date)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 0', fontWeight: 600 }}>Surat Dari</td>
                      <td>:</td>
                      <td style={{ fontWeight: 600 }}>
                        {previewIncoming.sender_name}{' '}
                        {previewIncoming.sender_institution && `(${previewIncoming.sender_institution})`}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 0', fontWeight: 600 }}>Nomor Surat Asal</td>
                      <td>:</td>
                      <td style={{ fontFamily: 'monospace' }}>{previewIncoming.sender_letter_number}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 0', fontWeight: 600 }}>Tanggal Surat</td>
                      <td>:</td>
                      <td>{formatDateID(previewIncoming.letter_date)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 0', fontWeight: 600 }}>Perihal</td>
                      <td>:</td>
                      <td style={{ fontWeight: 700 }}>{previewIncoming.subject}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Disposition Instruction Box */}
                <div
                  style={{
                    border: '1.5px solid #0f172a',
                    padding: 16,
                    background: '#f8fafc',
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#1e40af' }}>
                    DITERUSKAN KEPADA: {previewIncoming.disposition_to || '-'}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    INSTRUKSI / CATATAN TINDAK LANJUT:
                  </div>
                  <div
                    style={{
                      minHeight: 70,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      padding: 10,
                      borderRadius: 4,
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    {previewIncoming.disposition_notes || '- Tidak ada catatan instruksi khusus -'}
                  </div>
                </div>

                {/* Paraf / Tanda Tangan */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, textAlign: 'center', fontSize: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Disposisi Oleh (Pimpinan Yayasan):</div>
                    <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      (Paraf / Tanda Tangan)
                    </div>
                    <div style={{ borderTop: '1px solid #0f172a', width: '80%', margin: '0 auto', paddingTop: 4 }}>
                      Ketua Umum / Sekretaris
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 600 }}>Penerima Disposisi:</div>
                    <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      (Paraf / Tanda Tangan)
                    </div>
                    <div style={{ borderTop: '1px solid #0f172a', width: '80%', margin: '0 auto', paddingTop: 4 }}>
                      {previewIncoming.disposition_to || 'Pejabat Terkait'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--gmh-border)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between' }}>
              <span className="badge badge-success">Status: {previewIncoming.status}</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setPreviewIncoming(null)}
                >
                  Tutup
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => window.print()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff' }}
                >
                  <Printer size={15} /> Cetak Lembar Disposisi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT SURAT MASUK */}
      {/* ========================================================================= */}
      {editingIncoming && (
        <div className="modal-backdrop">
          <div className="modal modal-card" style={{ maxWidth: 640, background: '#ffffff', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                Ubah Surat Masuk: {editingIncoming.agenda_number}
              </div>
              <button type="button" className="btn-icon" onClick={() => setEditingIncoming(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateIncoming}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Nomor Surat Asal *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingIncoming.sender_letter_number}
                      onChange={(e) => setEditingIncoming({ ...editingIncoming, sender_letter_number: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Status</label>
                    <select
                      className="form-select"
                      value={editingIncoming.status}
                      onChange={(e) => setEditingIncoming({ ...editingIncoming, status: e.target.value })}
                    >
                      <option value="DITERIMA">DITERIMA</option>
                      <option value="DIDISPOSISIKAN">DIDISPOSISIKAN</option>
                      <option value="DITINDAKLANJUTI">DITINDAKLANJUTI</option>
                      <option value="SELESAI">SELESAI</option>
                      <option value="DIARSIPKAN">DIARSIPKAN</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Pengirim *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingIncoming.sender_name}
                      onChange={(e) => setEditingIncoming({ ...editingIncoming, sender_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Instansi Asal</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingIncoming.sender_institution || ''}
                      onChange={(e) => setEditingIncoming({ ...editingIncoming, sender_institution: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>Perihal Surat *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingIncoming.subject}
                    onChange={(e) => setEditingIncoming({ ...editingIncoming, subject: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Disposisi Kepada</label>
                    <select
                      className="form-select"
                      value={editingIncoming.disposition_to || ''}
                      onChange={(e) => setEditingIncoming({ ...editingIncoming, disposition_to: e.target.value })}
                    >
                      <option value="Ketua Pembina Yayasan">Ketua Pembina Yayasan</option>
                      <option value="Ketua Umum Pengurus Harian">Ketua Umum Pengurus Harian</option>
                      <option value="Sekretaris Umum">Sekretaris Umum</option>
                      <option value="Bendahara Yayasan">Bendahara Yayasan</option>
                      <option value="Koordinator Sarana & Aset">Koordinator Sarana & Aset</option>
                      <option value="Bidang Misi & Pelayanan">Bidang Misi & Pelayanan</option>
                      <option value="Bidang KTB & Alumni">Bidang KTB & Alumni</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Tanggal Diterima</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editingIncoming.received_date}
                      onChange={(e) => setEditingIncoming({ ...editingIncoming, received_date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Petunjuk / Catatan Disposisi</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={editingIncoming.disposition_notes || ''}
                    onChange={(e) => setEditingIncoming({ ...editingIncoming, disposition_notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--gmh-border)', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingIncoming(null)}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={isSubmitting}
                  style={{ color: '#fff' }}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecretariatPage;

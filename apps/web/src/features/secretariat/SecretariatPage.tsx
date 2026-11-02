import React, { useState, useEffect, useCallback } from 'react';
import {
  Send,
  Inbox,
  SlidersHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import type {
  OutgoingLetter,
  IncomingLetter,
  StatsData,
  LetterCategory,
  OutgoingFormData,
  IncomingFormData,
} from './types';
import { downloadWordDraft } from './types';
import { SecretariatOutgoingTab } from './components/SecretariatOutgoingTab';
import { SecretariatIncomingTab } from './components/SecretariatIncomingTab';
import {
  CreateOutgoingModal,
  PreviewOutgoingModal,
  EditOutgoingModal,
  CreateIncomingModal,
  PreviewIncomingModal,
  EditIncomingModal,
} from './components/SecretariatModals';

export const SecretariatPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');
  const [stats, setStats] = useState<StatsData>({
    outgoing: { total: 0, thisYear: 0, drafts: 0 },
    incoming: { total: 0, thisYear: 0, pendingDisposition: 0 },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Setup / Categories from system_lookups
  const [categories, setCategories] = useState<LetterCategory[]>([]);
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
  const [outgoingFormData, setOutgoingFormData] = useState<OutgoingFormData>({
    letter_number: '',
    category_code: 'SK',
    category_label: 'Surat Keputusan (SK)',
    letter_date: new Date().toISOString().split('T')[0],
    subject: '',
    recipient: '',
    recipient_address: '',
    signer_name: '',
    signer_position: '',
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
  const [incomingFormData, setIncomingFormData] = useState<IncomingFormData>({
    agenda_number: '',
    sender_letter_number: '',
    sender_name: '',
    sender_institution: '',
    subject: '',
    letter_date: new Date().toISOString().split('T')[0],
    received_date: new Date().toISOString().split('T')[0],
    disposition_to: '',
    disposition_notes: '',
    status: 'DITERIMA',
    file_url: '',
  });

  // Modal View/Print Disposition
  const [previewIncoming, setPreviewIncoming] = useState<IncomingLetter | null>(null);

  // Modal Edit Incoming
  const [editingIncoming, setEditingIncoming] = useState<IncomingLetter | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
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
        showToast(
          res.letter?.letter_number
            ? `Surat keluar berhasil diterbitkan dengan nomor resmi: ${res.letter.letter_number}`
            : res.message || 'Surat keluar berhasil dibuat!'
        );
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
          signer_name: '',
          signer_position: '',
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

      {/* TAB 1: SURAT KELUAR */}
      {activeTab === 'outgoing' && (
        <SecretariatOutgoingTab
          outgoingLetters={outgoingLetters}
          outgoingSearch={outgoingSearch}
          setOutgoingSearch={setOutgoingSearch}
          outgoingCategoryFilter={outgoingCategoryFilter}
          setOutgoingCategoryFilter={setOutgoingCategoryFilter}
          outgoingStatusFilter={outgoingStatusFilter}
          setOutgoingStatusFilter={setOutgoingStatusFilter}
          outgoingPage={outgoingPage}
          setOutgoingPage={setOutgoingPage}
          outgoingPageSize={outgoingPageSize}
          setOutgoingPageSize={setOutgoingPageSize}
          outgoingTotal={outgoingTotal}
          categories={categories}
          isLoading={isLoading}
          loadOutgoing={loadOutgoing}
          handleUpdateLetterStatus={handleUpdateLetterStatus}
          setPreviewOutgoing={setPreviewOutgoing}
          setEditingOutgoing={setEditingOutgoing}
          handleDeleteOutgoing={handleDeleteOutgoing}
        />
      )}

      {/* TAB 2: DATA SURAT MASUK */}
      {activeTab === 'incoming' && (
        <SecretariatIncomingTab
          incomingLetters={incomingLetters}
          incomingSearch={incomingSearch}
          setIncomingSearch={setIncomingSearch}
          incomingStatusFilter={incomingStatusFilter}
          setIncomingStatusFilter={setIncomingStatusFilter}
          incomingDispositionFilter={incomingDispositionFilter}
          setIncomingDispositionFilter={setIncomingDispositionFilter}
          incomingPage={incomingPage}
          setIncomingPage={setIncomingPage}
          incomingPageSize={incomingPageSize}
          setIncomingPageSize={setIncomingPageSize}
          incomingTotal={incomingTotal}
          isLoading={isLoading}
          loadIncoming={loadIncoming}
          setShowCreateIncomingModal={setShowCreateIncomingModal}
          setPreviewIncoming={setPreviewIncoming}
          setEditingIncoming={setEditingIncoming}
          handleDeleteIncoming={handleDeleteIncoming}
        />
      )}

      {/* MODALS */}
      <CreateOutgoingModal
        isOpen={showCreateOutgoingModal}
        onClose={() => setShowCreateOutgoingModal(false)}
        isAutoNumber={isAutoNumber}
        setIsAutoNumber={setIsAutoNumber}
        generatedPreviewNumber={generatedPreviewNumber}
        outgoingFormData={outgoingFormData}
        setOutgoingFormData={setOutgoingFormData}
        categories={categories}
        handleCreateOutgoing={handleCreateOutgoing}
        isSubmitting={isSubmitting}
      />

      <PreviewOutgoingModal
        previewOutgoing={previewOutgoing}
        onClose={() => setPreviewOutgoing(null)}
        copiedField={copiedField}
        handleCopyText={handleCopyText}
        downloadWordDraft={downloadWordDraft}
        handleUpdateLetterStatus={handleUpdateLetterStatus}
        setPreviewOutgoing={setPreviewOutgoing}
        setEditingOutgoing={setEditingOutgoing}
      />

      <EditOutgoingModal
        editingOutgoing={editingOutgoing}
        onClose={() => setEditingOutgoing(null)}
        setEditingOutgoing={setEditingOutgoing}
        handleUpdateOutgoing={handleUpdateOutgoing}
        isSubmitting={isSubmitting}
      />

      <CreateIncomingModal
        isOpen={showCreateIncomingModal}
        onClose={() => setShowCreateIncomingModal(false)}
        incomingFormData={incomingFormData}
        setIncomingFormData={setIncomingFormData}
        handleCreateIncoming={handleCreateIncoming}
        isSubmitting={isSubmitting}
      />

      <PreviewIncomingModal
        previewIncoming={previewIncoming}
        onClose={() => setPreviewIncoming(null)}
      />

      <EditIncomingModal
        editingIncoming={editingIncoming}
        onClose={() => setEditingIncoming(null)}
        setEditingIncoming={setEditingIncoming}
        handleUpdateIncoming={handleUpdateIncoming}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default SecretariatPage;

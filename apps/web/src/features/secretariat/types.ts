export interface OutgoingLetter {
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

export interface IncomingLetter {
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

export interface StatsData {
  outgoing: { total: number; thisYear: number; drafts: number };
  incoming: { total: number; thisYear: number; pendingDisposition: number };
}

export interface LetterCategory {
  id: string;
  code: string;
  label: string;
}

export interface OutgoingFormData {
  letter_number: string;
  category_code: string;
  category_label: string;
  letter_date: string;
  subject: string;
  recipient: string;
  recipient_address: string;
  signer_name: string;
  signer_position: string;
  attachment_count: string;
  content_summary: string;
  file_url: string;
  status: string;
}

export interface IncomingFormData {
  agenda_number: string;
  sender_letter_number: string;
  sender_name: string;
  sender_institution: string;
  subject: string;
  letter_date: string;
  received_date: string;
  disposition_to: string;
  disposition_notes: string;
  status: string;
  file_url: string;
}

// Helper date formatter
export const formatDateID = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

// Helper to construct concise file title from "tujuan surat" (subject) and "kepada tujuan" (recipient)
export const getLetterFileTitle = (letter: OutgoingLetter): string => {
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

// Helper download Word Draft
export const downloadWordDraft = (letter: OutgoingLetter): void => {
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

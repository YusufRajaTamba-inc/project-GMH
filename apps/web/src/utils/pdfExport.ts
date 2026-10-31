import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportPdfOptions {
  filename?: string;
  title?: string;
  onProgress?: (status: string) => void;
}

/**
 * Directly exports an HTML element to a PDF file and initiates download
 * without opening the browser's window.print() printer dialog.
 */
export async function exportHtmlToPdf(
  elementIdOrElement: string | HTMLElement,
  options: ExportPdfOptions = {}
): Promise<boolean> {
  const element =
    typeof elementIdOrElement === 'string'
      ? document.getElementById(elementIdOrElement)
      : elementIdOrElement;

  if (!element) {
    console.error(`[pdfExport] Element not found:`, elementIdOrElement);
    throw new Error('Elemen dokumen laporan tidak ditemukan untuk diunduh.');
  }

  // Clone node so we don't disrupt current UI state
  const clone = element.cloneNode(true) as HTMLElement;

  // Configure clone to standard A4 pixel width (794px at 96 DPI corresponds to 210mm)
  clone.classList.remove('print-only');
  clone.style.display = 'block';
  clone.style.position = 'fixed';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.width = '794px';
  clone.style.minWidth = '794px';
  clone.style.maxWidth = '794px';
  clone.style.background = '#ffffff';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#0f172a';
  clone.style.margin = '0';
  clone.style.padding = '28px 34px';
  clone.style.boxSizing = 'border-box';
  clone.style.zIndex = '-9999';
  clone.style.overflow = 'visible';

  // Normalize all child elements: expand any collapsed or scrollable containers
  const allChildren = clone.querySelectorAll('*');
  allChildren.forEach((child) => {
    const el = child as HTMLElement;
    if (el.style) {
      if (el.style.overflow) el.style.overflow = 'visible';
      if (el.style.overflowY) el.style.overflowY = 'visible';
      if (el.style.overflowX) el.style.overflowX = 'visible';
      if (el.style.maxHeight) el.style.maxHeight = 'none';
      if (el.style.height && el.style.height !== 'auto' && el.tagName !== 'IMG') {
        el.style.height = 'auto';
      }
    }
  });

  document.body.appendChild(clone);

  try {
    options.onProgress?.('Memeriksa kesiapan aset...');

    // Wait for images to load if any
    const images = Array.from(clone.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve(true);
            } else {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(true);
            }
          })
      )
    );

    options.onProgress?.('Merender lembar dokumen...');

    const canvas = await html2canvas(clone, {
      scale: 2, // 2x scale for crisp high-resolution typography
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
    });

    options.onProgress?.('Menyusun format halaman PDF...');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Additional pages if document is longer than single A4 page
    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    const filename = options.filename
      ? options.filename.endsWith('.pdf')
        ? options.filename
        : `${options.filename}.pdf`
      : 'Laporan_Resmi_GMH.pdf';

    options.onProgress?.('Menyimpan file...');
    pdf.save(filename);
    return true;
  } finally {
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
  }
}

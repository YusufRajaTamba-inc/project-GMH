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
 * If the element contains multiple .pdf-page blocks, each block is rendered
 * onto its own distinct A4 page with complete letterhead and page numbers.
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

  // Configure clone container off-screen
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
  clone.style.padding = '0';
  clone.style.boxSizing = 'border-box';
  clone.style.zIndex = '-9999';
  clone.style.overflow = 'visible';

  // Normalize all child elements
  const allChildren = clone.querySelectorAll('*');
  allChildren.forEach((child) => {
    const el = child as HTMLElement;
    if (el.style) {
      if (el.style.overflow) el.style.overflow = 'visible';
      if (el.style.overflowY) el.style.overflowY = 'visible';
      if (el.style.overflowX) el.style.overflowX = 'visible';
      if (el.style.maxHeight) el.style.maxHeight = 'none';
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

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

    // Check if the document has explicit page structures (.pdf-page)
    const pageNodes = Array.from(clone.querySelectorAll<HTMLElement>('.pdf-page'));

    if (pageNodes.length > 0) {
      options.onProgress?.(`Menyusun ${pageNodes.length} halaman dokumen resmi...`);

      for (let i = 0; i < pageNodes.length; i++) {
        const pageEl = pageNodes[i];
        if (i > 0) {
          pdf.addPage();
        }

        options.onProgress?.(`Merender halaman ${i + 1} dari ${pageNodes.length}...`);

        const canvas = await html2canvas(pageEl, {
          scale: 2, // 2x scale for crisp high-resolution typography
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(
          imgData,
          'JPEG',
          0,
          0,
          pdfWidth,
          Math.min(pdfHeight, imgHeight),
          undefined,
          'FAST'
        );
      }
    } else {
      // Fallback for single continuous element without .pdf-page
      options.onProgress?.('Merender dokumen...');

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      });

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
    }

    const filename = options.filename
      ? options.filename.endsWith('.pdf')
        ? options.filename
        : `${options.filename}.pdf`
      : 'Laporan_Resmi_GMH.pdf';

    options.onProgress?.('Menyimpan file ke perangkat...');
    pdf.save(filename);
    return true;
  } finally {
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
  }
}

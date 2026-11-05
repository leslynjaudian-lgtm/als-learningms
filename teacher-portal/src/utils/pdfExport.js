import html2pdf from 'html2pdf.js';

/**
 * Exports a dedicated report container to PDF using html2pdf.js
 *
 * @param {HTMLElement|string|{ value: HTMLElement }} target - Element, Vue ref, or element ID
 * @param {Object} options
 * @param {string} [options.filename] - Output PDF filename
 * @param {'landscape'|'portrait'} [options.orientation='landscape'] - A4 orientation
 * @param {Array<number>} [options.margin=[10, 8, 10, 8]] - Margins in mm [top, left, bottom, right]
 * @param {string} [options.format='a4'] - Page format
 * @returns {Promise<void>}
 */
export async function exportReportToPdf(target, options = {}) {
  let element = null;

  if (typeof target === 'string') {
    element = document.getElementById(target);
  } else if (target && target.value instanceof HTMLElement) {
    element = target.value;
  } else if (target instanceof HTMLElement) {
    element = target;
  }

  if (!element) {
    console.error('Report element not found for PDF export:', target);
    throw new Error('Report container element not found. Please ensure the report has been generated.');
  }

  const {
    filename = `ALS_Report_${new Date().toISOString().split('T')[0]}.pdf`,
    orientation = 'landscape',
    margin = [10, 8, 10, 8],
    format = 'a4',
  } = options;

  // Window width calculation to ensure tables don't wrap unexpectedly during canvas capture
  const windowWidth = orientation === 'landscape' ? 1200 : 960;

  const opt = {
    margin,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      windowWidth,
    },
    jsPDF: {
      unit: 'mm',
      format,
      orientation,
      compress: true,
    },
    pagebreak: { mode: ['css', 'legacy'], after: '.has-page-break' },
  };

  // Temporarily hide .print-hidden elements inside the target container during capture
  const hiddenElements = Array.from(element.querySelectorAll('.print-hidden'));
  const previousDisplays = hiddenElements.map((el) => el.style.display);
  hiddenElements.forEach((el) => {
    el.style.display = 'none';
  });

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (err) {
    console.error('Error generating PDF with html2pdf:', err);
    // If html2pdf encounters an issue, fallback cleanly to browser print
    window.print();
    throw err;
  } finally {
    hiddenElements.forEach((el, idx) => {
      el.style.display = previousDisplays[idx];
    });
  }
}

/**
 * Directly invokes browser print with print CSS isolating #report-content
 */
export function printReportDirectly() {
  window.print();
}


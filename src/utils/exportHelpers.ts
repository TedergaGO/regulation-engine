import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle,
} from 'docx';
import PDFDocument from 'pdfkit';

// Helper: normalize Turkish characters for PDF (Latin-1 safe)
function tr(text: string): string {
  if (!text) return '';
  return text
    .replace(/\u015f/g, 's').replace(/\u015e/g, 'S')
    .replace(/\u00fc/g, 'u').replace(/\u00dc/g, 'U')
    .replace(/\u00f6/g, 'o').replace(/\u00d6/g, 'O')
    .replace(/\u00e7/g, 'c').replace(/\u00c7/g, 'C')
    .replace(/\u011f/g, 'g').replace(/\u011e/g, 'G')
    .replace(/\u0131/g, 'i').replace(/\u0130/g, 'I');
}

export async function generateWordDoc(standard: any, policies: any[]): Promise<Buffer> {
  const date = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

  const children: any[] = [];

  // Cover page
  children.push(
    new Paragraph({
      children: [new TextRun({ text: standard.icon || '', size: 72 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 1440, after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: standard.name, bold: true, size: 48, color: '1a5276' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Politika ve Prosedür Dokümanları', size: 28, color: '555555' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Yayın Tarihi: ${date}`, size: 20, color: '888888' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Toplam Politika: ${policies.length}`, size: 20, color: '888888' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 1440 },
      pageBreakBefore: false,
    }),
  );

  // Table of contents
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Icindekiler', bold: true, size: 32, color: '1a5276' })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );
  policies.forEach((p, i) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${i + 1}. ${p.refNo} — ${p.controlTitle || ''}`, size: 20 })],
        spacing: { after: 80 },
      })
    );
  });

  // Policy sections
  policies.forEach((p) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${p.refNo}  `, bold: true, color: 'ffffff', size: 20, highlight: 'darkBlue' }),
          new TextRun({ text: p.controlTitle || '', bold: true, size: 28, color: '1a5276' }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 800, after: 240 },
        pageBreakBefore: true,
      }),
      new Paragraph({
        children: [new TextRun({ text: p.documentTitle || `${p.controlTitle} Politikasi`, italics: true, size: 22, color: '555555' })],
        spacing: { after: 240 },
      }),
    );

    // Meta table
    const metaTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Yayin Tarihi', bold: true, size: 18 })] })], width: { size: 30, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: p.generatedAt || date, size: 18 })] })] }),
        ]}),
        new TableRow({ children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Gozden Gecirme', bold: true, size: 18 })] })], width: { size: 30, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: p.reviewPeriod || 'Yillik', size: 18 })] })] }),
        ]}),
        new TableRow({ children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Durum', bold: true, size: 18 })] })], width: { size: 30, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Aktif', size: 18 })] })] }),
        ]}),
      ],
    });
    children.push(metaTable);

    // Sections
    const addSection = (title: string, content: string) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: 24, color: '1a5276' })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 360, after: 160 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'e0e8f0' } },
        }),
        ...content.split('\n').filter(l => l.trim()).map(line =>
          new Paragraph({
            children: [new TextRun({ text: line, size: 20 })],
            spacing: { after: 120 },
            alignment: AlignmentType.JUSTIFIED,
          })
        )
      );
    };

    addSection('1. Amac', p.purpose || '');
    addSection('2. Kapsam', p.scope || '');
    addSection('3. Politika Beyani', p.policyStatement || '');

    // Procedures
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '4. Prosedurler', bold: true, size: 24, color: '1a5276' })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 360, after: 160 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'e0e8f0' } },
      })
    );
    (p.procedures || []).forEach((pr: any) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${pr.stepNo}. ${pr.title}`, bold: true, size: 20 })],
          spacing: { before: 200, after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ text: pr.description || '', size: 20 })],
          spacing: { after: 80 },
        }),
      );
      if (pr.responsible) {
        children.push(new Paragraph({ children: [new TextRun({ text: `Sorumlu: ${pr.responsible}`, size: 18, italics: true })] }));
      }
    });

    // Responsibilities table
    if ((p.responsibilities || []).length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '5. Sorumluluklar', bold: true, size: 24, color: '1a5276' })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 360, after: 160 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'e0e8f0' } },
        })
      );
      const respTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Rol', bold: true, color: 'ffffff', size: 20 })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Sorumluluk', bold: true, color: 'ffffff', size: 20 })] })] }),
            ],
          }),
          ...(p.responsibilities || []).map((r: any) => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: r.role || '', size: 18 })] })], width: { size: 30, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: r.duties || '', size: 18 })] })] }),
            ],
          })),
        ],
      });
      children.push(respTable);
    }

    addSection('6. Olcum Kriterleri', (p.measurementCriteria || []).join('\n'));
    addSection('7. Istisna Yonetimi', p.exceptions || '');
    addSection('8. Uyumsuzluk', p.compliance || '');
    addSection('9. Ilgili Dokumanlar', (p.relatedDocuments || []).join('\n'));
  });

  const doc = new Document({
    sections: [{ children }],
  });

  return await Packer.toBuffer(doc);
}

export async function generatePdfDoc(standard: any, policies: any[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const date = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
    const pageW = doc.page.width - 100;

    // Cover
    doc.moveDown(5);
    doc.fontSize(32).fillColor('#1a5276').text(tr(standard.name), { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(18).fillColor('#555555').text('Politika ve Prosedur Dokumanlari', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(12).fillColor('#888888').text(`Yayin Tarihi: ${tr(date)}`, { align: 'center' });
    doc.text(`Toplam Politika: ${policies.length}`, { align: 'center' });

    policies.forEach((p, idx) => {
      doc.addPage();

      // Policy header
      doc.fontSize(14).fillColor('#1a5276').font('Helvetica-Bold')
        .text(`${tr(p.refNo)}  ${tr(p.controlTitle || '')}`, { underline: false });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#555555').font('Helvetica-Oblique')
        .text(tr(p.documentTitle || `${p.controlTitle} Politikasi`));
      doc.moveDown(0.5);

      const section = (title: string, content: string) => {
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#1a5276').font('Helvetica-Bold').text(tr(title));
        doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#e0e8f0');
        doc.moveDown(0.2);
        doc.fontSize(10).fillColor('#1a1a1a').font('Helvetica')
          .text(tr(content || '—'), { width: pageW, align: 'justify' });
        doc.moveDown(0.3);
      };

      section('1. Amac', p.purpose || '');
      section('2. Kapsam', p.scope || '');
      section('3. Politika Beyani', (p.policyStatement || '').replace(/\n/g, ' '));

      // Procedures
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#1a5276').font('Helvetica-Bold').text('4. Prosedurler');
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#e0e8f0');
      doc.moveDown(0.2);
      (p.procedures || []).forEach((pr: any) => {
        doc.fontSize(10).fillColor('#2c3e50').font('Helvetica-Bold')
          .text(`${pr.stepNo}. ${tr(pr.title || '')}`);
        doc.fontSize(10).fillColor('#1a1a1a').font('Helvetica')
          .text(tr(pr.description || ''), { width: pageW });
        if (pr.responsible) {
          doc.fontSize(9).fillColor('#888888').font('Helvetica-Oblique')
            .text(`Sorumlu: ${tr(pr.responsible)}`);
        }
        doc.moveDown(0.3);
      });

      // Responsibilities
      if ((p.responsibilities || []).length > 0) {
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#1a5276').font('Helvetica-Bold').text('5. Sorumluluklar');
        doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke('#e0e8f0');
        doc.moveDown(0.2);
        (p.responsibilities || []).forEach((r: any) => {
          doc.fontSize(10).fillColor('#2c3e50').font('Helvetica-Bold').text(tr(r.role || ''), { continued: true });
          doc.font('Helvetica').fillColor('#1a1a1a').text(`: ${tr(r.duties || '')}`);
        });
        doc.moveDown(0.3);
      }

      section('6. Olcum Kriterleri', (p.measurementCriteria || []).join('; '));
      section('7. Istisna Yonetimi', p.exceptions || '');
      section('8. Uyumsuzluk', p.compliance || '');
      section('9. Ilgili Dokumanlar', (p.relatedDocuments || []).join(', '));
    });

    doc.end();
  });
}

export async function generateExcelDoc(standard: any, controls: any[]): Promise<Buffer> {
  const XLSX = require('xlsx');
  const wb = XLSX.utils.book_new();

  const wsData = [
    [null, `${standard.name} — KONTROL LISTESI`],
    [null, '#', 'KATEGORI', 'REF NO', 'KONTROL BASLIGI', 'KONTROL ACIKLAMASI', 'TIP', 'ONCELIK'],
    ...controls.map((c: any, i: number) => [
      null, i + 1, c.category, c.ref_no || c.refNo,
      c.title, c.description, c.type, c.priority,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 3 }, { wch: 5 }, { wch: 30 }, { wch: 15 },
    { wch: 40 }, { wch: 60 }, { wch: 12 }, { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Kontrol Listesi');

  const categories = [...new Set(controls.map((c: any) => c.category))];
  const summaryData = [
    [null, `${standard.name} — KATEGORI OZETI`],
    [null, 'KATEGORI', 'ZORUNLU', 'TAVSIYE', 'TOPLAM'],
    ...categories.map((cat: any) => {
      const catControls = controls.filter((c: any) => c.category === cat);
      const mandatory = catControls.filter((c: any) => c.type === 'ZORUNLU').length;
      const advisory = catControls.filter((c: any) => c.type !== 'ZORUNLU').length;
      return [null, cat, mandatory, advisory, catControls.length];
    }),
    [null, 'GENEL TOPLAM',
      controls.filter((c: any) => c.type === 'ZORUNLU').length,
      controls.filter((c: any) => c.type !== 'ZORUNLU').length,
      controls.length,
    ],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
  ws2['!cols'] = [{ wch: 3 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Kategori Ozeti');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

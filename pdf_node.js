// ── Generador de PDF de Tendencias en Node puro (pdfkit) ──
// SIN Python, SIN Chrome. Funciona en Railway sin dependencias raras.
// Diseño línea ESFERA: portada azul marino, Top 5, tarjetas por nicho.

const PDFDocument = require('pdfkit');
const fs = require('fs');

// paleta ESFERA (azul)
const AZUL = '#3b6ef5';
const MARINO = '#0d1424';
const MARINO2 = '#0f1830';
const INK = '#16202f';
const BODY = '#33415b';
const LINE = '#e2e7f0';
const WHITE = '#ffffff';
const SOFT = '#8ba3f0';
const SUBT = '#aeb8cc';

const PRIO = {
  ALTA:  { bg: '#e24b4a', label: 'PRIORIDAD ALTA' },
  MEDIA: { bg: '#f0a020', label: 'PRIORIDAD MEDIA' },
  BAJA:  { bg: '#7f8aa3', label: 'PRIORIDAD BAJA' },
};
const PLAT = {
  'YouTube Shorts': '#e24b4a',
  'TikTok': '#111827',
  'Facebook/Instagram Reels': '#8b3dc9',
};

function generarPDF(datos, rutaSalida) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 0, left: 0, right: 0, bottom: 0 }, bufferPages: true });
      const stream = fs.createWriteStream(rutaSalida);
      doc.pipe(stream);
      stream.on('finish', () => resolve(rutaSalida));
      stream.on('error', reject);

      const M = 46;
      const PW = doc.page.width, PH = doc.page.height, CW = PW - M * 2;
      const BOTTOM = PH - 54;

      function rr(x, y, w, h, r, c) { doc.roundedRect(x, y, w, h, r).fill(c); }
      function nuevaPagina() { doc.addPage(); doc.rect(0, 0, PW, PH).fill(WHITE); doc.y = 44; }

      const mes = datos.mes || '', anio = datos.anio || '';
      const nichos = datos.nichos || [];
      const top5 = datos.top5 || [];
      const totalTend = nichos.reduce((s, n) => s + ((n.tendencias || []).length), 0);
      const activos = nichos.filter(n => (n.tendencias || []).length > 0).length;

      // ───── PORTADA ─────
      doc.rect(0, 0, PW, PH).fill(MARINO);
      doc.rect(PW - 12, 0, 12, PH).fill(AZUL); // franja lateral

      let y = 60;
      doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(10).text('ESFERA · TENDENCIAS', M, y, { characterSpacing: 3 });
      y += 28;
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(30).text('Tendencias de Contenido', M, y, { width: CW - 80, lineGap: 2 });
      y = doc.y + 4;
      doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(30).text(`${mes} ${anio}`, M, y, { width: CW - 80 });
      y = doc.y + 14;
      doc.fillColor(SUBT).font('Helvetica').fontSize(11).text('Deteccion mensual de formatos y ganchos que ya funcionan afuera, por nicho de la cartera. Insumo del Planificador de Contenidos.', M, y, { width: CW - 120, lineGap: 3 });
      y = doc.y + 24;

      // stats
      const stats = [[String(totalTend), 'TENDENCIAS'], [`${activos}/12`, 'NICHOS ACTIVOS'], ['3', 'PLATAFORMAS']];
      let sx = M;
      stats.forEach(([num, lbl]) => {
        doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(24).text(num, sx, y);
        doc.fillColor(SUBT).font('Helvetica-Bold').fontSize(8).text(lbl, sx, y + 30, { characterSpacing: 1.5 });
        sx += 150;
      });
      y += 60;

      // Top 5
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11).text('TOP 5 DEL MES', M, y, { characterSpacing: 2 });
      y += 20;
      top5.slice(0, 5).forEach((t, i) => {
        const prio = PRIO[(t.prioridad || 'MEDIA').toUpperCase()] || PRIO.MEDIA;
        rr(M, y, 20, 20, 5, AZUL);
        doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10).text(String(i + 1), M, y + 5, { width: 20, align: 'center' });
        doc.fillColor('#eef2fb').font('Helvetica-Bold').fontSize(10).text(t.titulo || '', M + 30, y + 1, { width: CW - 120 });
        const yy = doc.y;
        doc.fillColor(SOFT).font('Helvetica').fontSize(8).text((t.nicho || '').toUpperCase(), M + 30, yy + 1, { width: CW - 200, continued: false });
        doc.fillColor('#9aa6bd').font('Helvetica').fontSize(8.5).text(t.razon || '', M + 30, doc.y + 1, { width: CW - 60, lineGap: 1 });
        y = doc.y + 10;
      });

      doc.fillColor('#7f8aa3').font('Helvetica').fontSize(8).text(`GENERADO ${datos.fecha_generacion || ''} · ESCALANDO MARKETING DIGITAL`, M, PH - 44, { characterSpacing: 1 });

      // ───── CONTENIDO ─────
      nuevaPagina();

      nichos.forEach((n, idx) => {
        const tends = n.tendencias || [];
        // encabezado de nicho
        if (doc.y + 60 > BOTTOM) nuevaPagina();
        rr(M, doc.y, 24, 24, 6, AZUL);
        doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11).text(String(idx + 1), M, doc.y + 6, { width: 24, align: 'center' });
        const hy = doc.y;
        doc.fillColor(INK).font('Helvetica-Bold').fontSize(14).text(n.nicho || '', M + 34, hy + 4, { width: CW - 34 });
        doc.fillColor('#7f8aa3').font('Helvetica').fontSize(7.5).text((n.clientes || []).join(' · '), M + 34, doc.y + 2, { width: CW - 34 });
        doc.y = Math.max(doc.y, hy + 24) + 8;

        if (tends.length === 0) {
          doc.fillColor('#9aa3b2').font('Helvetica-Oblique').fontSize(9.5).text('Sin tendencias relevantes este mes.', M + 34, doc.y);
          doc.moveDown(1);
          return;
        }

        tends.forEach(t => {
          const platColor = PLAT[t.plataforma] || AZUL;
          const prio = PRIO[(t.prioridad || 'MEDIA').toUpperCase()] || PRIO.MEDIA;

          // medir alto aproximado de la tarjeta para no cortarla
          const descH = doc.font('Helvetica').fontSize(9).heightOfString(t.descripcion_visual || '', { width: CW - 150 });
          const cardH = 120 + descH;
          if (doc.y + cardH > BOTTOM) nuevaPagina();

          const cardY = doc.y;
          const cardX = M + 34;
          const cardW = CW - 34;

          // cuerpo tarjeta
          doc.roundedRect(cardX, cardY, cardW, cardH, 8).fill('#fafbfc');
          doc.roundedRect(cardX, cardY, cardW, cardH, 8).lineWidth(1).strokeColor(LINE).stroke();
          doc.rect(cardX, cardY, 5, cardH).fill(platColor); // borde izq por plataforma

          let cy = cardY + 12;
          // título + badge
          doc.fillColor(INK).font('Helvetica-Bold').fontSize(11.5).text(t.titulo || '', cardX + 16, cy, { width: cardW - 150 });
          const badgeW = 90;
          rr(cardX + cardW - badgeW - 12, cardY + 12, badgeW, 16, 5, prio.bg);
          doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(6.5).text(prio.label, cardX + cardW - badgeW - 12, cardY + 17, { width: badgeW, align: 'center' });
          cy = doc.y + 6;

          // métrica
          doc.fillColor('#41506a').font('Helvetica').fontSize(8.5).text(`${t.metrica_dura || ''} — ${t.justificacion || ''}`, cardX + 16, cy, { width: cardW - 30, lineGap: 1 });
          cy = doc.y + 6;

          // chips
          const chips = [t.plataforma, `Produccion ${t.nivel_produccion || '—'}`, t.clasificacion_3v, t.vigencia].filter(Boolean);
          let chx = cardX + 16;
          doc.fontSize(7);
          chips.forEach(c => {
            const w = doc.widthOfString(c) + 12;
            if (chx + w > cardX + cardW - 12) { chx = cardX + 16; cy = doc.y + 4; }
            doc.roundedRect(chx, cy, w, 13, 4).lineWidth(0.8).strokeColor('#d4dbe8').stroke();
            doc.fillColor('#5a6a82').font('Helvetica-Bold').fontSize(7).text(c, chx + 6, cy + 3.5);
            chx += w + 5;
          });
          cy += 20;

          // campos
          function campo(lbl, val) {
            if (!val) return;
            doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(7).text(lbl, cardX + 16, cy, { width: 95 });
            doc.fillColor(BODY).font('Helvetica').fontSize(9).text(val, cardX + 116, cy, { width: cardW - 132, lineGap: 1.5 });
            cy = doc.y + 5;
          }
          campo('DESCRIPCION', t.descripcion_visual);
          campo('POR QUE FUNCIONA', t.por_que_funciona);
          campo('CLIENTE(S)', t.clientes_recomendados);
          campo('COMO ADAPTAR', t.como_adaptar);

          // link
          doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(8).text('VER VIDEO', cardX + 16, cy, { width: 95 });
          doc.fillColor(AZUL).font('Helvetica').fontSize(8).text(t.link || '', cardX + 116, cy, { width: cardW - 132, link: t.link, underline: false });
          cy = doc.y;

          doc.y = cardY + cardH + 10;
        });
        doc.moveDown(0.5);
      });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { generarPDF };

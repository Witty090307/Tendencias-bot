// ── Orquestador: corre todo el pipeline de tendencias ──
//  1. Por cada nicho: busca en YouTube + TikTok + Instagram (en paralelo)
//  2. Claude filtra y analiza cada nicho
//  3. Claude arma el Top 5
//  4. Genera el PDF ESFERA
//  5. Sube a Drive
//  Devuelve { pdfPath, driveLink, resumen }

const path = require('path');
const nichos = require('./nichos');
const { buscarYouTube } = require('./youtube');
const { buscarTikTok, buscarInstagram } = require('./apify');
const { analizarNicho, armarTop5 } = require('./analizador');
const { subirADrive } = require('./drive');
const { execFile } = require('child_process');
const fs = require('fs');

// genera el PDF llamando al script Python (weasyprint) — mismo motor que la skill ESFERA
function generarPDF(datos, rutaSalida) {
  return new Promise((resolve, reject) => {
    const datosPath = rutaSalida.replace(/\.pdf$/, '.json');
    fs.writeFileSync(datosPath, JSON.stringify(datos), 'utf-8');
    const script = path.join(__dirname, 'generar_pdf.py');
    execFile('python3', [script, datosPath, rutaSalida], (err, stdout, stderr) => {
      if (err) return reject(new Error('PDF: ' + (stderr || err.message)));
      resolve(rutaSalida);
    });
  });
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

async function correrPipeline(cfg, onProgress = () => {}) {
  const {
    YOUTUBE_API_KEY, APIFY_TOKEN, ANTHROPIC_API_KEY,
    GOOGLE_CREDS, GOOGLE_DRIVE_FOLDER_ID,
    MAX_POR_PLATAFORMA = 30,
  } = cfg;

  const ahora = new Date();
  const mes = MESES[ahora.getMonth()];
  const anio = ahora.getFullYear();
  const fechaGen = `${String(ahora.getDate()).padStart(2, '0')}/${String(ahora.getMonth() + 1).padStart(2, '0')}/${anio}`;

  const nichosAnalizados = [];

  // procesar nichos en serie (para no saturar Apify/Claude y controlar costo)
  for (let i = 0; i < nichos.length; i++) {
    const nicho = nichos[i];
    onProgress(`Nicho ${i + 1}/12: ${nicho.nombre} — buscando...`);

    // buscar en las 3 fuentes en paralelo
    const [yt, tk, ig] = await Promise.all([
      buscarYouTube(nicho, YOUTUBE_API_KEY, 15).catch(() => []),
      buscarTikTok(nicho, APIFY_TOKEN, MAX_POR_PLATAFORMA).catch(() => []),
      buscarInstagram(nicho, APIFY_TOKEN, MAX_POR_PLATAFORMA).catch(() => []),
    ]);

    const candidatos = [...yt, ...tk, ...ig];
    onProgress(`Nicho ${i + 1}/12: ${nicho.nombre} — ${candidatos.length} candidatos, analizando...`);

    const analizado = await analizarNicho(nicho, candidatos, ANTHROPIC_API_KEY);
    nichosAnalizados.push(analizado);
  }

  onProgress('Armando Top 5 del mes...');
  const top5 = await armarTop5(nichosAnalizados, ANTHROPIC_API_KEY);

  const datos = {
    mes, anio, fecha_generacion: fechaGen,
    top5, nichos: nichosAnalizados,
  };

  onProgress('Generando PDF...');
  const nombreArchivo = `Tendencias_${mes}_${anio}.pdf`;
  const pdfPath = path.join('/tmp', nombreArchivo);
  await generarPDF(datos, pdfPath);

  onProgress('Subiendo a Google Drive...');
  let drive = null;
  try {
    drive = await subirADrive(pdfPath, nombreArchivo, GOOGLE_CREDS, GOOGLE_DRIVE_FOLDER_ID);
  } catch (e) { console.error('[Drive] error subida:', e.message); }

  const totalTend = nichosAnalizados.reduce((s, n) => s + (n.tendencias ? n.tendencias.length : 0), 0);
  const nichosConTend = nichosAnalizados.filter((n) => n.tendencias && n.tendencias.length > 0).length;

  return {
    pdfPath,
    nombreArchivo,
    driveLink: drive ? drive.link : null,
    resumen: { mes, anio, totalTend, nichosConTend, top5 },
  };
}

module.exports = { correrPipeline };

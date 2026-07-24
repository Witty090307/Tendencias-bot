// ── Servidor del Bot de Tendencias ──
// n8n llama a POST /generar-async -> corre el pipeline -> avisa al callbackUrl.
// El PDF queda disponible en GET /pdf/:archivo para que n8n lo baje y lo mande
// por Telegram como documento adjunto (ya no dependemos de Google Drive).

const express = require('express');
const fs = require('fs');
const path = require('path');
const { correrPipeline } = require('./orquestador');

const app = express();
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT || 3000;

function getConfig() {
  return {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    APIFY_TOKEN: process.env.APIFY_TOKEN,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_CREDS: process.env.GOOGLE_CREDS,
    GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID,
    MAX_POR_PLATAFORMA: parseInt(process.env.MAX_POR_PLATAFORMA || '30', 10),
  };
}

app.get('/', (req, res) => {
  res.json({ ok: true, servicio: 'Bot de Tendencias Escalando', version: '1.1' });
});

app.get('/health', (req, res) => res.json({ ok: true }));

// ── Descargar el PDF generado (lo usa n8n para mandarlo por Telegram) ──
app.get('/pdf/:archivo', (req, res) => {
  const nombre = path.basename(req.params.archivo); // evita rutas raras
  const ruta = path.join('/tmp', nombre);
  if (!fs.existsSync(ruta)) {
    return res.status(404).json({ ok: false, error: 'archivo no encontrado' });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="' + nombre + '"');
  fs.createReadStream(ruta).pipe(res);
});

// ── Listar lo que hay en /tmp (util para depurar) ──
app.get('/archivos', (req, res) => {
  try {
    const files = fs.readdirSync('/tmp').filter(f => f.startsWith('Tendencias_'));
    res.json({ ok: true, archivos: files });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── MODO SINCRONO (se cuelga si tarda mucho; sirve para pruebas cortas) ──
app.post('/generar', async (req, res) => {
  const cfg = getConfig();
  console.log('[server] /generar disparado', new Date().toISOString());
  try {
    const r = await correrPipeline(cfg, (msg) => console.log('  ·', msg));
    console.log('[server] listo:', r.nombreArchivo);
    res.json({
      ok: true,
      archivo: r.nombreArchivo,
      pdfUrl: req.protocol + '://' + req.get('host') + '/pdf/' + r.nombreArchivo,
      driveLink: r.driveLink,
      resumen: r.resumen,
    });
  } catch (e) {
    console.error('[server] error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── MODO ASINCRONO: responde de inmediato y avisa al callbackUrl al terminar ──
app.post('/generar-async', (req, res) => {
  const cfg = getConfig();
  const callbackUrl = req.body && req.body.callbackUrl;
  const baseUrl = req.protocol + '://' + req.get('host');
  res.json({ ok: true, mensaje: 'Pipeline arrancado en segundo plano' });

  (async () => {
    let payload;
    try {
      const r = await correrPipeline(cfg, (msg) => console.log('  ·', msg));
      payload = {
        ok: true,
        archivo: r.nombreArchivo,
        pdfUrl: baseUrl + '/pdf/' + r.nombreArchivo,
        driveLink: r.driveLink,
        resumen: r.resumen,
      };
      console.log('[server async] listo:', r.nombreArchivo);
    } catch (e) {
      console.error('[server async] error:', e.message);
      payload = { ok: false, error: e.message };
    }

    if (!callbackUrl) return;
    try {
      const https = require('https');
      const body = JSON.stringify(payload);
      const u = new URL(callbackUrl);
      const req2 = https.request({
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      });
      req2.on('error', (err) => console.error('[callback] error:', err.message));
      req2.write(body);
      req2.end();
    } catch (e) {
      console.error('[callback] no se pudo avisar:', e.message);
    }
  })();
});

app.listen(PORT, () => console.log('Bot de Tendencias escuchando en :' + PORT));

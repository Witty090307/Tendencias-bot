// ── Servidor del Bot de Tendencias ──
// n8n llama a POST /generar → corre el pipeline → responde con el link de Drive.
// El Telegram lo manda n8n (no este servicio), para que el aviso quede en tu flujo.
//
// Como el pipeline tarda varios minutos, hay 2 modos:
//   - /generar          : corre y responde al terminar (para cron, n8n espera)
//   - /generar-async    : arranca en segundo plano y responde de inmediato (webhook de vuelta)

const express = require('express');
const { correrPipeline } = require('./orquestador');

const app = express();
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT || 3000;

// junta la config desde variables de entorno
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
  res.json({ ok: true, servicio: 'Bot de Tendencias Escalando', version: '1.0' });
});

// health check
app.get('/health', (req, res) => res.json({ ok: true }));

// MODO SÍNCRONO: corre y responde al final (n8n espera). Ideal para el cron.
app.post('/generar', async (req, res) => {
  const cfg = getConfig();
  console.log('[server] /generar disparado', new Date().toISOString());
  try {
    const r = await correrPipeline(cfg, (msg) => console.log('  ·', msg));
    console.log('[server] listo:', r.nombreArchivo, r.driveLink || '(sin drive)');
    res.json({
      ok: true,
      archivo: r.nombreArchivo,
      driveLink: r.driveLink,
      resumen: r.resumen,
    });
  } catch (e) {
    console.error('[server] error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// MODO ASÍNCRONO: responde de inmediato y avisa a un webhook al terminar.
// Útil si n8n tiene timeout corto. Pasa "callbackUrl" en el body.
app.post('/generar-async', (req, res) => {
  const cfg = getConfig();
  const callbackUrl = req.body && req.body.callbackUrl;
  res.json({ ok: true, mensaje: 'Pipeline arrancado en segundo plano' });

  (async () => {
    try {
      const r = await correrPipeline(cfg, (msg) => console.log('  ·', msg));
      if (callbackUrl) {
        const https = require('https');
        const body = JSON.stringify({ ok: true, archivo: r.nombreArchivo, driveLink: r.driveLink, resumen: r.resumen });
        const u = new URL(callbackUrl);
        const req2 = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } });
        req2.write(body); req2.end();
      }
    } catch (e) {
      console.error('[server async] error:', e.message);
      if (callbackUrl) {
        const https = require('https');
        const body = JSON.stringify({ ok: false, error: e.message });
        const u = new URL(callbackUrl);
        const req2 = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } });
        req2.write(body); req2.end();
      }
    }
  })();
});

app.listen(PORT, () => console.log(`Bot de Tendencias escuchando en :${PORT}`));

// ── Analizador con Claude ──
// Toma los candidatos crudos de un nicho (métricas + link + caption + hashtags)
// y devuelve las 3-5 mejores tendencias YA ANALIZADAS según las reglas del docx.
// Claude filtra basura, prioriza con métricas y escribe todos los campos.

const https = require('https');

const MODELO = 'claude-sonnet-4-6';  // Sonnet: ~5x mas barato que Opus, calidad de sobra para analisis de tendencias

function callClaude(apiKey, prompt, maxTokens = 4000) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODELO,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    const req = https.request(
      { hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(body),
        }, timeout: 120000 },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const j = JSON.parse(data);
            if (j.error) return reject(new Error('Claude: ' + j.error.message));
            const txt = (j.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
            resolve(txt);
          } catch (e) { reject(new Error('Claude JSON inválido: ' + data.slice(0, 200))); }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Claude timeout')); });
    req.write(body);
    req.end();
  });
}

// limpia el JSON que a veces viene con ```json ... ```
function parseJSON(txt) {
  let t = txt.trim();
  t = t.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  const start = t.indexOf('[');
  const startObj = t.indexOf('{');
  const realStart = start === -1 ? startObj : (startObj === -1 ? start : Math.min(start, startObj));
  if (realStart > 0) t = t.slice(realStart);
  return JSON.parse(t);
}

async function analizarNicho(nicho, candidatos, apiKey) {
  // si no hay candidatos, el nicho se declara sin tendencias
  if (!candidatos || candidatos.length === 0) {
    return { nicho: nicho.nombre, clientes: nicho.clientes, sin_tendencias: true, tendencias: [] };
  }

  // recortar a lo esencial para no gastar tokens de más
  const candidatosLimpios = candidatos.slice(0, 15).map((c, i) => ({
    n: i + 1,
    plataforma: c.plataforma,
    titulo: c.titulo,
    link: c.link,
    canal: c.canal,
    caption: (c.caption || '').slice(0, 300),
    vistas: c.vistas, likes: c.likes, comentarios: c.comentarios,
    compartidos: c.compartidos || 0,
    hashtags: (c.hashtags || []).slice(0, 8),
    publicado: c.publicado,
  }));

  const idioma = nicho.idioma === 'en' ? 'inglés (mercado USA)' : 'español';

  const prompt = `Eres el investigador de tendencias de contenido de Escalando Marketing Digital (agencia en Nogales, Sonora). Analiza estos videos candidatos del nicho "${nicho.nombre}" y devuelve SOLO las mejores tendencias adaptables a los clientes de la agencia.

CLIENTES DE ESTE NICHO: ${nicho.clientes.join(', ')}
REGLAS ESPECIALES: ${nicho.reglas}
IDIOMA DEL ANÁLISIS: ${idioma}

CANDIDATOS (con métricas reales):
${JSON.stringify(candidatosLimpios, null, 1)}

INSTRUCCIONES:
1. Elige MÁXIMO 3-5 tendencias. Si solo 1 vale la pena, devuelve 1. Si NINGUNA sirve, devuelve [].
2. PROHIBIDO rellenar con basura: nada de puro baile sin mecánica adaptable, nada irrelevante al giro, nada que dependa de un audio/meme muerto.
3. Cada tendencia debe tener un camino CLARO hacia al menos un cliente de este nicho.
4. Respeta las reglas especiales (compliance sanitario = sin promesas de cura; mercado/idioma; El Pescadito sin WhatsApp; etc.).
5. Ordena de MAYOR a MENOR prioridad.
6. La descripción visual debe permitir entender el video SIN abrirlo (hook de primeros 3s, qué pasa en pantalla, formato, estilo, remate).

Devuelve EXCLUSIVAMENTE un array JSON (sin texto antes ni después, sin markdown) con esta forma exacta:
[
  {
    "titulo": "título o primera línea del video",
    "plataforma": "YouTube Shorts | TikTok | Facebook/Instagram Reels",
    "link": "url exacta del candidato",
    "descripcion_visual": "qué se ve escena por escena, hook 0-3s, formato (vertical, duración aprox), estilo (cámara en mano/dron/close-up/voz en off/texto/música), y remate. Completo pero conciso.",
    "por_que_funciona": "la mecánica en 1-2 líneas (curiosidad, antojo, transformación, humor, ASMR, reveal, identificación local, etc.)",
    "clientes_recomendados": "cuál(es) cliente(s) de este nicho y por qué a ese en particular",
    "como_adaptar": "el giro que la haría propia del cliente sin copiarla idéntica",
    "nivel_produccion": "Fácil | Medio | Alto",
    "clasificacion_3v": "Viralidad | Valor | Venta | o combinación (ej. 'Viralidad + Valor')",
    "vigencia": "fecha aprox detectada y si está: subiendo | en pico | de salida",
    "prioridad": "ALTA | MEDIA | BAJA",
    "metrica_dura": "la cifra que justifica (ej. '2.4M vistas, engagement alto, replicada por varias cuentas')",
    "justificacion": "una línea: por qué aportaría rendimiento (producción fácil + hook adaptable + sigue subiendo, etc.)"
  }
]`;

  let txt;
  try { txt = await callClaude(apiKey, prompt, 4500); }
  catch (e) { console.error(`[Claude] nicho ${nicho.id}:`, e.message); return { nicho: nicho.nombre, clientes: nicho.clientes, error: true, tendencias: [] }; }

  let tendencias;
  try { tendencias = parseJSON(txt); }
  catch (e) { console.error(`[Claude] parse ${nicho.id}:`, e.message, txt.slice(0, 150)); tendencias = []; }

  return {
    nicho: nicho.nombre,
    clientes: nicho.clientes,
    sin_tendencias: tendencias.length === 0,
    tendencias,
  };
}

// arma el TOP 5 cross-nicho para el resumen ejecutivo
async function armarTop5(nichosAnalizados, apiKey) {
  const todas = [];
  nichosAnalizados.forEach((n) => {
    (n.tendencias || []).forEach((t) => todas.push({ nicho: n.nicho, ...t }));
  });
  if (todas.length === 0) return [];

  const resumen = todas.map((t, i) => ({
    n: i + 1, nicho: t.nicho, titulo: t.titulo,
    prioridad: t.prioridad, metrica: t.metrica_dura, plataforma: t.plataforma,
  }));

  const prompt = `De estas tendencias de contenido de todos los nichos, elige las 5 MÁS FUERTES del mes (cross-nicho) para el resumen ejecutivo. Prioriza tracción real + replicabilidad + encaje con la cartera.

TENDENCIAS:
${JSON.stringify(resumen, null, 1)}

Devuelve EXCLUSIVAMENTE un array JSON (sin markdown) con las 5 mejores:
[
  { "nicho": "...", "titulo": "...", "prioridad": "ALTA|MEDIA|BAJA", "razon": "una línea de por qué está en el top 5" }
]`;

  try {
    const txt = await callClaude(apiKey, prompt, 1500);
    return parseJSON(txt);
  } catch (e) {
    console.error('[Claude] top5:', e.message);
    // fallback: las primeras 5 con prioridad ALTA
    return todas.filter((t) => t.prioridad === 'ALTA').slice(0, 5)
      .map((t) => ({ nicho: t.nicho, titulo: t.titulo, prioridad: t.prioridad, razon: t.justificacion || '' }));
  }
}

module.exports = { analizarNicho, armarTop5 };

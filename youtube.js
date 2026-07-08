// ── YouTube Data API v3 ──
// Busca Shorts recientes por término. Oficial y gratis (10k unidades/día).
// search.list cuesta 100 unidades → con 12 nichos × pocos términos alcanza bien.
// Estrategia de ahorro: 1 búsqueda por nicho (el término más fuerte), no por cada término.

const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('YouTube JSON inválido: ' + data.slice(0, 200))); }
      });
    }).on('error', reject);
  });
}

// Busca videos cortos de un nicho. Devuelve candidatos normalizados.
async function buscarYouTube(nicho, apiKey, maxResultados = 15) {
  if (!apiKey) return [];
  const termino = nicho.terminos[0]; // el más fuerte, para ahorrar cuota
  const region = nicho.idioma === 'en' ? 'US' : 'MX';
  const lang = nicho.idioma === 'en' ? 'en' : 'es';

  // fecha: solo últimos 45 días (tendencias frescas)
  const publishedAfter = new Date(Date.now() - 45 * 864e5).toISOString();

  const q = encodeURIComponent(termino);
  const searchUrl =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video` +
    `&videoDuration=short&order=viewCount&maxResults=${maxResultados}` +
    `&regionCode=${region}&relevanceLanguage=${lang}` +
    `&publishedAfter=${publishedAfter}&q=${q}&key=${apiKey}`;

  let search;
  try { search = await get(searchUrl); }
  catch (e) { console.error(`[YT] error búsqueda ${nicho.id}:`, e.message); return []; }

  if (search.error) {
    console.error(`[YT] API error ${nicho.id}:`, search.error.message);
    return [];
  }
  const items = search.items || [];
  if (!items.length) return [];

  // traer estadísticas (vistas, likes) — videos.list cuesta solo 1 unidad
  const ids = items.map((i) => i.id.videoId).filter(Boolean).join(',');
  let stats = {};
  try {
    const statsUrl =
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails` +
      `&id=${ids}&key=${apiKey}`;
    const statsRes = await get(statsUrl);
    (statsRes.items || []).forEach((v) => { stats[v.id] = v; });
  } catch (e) { /* si falla, seguimos sin stats */ }

  return items.map((it) => {
    const vid = it.id.videoId;
    const st = stats[vid] || {};
    const s = st.statistics || {};
    return {
      plataforma: 'YouTube Shorts',
      titulo: it.snippet.title,
      link: `https://www.youtube.com/shorts/${vid}`,
      canal: it.snippet.channelTitle,
      caption: it.snippet.description || '',
      publicado: it.snippet.publishedAt,
      vistas: parseInt(s.viewCount || 0, 10),
      likes: parseInt(s.likeCount || 0, 10),
      comentarios: parseInt(s.commentCount || 0, 10),
      hashtags: [],
    };
  });
}

module.exports = { buscarYouTube };

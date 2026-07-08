// ── Apify: TikTok + Instagram/Facebook Reels ──
// Un solo servicio (un token) cubre las dos plataformas que no tienen API oficial.
// Usa "run-sync-get-dataset-items" para correr el actor y traer resultados en una llamada.
//
// Actors usados (los más estables, verificados 2026):
//   TikTok:    clockworks/tiktok-scraper  (búsqueda por hashtag/keyword con métricas)
//   Instagram: apify/instagram-scraper    (búsqueda por hashtag, trae reels con métricas)
//
// Tope de resultados configurable para controlar costo (~$1-2/mes con 30 por nicho).

const https = require('https');

function postApify(actorId, token, input) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(input);
    const path = `/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}`;
    const req = https.request(
      { hostname: 'api.apify.com', path, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: 180000 },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error('Apify JSON inválido: ' + data.slice(0, 200))); }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Apify timeout')); });
    req.write(body);
    req.end();
  });
}

// ── TikTok ──
async function buscarTikTok(nicho, token, maxResultados = 30) {
  if (!token) return [];
  const input = {
    searchQueries: nicho.terminos.slice(0, 2),
    resultsPerPage: Math.ceil(maxResultados / 2),
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
    proxyConfiguration: { useApifyProxy: true },
  };
  let items;
  try { items = await postApify('clockworks~tiktok-scraper', token, input); }
  catch (e) { console.error(`[TikTok] ${nicho.id}:`, e.message); return []; }
  if (!Array.isArray(items)) return [];

  return items.map((v) => ({
    plataforma: 'TikTok',
    titulo: (v.text || '').slice(0, 120),
    link: v.webVideoUrl || (v.id ? `https://www.tiktok.com/@${v.authorMeta?.name || ''}/video/${v.id}` : ''),
    canal: v.authorMeta?.name || v.authorMeta?.nickName || '',
    caption: v.text || '',
    publicado: v.createTimeISO || '',
    vistas: v.playCount || 0,
    likes: v.diggCount || 0,
    comentarios: v.commentCount || 0,
    compartidos: v.shareCount || 0,
    hashtags: (v.hashtags || []).map((h) => h.name).filter(Boolean),
  })).filter((x) => x.link);
}

// ── Instagram / Facebook Reels ──
async function buscarInstagram(nicho, token, maxResultados = 30) {
  if (!token) return [];
  // buscamos por hashtag: convertimos los términos a hashtags (sin espacios)
  const hashtags = nicho.terminos.slice(0, 2).map((t) => t.replace(/\s+/g, ''));
  const input = {
    search: hashtags[0],
    searchType: 'hashtag',
    resultsType: 'posts',
    resultsLimit: maxResultados,
    onlyPostsNewerThan: '45 days',
    proxyConfiguration: { useApifyProxy: true },
  };
  let items;
  try { items = await postApify('apify~instagram-scraper', token, input); }
  catch (e) { console.error(`[IG] ${nicho.id}:`, e.message); return []; }
  if (!Array.isArray(items)) return [];

  return items
    .filter((p) => p.type === 'Video' || p.productType === 'clips' || p.videoUrl) // solo reels/video
    .map((p) => ({
      plataforma: 'Facebook/Instagram Reels',
      titulo: (p.caption || '').slice(0, 120),
      link: p.url || '',
      canal: p.ownerUsername || '',
      caption: p.caption || '',
      publicado: p.timestamp || '',
      vistas: p.videoViewCount || p.videoPlayCount || 0,
      likes: p.likesCount || 0,
      comentarios: p.commentsCount || 0,
      hashtags: (p.hashtags || []),
    }))
    .filter((x) => x.link);
}

module.exports = { buscarTikTok, buscarInstagram };

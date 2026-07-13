# Bot de Tendencias Mensual — Escalando Marketing Digital

Microservicio que, una vez al mes, busca tendencias de video en **YouTube, TikTok y Facebook/Instagram** para los 12 nichos de la cartera, las analiza con Claude, genera un **PDF con diseño ESFERA**, lo sube a **Google Drive** y avisa por **Telegram**.

## Cómo funciona (arquitectura)

```
n8n (cron día 20, 8am)
   → POST /generar al microservicio
        1. Por cada nicho: busca en YouTube + TikTok + Instagram (paralelo)
        2. Claude filtra los mejores 3-5 y escribe el análisis completo
        3. Claude arma el Top 5 cross-nicho
        4. Genera el PDF ESFERA (weasyprint)
        5. Sube a Google Drive
   → responde con el link
   → n8n manda el Telegram "ya quedó"
```

El microservicio hace el trabajo pesado. n8n solo dispara y avisa.

## Las claves que necesitas (5)

| Variable | Qué es | Dónde se saca | Costo |
|---|---|---|---|
| `YOUTUBE_API_KEY` | API key de YouTube Data API v3 | Google Cloud Console → habilitar YouTube Data API v3 → crear API key | Gratis (10k u/día) |
| `APIFY_TOKEN` | Token de Apify (TikTok + Instagram) | apify.com → Settings → Integrations → API token | ~$1-2/mes con tope 30 |
| `ANTHROPIC_API_KEY` | API key de Claude | console.anthropic.com | Por uso (~pocos centavos/corrida) |
| `GOOGLE_CREDS` | JSON de service account (para subir a Drive) | Google Cloud → service account → key JSON (todo en una línea) | Gratis |
| `GOOGLE_DRIVE_FOLDER_ID` | ID de la carpeta de Drive destino | El ID en la URL de la carpeta | Gratis |
| `MAX_POR_PLATAFORMA` | Tope de resultados por plataforma por nicho | (opcional, default 30) | Controla el costo |

**IMPORTANTE sobre Drive:** la service account debe tener acceso a la carpeta. Comparte la carpeta de Drive con el email de la service account (termina en `...iam.gserviceaccount.com`), con permiso de Editor.

## Desplegar en Railway

1. Sube este repo a GitHub.
2. En Railway: New Project → Deploy from GitHub → este repo.
3. En Variables, pega las 5 claves de arriba.
4. Railway detecta `nixpacks.toml` e instala Node + Python + weasyprint solo.
5. Copia la URL pública que te da Railway (ej. `https://tendencias-xxxx.up.railway.app`).

## Conectar n8n

1. Importa `flujo_n8n_tendencias.json`.
2. En el nodo 2, cambia `https://TU-SERVICIO.up.railway.app/generar` por tu URL real de Railway.
3. En el nodo 4 (Telegram), conecta tu bot.
4. El cron está en día 20 a las 8am (hora Nogales). Cámbialo si quieres otra fecha.
5. Actívalo.

## Probar manualmente

```bash
curl -X POST https://tu-servicio.up.railway.app/generar
```

Tarda varios minutos (12 nichos × 3 APIs × Claude). Al terminar responde con el link de Drive.

## Ajustar los nichos o términos de búsqueda

Todo vive en `src/nichos.js`. Cada nicho tiene sus `terminos` de búsqueda, `clientes` y `reglas`. Edítalo ahí y redespliega.

## Notas de costo

Con `MAX_POR_PLATAFORMA=30`: 12 nichos × 2 plataformas Apify × 30 ≈ 720 resultados/mes ≈ **$1-2 USD** en Apify. YouTube gratis. Claude: unos centavos por corrida. Apify da $5 de crédito gratis al mes, así que puede salir casi gratis.

## Endpoints

- `POST /generar` — corre todo y responde al terminar (lo usa el cron).
- `POST /generar-async` — arranca en segundo plano, responde de inmediato; avisa a `callbackUrl` al terminar (por si n8n tiene timeout corto).
- `GET /health` — health check.

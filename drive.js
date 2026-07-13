// ── Subir el PDF a Google Drive ──
// Usa una service account (JSON de credenciales) para subir a la carpeta que Daniel defina.
// La carpeta se pasa por env GOOGLE_DRIVE_FOLDER_ID.

const fs = require('fs');

async function subirADrive(rutaPDF, nombreArchivo, credsJSON, folderId) {
  if (!credsJSON || !folderId) {
    console.log('[Drive] sin credenciales o folder, se omite subida');
    return null;
  }
  const { google } = require('googleapis');
  let creds;
  try { creds = typeof credsJSON === 'string' ? JSON.parse(credsJSON) : credsJSON; }
  catch (e) { console.error('[Drive] creds inválidas:', e.message); return null; }

  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  const drive = google.drive({ version: 'v3', auth });

  const res = await drive.files.create({
    requestBody: {
      name: nombreArchivo,
      parents: [folderId],
    },
    media: {
      mimeType: 'application/pdf',
      body: fs.createReadStream(rutaPDF),
    },
    fields: 'id, webViewLink',
  });

  // hacer el link visible para quien tenga el enlace (opcional, cómodo para el equipo)
  try {
    await drive.permissions.create({
      fileId: res.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });
  } catch (e) { /* si la política del drive no lo permite, no pasa nada */ }

  return { id: res.data.id, link: res.data.webViewLink };
}

module.exports = { subirADrive };

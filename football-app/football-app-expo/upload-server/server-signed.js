// Minimal signed-url server for GCS / Firebase Storage
const express = require('express');
const admin = require('firebase-admin');

let app;
try {
  const sa = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    storageBucket: sa.project_id ? `${sa.project_id}.appspot.com` : 'footballapp-90e32.appspot.com',
  });
  app = express();
  app.use(express.json());

  const bucket = admin.storage().bucket();

  app.post('/generateUploadUrl', async (req, res) => {
    try {
      const idToken = req.headers.authorization?.split(' ')[1];
      if (!idToken) return res.status(401).json({ error: 'Missing token' });
      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;

      const { filename, contentType = 'application/octet-stream' } = req.body;
      if (!filename) return res.status(400).json({ error: 'filename required' });

      const target = `avatars/${uid}/${Date.now()}-${filename}`;
      const file = bucket.file(target);

      const expires = Date.now() + 15 * 60 * 1000;
      const [uploadUrl] = await file.getSignedUrl({ version: 'v4', action: 'write', expires, contentType });
      const [readUrl] = await file.getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });

      res.json({ uploadUrl, readUrl, path: target });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(3000, () => console.log('signed-url server listening on :3000'));
} catch (e) {
  // If service account is missing, start a stub server that returns helpful errors
  app = express();
  app.use(express.json());
  app.post('/generateUploadUrl', (req, res) => {
    res.status(500).json({ error: 'serviceAccountKey.json missing in upload-server/; copy your service account JSON here' });
  });
  app.listen(3000, () => console.log('signed-url stub listening on :3000 (no credentials)'));
}

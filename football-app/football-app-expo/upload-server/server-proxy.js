// Minimal proxy upload server for Firebase Storage
const express = require('express');
const admin = require('firebase-admin');
const multer = require('multer');

let app;
try {
  const sa = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    storageBucket: sa.project_id ? `${sa.project_id}.appspot.com` : 'footballapp-90e32.appspot.com',
  });
  const bucket = admin.storage().bucket();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
  app = express();

  app.post('/uploadAvatar', upload.single('avatar'), async (req, res) => {
    try {
      const idToken = req.headers.authorization?.split(' ')[1];
      if (!idToken) return res.status(401).json({ error: 'Missing token' });
      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;

      if (!req.file) return res.status(400).json({ error: 'file required' });

      const filename = `${Date.now()}-${req.file.originalname}`;
      const target = `avatars/${uid}/${filename}`;
      const file = bucket.file(target);

      const stream = file.createWriteStream({ metadata: { contentType: req.file.mimetype }, resumable: false });
      stream.on('error', (err) => { console.error('upload error', err); res.status(500).json({ error: err.message }); });
      stream.on('finish', async () => {
        const [readUrl] = await file.getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });
        res.json({ path: target, url: readUrl });
      });
      stream.end(req.file.buffer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(3000, () => console.log('proxy upload server listening on :3000'));
} catch (e) {
  app = express();
  app.post('/uploadAvatar', (req, res) => {
    res.status(500).json({ error: 'serviceAccountKey.json missing in upload-server/; copy your service account JSON here' });
  });
  app.listen(3000, () => console.log('proxy upload stub listening on :3000 (no credentials)'));
}

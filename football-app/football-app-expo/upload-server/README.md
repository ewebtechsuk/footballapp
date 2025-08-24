Upload server helper

Place your Firebase/GCP service account JSON as `upload-server/serviceAccountKey.json` and run one of:

- Signed URL server: `npm run start:signed` (returns a v4 signed PUT URL on POST /generateUploadUrl)
- Proxy server: `npm run start:proxy` (accepts multipart POST /uploadAvatar and uploads server-side)

Both servers listen on port 3000. If `serviceAccountKey.json` is missing the servers run in stub mode and return helpful errors.

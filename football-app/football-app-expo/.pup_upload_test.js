const puppeteer = require('puppeteer');
(async () => {
  const url = process.argv[2] || 'http://localhost:8081';
  const b = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox']});
  const p = await b.newPage();
  p.on('console', m => console.log('BROWSER:', m.type(), m.text()));
  p.on('pageerror', e => console.log('PAGE_ERROR', e.message));
  p.on('requestfailed', r => console.log('REQUEST_FAILED', r.url(), r.failure() && r.failure().errorText));
  p.on('request', r => {
    const url = r.url();
    if (url.includes('googleapis') || url.includes('firebasestorage') || url.includes('/__/auth')) {
      console.log('REQUEST', r.method(), url);
    }
  });
  const delay = ms => new Promise(r => setTimeout(r, ms));
  console.log('NAV TO', url);
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  console.log('LOADED');
  // try to click Profile (assumes a nav with text 'Profile' exists)
  const clickIf = async (selectorOrText) => {
    try {
      await delay(500);
      const el = await p.$x("//*[text()=\"Profile\"]");
      if (el && el[0]) { await el[0].click(); console.log('CLICKED Profile'); return true; }
    } catch(e){ console.log('CLICK_ERR', e.message); }
    return false;
  }
  await clickIf('Profile');
  // wait and try to navigate to Edit Profile
  await delay(2000);
  try {
    const edit = await p.$x("//*[contains(text(),'Edit') or contains(text(),'Edit Profile')]");
    if (edit && edit[0]) { await edit[0].click(); console.log('CLICKED Edit'); }
  } catch(e){ console.log('EDIT_CLICK_ERR', e.message); }
  await delay(2000);
  // try to find a file input and upload a small png
  try {
    const input = await p.$('input[type=file]');
    if (input) {
      console.log('FOUND_FILE_INPUT');
      const fs = require('fs');
      const tmp = '/tmp/avatar.png';
      fs.writeFileSync(tmp, Buffer.from([0x89,0x50,0x4e,0x47,0x0a]));
      await input.uploadFile(tmp);
      console.log('UPLOADED_FILE');
    } else console.log('NO_FILE_INPUT');
  } catch(e){ console.log('UPLOAD_ERR', e.message); }
  await delay(5000);
  await b.close();
  process.exit(0);
})();

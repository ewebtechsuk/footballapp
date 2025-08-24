const puppeteer = require('puppeteer');
const fs = require('fs');
(async()=>{
  const url = process.argv[2] || 'http://localhost:8081';
  const b = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox']});
  const p = await b.newPage();
  p.on('console', m => console.log('BROWSER:', m.type(), m.text()));
  p.on('pageerror', e => console.log('PAGE_ERROR', e.message));
  p.on('requestfailed', r => console.log('REQUEST_FAILED', r.url(), r.failure() && r.failure().errorText));
  p.on('request', r => { const u=r.url(); if (u.includes('firebasestorage')||u.includes('googleapis')||u.includes('/__/auth')) console.log('REQUEST', r.method(), u); });
  console.log('NAV TO', url);
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  console.log('LOADED');
  // inject monkeypatch to capture programmatic file inputs
  await p.evaluate(() => {
    window.__origCreateElement = document.createElement.bind(document);
    document.createElement = function(tagName) {
      const el = window.__origCreateElement(tagName);
      // when code later sets type='file', intercept via setter
      if (tagName.toLowerCase() === 'input') {
        const origSet = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'type')?.set;
        // don't override globally; instead wrap el when its type is assigned
        const origSetAttr = el.setAttribute.bind(el);
        el.setAttribute = function(name, value) {
          if (name === 'type' && String(value).toLowerCase() === 'file') {
            try {
              el.id = '__captured_file_input';
              document.body.appendChild(el);
            } catch(e){}
          }
          return origSetAttr(name, value);
        };
      }
      return el;
    };
    // also monkeypatch click on inputs to ensure file input gets appended
    const origClick = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function() {
      try { if (this.type === 'file') { this.id = '__captured_file_input'; if (!document.getElementById('__captured_file_input')) document.body.appendChild(this); } } catch(e){}
      try { return origClick.apply(this, arguments); } catch(e) { return; }
    };
  });
  // navigate to Profile
  await p.evaluate(() => { const all=Array.from(document.querySelectorAll('button,a')); const btn=all.find(e=> (e.innerText||'').trim().toLowerCase()==='profile'); if(btn) btn.click(); });
  await new Promise(r=>setTimeout(r,1000));
  // click Edit Profile
  await p.evaluate(() => { const all=Array.from(document.querySelectorAll('button,a')); const btn=all.find(e=> (e.innerText||'').trim().toLowerCase().includes('edit')); if(btn) btn.click(); });
  await new Promise(r=>setTimeout(r,1000));
  // click Choose Avatar
  await p.evaluate(() => { const all=Array.from(document.querySelectorAll('button,input[type=button]')); const btn=all.find(e=> (e.innerText||'').trim().toLowerCase().includes('choose avatar')); if(btn) btn.click(); });
  // wait for captured input
  let found = false;
  for (let i=0;i<10;i++) {
    const exists = await p.evaluate(() => !!document.getElementById('__captured_file_input'));
    if (exists) { found = true; break; }
    await new Promise(r=>setTimeout(r,300));
  }
  console.log('CAPTURED_INPUT=', found);
  if (!found) { console.log('No file input captured; aborting.'); await b.close(); process.exit(0); }
  // write a small test png
  const tmp = '/tmp/avatar_test.png';
  fs.writeFileSync(tmp, Buffer.from([0x89,0x50,0x4e,0x47,0x0a]));
  const input = await p.$('#__captured_file_input');
  if (!input) { console.log('ELEMENT_HANDLE_MISSING'); await b.close(); process.exit(1); }
  await input.uploadFile(tmp);
  console.log('UPLOADED_FILE_TO_INPUT');
  // dispatch change
  await p.evaluate(() => {
    const i = document.getElementById('__captured_file_input');
    if (i) {
      const ev = new Event('change', { bubbles: true });
      i.dispatchEvent(ev);
    }
  });
  console.log('DISPATCHED_CHANGE');
  // wait for network events / console logs
  await new Promise(r=>setTimeout(r,8000));
  await b.close();
  process.exit(0);
})();

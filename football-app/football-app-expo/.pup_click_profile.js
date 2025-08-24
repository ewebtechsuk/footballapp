const puppeteer = require('puppeteer');
(async()=>{
  const url = process.argv[2] || 'http://localhost:8081';
  const b = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox']});
  const p = await b.newPage();
  p.on('console', m => console.log('BROWSER:', m.type(), m.text()));
  p.on('pageerror', e => console.log('PAGE_ERROR', e.message));
  p.on('request', r => { const u=r.url(); if (u.includes('firebasestorage')||u.includes('googleapis')||u.includes('/__/auth')) console.log('REQUEST', r.method(), u); });
  console.log('NAV TO', url);
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  console.log('LOADED');
  // click a button whose visible text is 'Profile'
  const clicked = await p.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, a'));
    const btn = all.find(e => (e.innerText||'').trim().toLowerCase() === 'profile');
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('CLICKED_PROFILE=', clicked);
  // wait for SPA render
  await new Promise(r => setTimeout(r, 2000));
  // dump short snapshot
  const snapshot = await p.evaluate(() => {
    const text = document.body.innerText.slice(0,1000);
    const inputs = Array.from(document.querySelectorAll('input[type=file]')).map(i=>({name:i.name||null, id:i.id||null, accept:i.accept||null, outer:i.outerHTML.slice(0,200)}));
    const buttons = Array.from(document.querySelectorAll('button,a')).slice(0,50).map(e=>({t:(e.innerText||'').trim().slice(0,200)}));
    return { text, inputs, buttons };
  });
  console.log('SNAPSHOT', JSON.stringify(snapshot, null, 2));
  await new Promise(r => setTimeout(r, 3000));
  await b.close();
})();

const puppeteer = require('puppeteer');
(async()=>{
  const url = process.argv[2] || 'http://localhost:8081';
  const b = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox']});
  const p = await b.newPage();
  p.on('console', m => console.log('BROWSER:', m.type(), m.text()));
  p.on('pageerror', e => console.log('PAGE_ERROR', e.message));
  console.log('NAV TO', url);
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  console.log('LOADED');
  const snapshot = await p.evaluate(() => {
    const body = document.body.innerHTML.slice(0, 20000);
    const inputs = Array.from(document.querySelectorAll('input[type=file]')).map(i => ({ name: i.name||null, id: i.id||null, accept: i.accept||null, outerHTML: i.outerHTML.slice(0,500) }));
    const clickable = Array.from(document.querySelectorAll('button,a,input[type=button]')).slice(0,50).map(e => ({ tag: e.tagName, text: (e.innerText||e.value||'').trim().slice(0,200), outerHTML: e.outerHTML.slice(0,200) }));
    return { body, inputs, clickable };
  });
  console.log('SNAPSHOT_START');
  console.log(JSON.stringify(snapshot, null, 2));
  console.log('SNAPSHOT_END');
  await b.close();
})();

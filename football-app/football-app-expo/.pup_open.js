const puppeteer = require('puppeteer');
(async () => {
  const url = process.argv[2] || 'http://localhost:8081';
  const b = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox']});
  const p = await b.newPage();
  p.on('console', m => console.log('BROWSER:', m.type(), m.text()));
  p.on('pageerror', e => console.log('PAGE_ERROR', e.message));
  console.log('NAV TO', url);
  try {
    await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('LOADED');
    await new Promise(r => setTimeout(r, 5000));
  } catch (e) {
    console.log('NAV_ERR', e.message);
  }
  await b.close();
  process.exit(0);
})();

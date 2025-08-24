const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const url = 'http://localhost:8081/';
  console.log('Opening', url);
  // capture console and page errors
  page.on('console', (msg) => {
    try { console.log('PAGE LOG:', msg.text()); } catch (e) {}
  });
  page.on('pageerror', (err) => {
    console.error('PAGE ERROR:', err.toString());
  });

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }).catch(e => { console.error('goto failed', e); process.exit(1); });
  console.log('Loaded page; waiting for body to appear');
  await page.waitForSelector('body');
  // small sleep helper via evaluate for Puppeteer versions without waitForTimeout
  await page.evaluate(() => new Promise((r) => setTimeout(r, 1000)));

  // Dump visible text for debugging
  const initialText = await page.evaluate(() => document.body.innerText || '');
  console.log('PAGE TEXT (initial):\n', initialText.slice(0, 2000));
  await page.screenshot({ path: 'puppeteer-initial.png', fullPage: true }).catch(() => {});

  // Try to click the "w" web preview open shortcut may not render app; instead find a button labeled Profile
  const clickIfExists = async (text) => {
    const found = await page.evaluate((t) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const b = buttons.find(b => b.textContent && b.textContent.trim().includes(t));
      if (b) {
        b.click();
        return true;
      }
      // Also try links
      const links = Array.from(document.querySelectorAll('a'));
      const a = links.find(a => a.textContent && a.textContent.trim().includes(t));
      if (a) { a.click(); return true; }
      return false;
    }, text);
    if (found) {
      console.log('Clicked', text);
      await page.waitForSelector('body');
      await page.evaluate(() => new Promise((r) => setTimeout(r, 400)));
      return true;
    }
    console.log('No button', text);
    return false;
  };

  // Attempt navigation sequence
  await clickIfExists('Profile');
  await page.waitForSelector('body');
  await page.evaluate(() => new Promise((r) => setTimeout(r, 400)));

  const afterProfile = await page.evaluate(() => document.body.innerText || '');
  console.log('PAGE TEXT (after Profile):\n', afterProfile.slice(0, 2000));
  const afterHTML = await page.evaluate(() => document.body.innerHTML || '');
  console.log('PAGE HTML (after Profile) length:', afterHTML.length);
  // write HTML to disk for inspection
  try {
    const fs = require('fs');
    fs.writeFileSync('puppeteer-profile.html', afterHTML);
    console.log('Wrote puppeteer-profile.html');
  } catch (e) {
    console.error('Failed to write HTML', e);
  }
  await page.screenshot({ path: 'puppeteer-profile.png', fullPage: true }).catch(() => {});
  // Edit Profile button
  await clickIfExists('Edit Profile');
  await page.waitForSelector('body');
  await page.evaluate(() => new Promise((r) => setTimeout(r, 400)));

  // Debug: log snippets of page that contain 'Edit Profile' to help locate the element
  const foundSnippets = await page.evaluate(() => {
    const text = document.body.innerText || '';
    const idx = text.indexOf('Edit Profile');
    if (idx === -1) return null;
    return text.slice(Math.max(0, idx - 80), idx + 80);
  });
  console.log('Edit Profile snippet:', foundSnippets);

  // Fill name input if present
  const input = await page.$('input[placeholder="Full name"]');
  if (input) {
    await input.click();
    await input.type('Automated Test Name');
    console.log('Typed name');
    // Click Save button
    const clickedSave = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const b = buttons.find(b => b.textContent && b.textContent.trim().toLowerCase().includes('save'));
      if (b) { b.click(); return true; }
      return false;
    });
    if (clickedSave) console.log('Clicked Save');
  } else {
    console.log('Name input not found');
  }

  console.log('Done script');
  await browser.close();
})();

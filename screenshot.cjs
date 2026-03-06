const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    
    const logoPath = path.join(__dirname, 'logo.html');
    await page.goto(`file://${logoPath}`, { waitUntil: 'networkidle0' });
    
    // Wait for animations
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    await page.screenshot({
        path: 'logo.png',
        type: 'png'
    });
    
    console.log('Screenshot saved as logo.png');
    await browser.close();
})();

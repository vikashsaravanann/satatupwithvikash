const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    
    await page.goto('file:///Users/vikash/Desktop/Portfolio_Information/index.html', { waitUntil: 'networkidle0' });
    
    console.log("Checking buttons...");
    try {
        const faBtn = await page.$('#face-assistant-btn');
        if (faBtn) {
            console.log("Found Face Assistant Button");
            await faBtn.click();
            console.log("Clicked Face Assistant");
        } else {
            console.log("Face Assistant Button not found!");
        }
        
        const vnBtn = await page.$('#voice-nav-btn');
        if (vnBtn) {
            console.log("Found Voice Nav Button");
            await vnBtn.click();
            console.log("Clicked Voice Nav");
        } else {
            console.log("Voice Nav Button not found!");
        }
        
        const aiFitBtn = await page.$('#ai-analyze-btn');
        if (aiFitBtn) {
            console.log("Found AI Fit Button");
            await aiFitBtn.click();
            console.log("Clicked AI Fit");
        } else {
            console.log("AI Fit Button not found!");
        }
        
    } catch(e) {
        console.error("Error clicking buttons:", e);
    }
    
    await browser.close();
})();

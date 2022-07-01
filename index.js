const csv = require('csv-parser');
const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({headless: false, args: [`--window-size=1920,1080`],
    defaultViewport: {
        width:1920,
        height:1080}});
    

    //function that scans the cookie using cookie sanner and store the screenshot
    const scan  = async function(url, rank) {
        const page = await browser.newPage();
        await page.goto("https://cookie-script.com/cookie-scanner", {waitUntil: "domcontentloaded"}); //go to cookie scanner
        await page.waitForSelector('input[aria-label="domain"]');
        await page.type('input[aria-label="domain"]', url);
        await Promise.all([
            page.waitForNavigation(),
            page.keyboard.press("Enter"),
        ]);
        page.setDefaultTimeout(60000);
        await page.waitForSelector(".scanning", {hidden: true});
        await page.waitForTimeout(4000);
        await page.screenshot({path: rank + '.png'});
        page.close();

    };


    // parse csv file
    const fname = 'urls.csv'
    const csvPipe = fs.createReadStream(fname).pipe(csv());
    csvPipe.on('data', async (row) => {
        let rank = row.Rank;
        let url = row.URL;
        csvPipe.pause();
        await scan(url, rank);
        csvPipe.resume();
    }).on('end', () => {
        console.log('CSV file successfully processed');
    });
    
  })();


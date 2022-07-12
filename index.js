const csv = require('csv-parser');
const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({headless: true, args: [`--window-size=1920,1080`],
    defaultViewport: {
        width:1920,
        height:1080}});
    

    //function that scans the cookie using cookie sanner and store the information
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
        await page.waitForTimeout(4000);
        await page.waitForSelector(".scanning", {hidden: true});
        await page.waitForTimeout(4000);

        // store the information
        const data = await page.$$eval('.reporttable tbody tr td', tds => tds.map((td) => {
            return td.innerText;
          }));

        const websiteObject = {
            website: url,
            cookies: [],
        };
        
        for (let i = 0; i < data.length; i+=7) {
            const cur = [];
            for (let j = 0; j < 6; j++) {
                const str = data[j+i];
                cur.push(str);
            }
            cur[0] = cur[0].slice(0, -10);
            const cookieObject = {
                cookieKey: cur[0],
                domain: cur[1],
                path: cur[2],
                cookieType: cur[3],
                expiration: cur[4],
                description: cur[5],
            }
            websiteObject.cookies.push(cookieObject);
            
        }
        let rawdata = fs.readFileSync('results.json');
        let json = JSON.parse(rawdata);
        json[rank] = websiteObject;
        fs.writeFile('./results.json', JSON.stringify(json, null, 2), err => {
            if (err) {
                console.log(err);
            } else {
                console.log("Successfully crawled " + url)
            }
        });

        page.close();

    };


    // parse csv file
    const fname = 'urls.csv'
    const resultObject = {};
    const jsonresult = JSON.stringify(resultObject);
    console.log(jsonresult);
        fs.writeFile('./results.json', JSON.stringify(resultObject), err => {
            if (err) {
                console.log(err);
            } else {
                console.log('Successfully created JSON file!');
            }
        });
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


const puppeteer = require('puppeteer');
const fs = require('fs');
const { parse } = require('csv-parse');
const { Domain } = require('domain');
const { count } = require('console');
const top500 = [0, 0, 0, 0];
const res = [];

(async () => {
  const browser = await puppeteer.launch({headless: true, args: [`--window-size=800,1080`],
  defaultViewport: {
      width:960,
      height:1080}})
  const bannerCheck = async function(URL) {
    const page = await browser.newPage();
    try {
      await page.goto(URL, {waitUntil: 'domcontentloaded'});
    } catch (error) {
      console.log(error);
    }
    await page.waitForTimeout(7000);
    const buttons = await page.$x("//button");
    const links = await page.$x("//a");
    const spans = await page.$x("//span");
    var bool = {
      accept: false,
      decline: false,
      customize: false
    }
    for (const button of buttons) {
      const text = await (await button.getProperty("innerText")).jsonValue();
      const bannerButton = await categorizeBanners(text);
      if (bannerButton[0] > 0.65) {
        bool.accept = true;
      }
      if (bannerButton[1] > 0.65) {
        bool.decline = true;
      }
      if (bannerButton[2] > 0.65) {
        bool.customize = true;
      } 
    }
    for (const link of links) {
      const text = await (await link.getProperty("innerText")).jsonValue();
      const bannerLink = await categorizeBanners(text);
      if (bannerLink[0] > 0.65) {
        bool.accept = true;
      }
      if (bannerLink[1] > 0.65) {
        bool.decline = true;
      }
      if (bannerLink[2] > 0.65) {
        bool.customize = true;
      } 
    }  
    for (const span of spans) {
      const text = await (await span.getProperty("innerText")).jsonValue();
      const bannerLink = await categorizeBanners(text);
      if (bannerLink[0] > 0.65) {
        bool.accept = true;
      }
      if (bannerLink[1] > 0.65) {
        bool.decline = true;
      }
      if (bannerLink[2] > 0.65) {
        bool.customize = true;
      } 
    }
    var comp;
    page.close();
    if (bool.accept & bool.decline & bool.customize) {
      console.log(URL + ", compliant");
      comp = 0
    } else if (bool.accept & bool.decline) {
      console.log(URL + ", compliant, no customization");
      comp = 1
    } else if (bool.accept) {
      console.log(URL + ", not compliant, not balanced choice");
      comp = 2
    } else {
      console.log(URL + ", no banner");
      comp = 3
    }
    var logger = fs.createWriteStream('check.txt', {
      flags: 'a'
    })
    logger.write(URL + " " + comp + '\n')
    return comp
  };

  const urlChecker = fs.createReadStream('./urls.csv').pipe(parse({from_line: 2}));
  urlChecker.on('data', async (row) => {
  let url = row[1];
  urlChecker.pause();
  const result = await bannerCheck("https://" + url);
  top500[result]++
  console.log(top500);
  urlChecker.resume();
}).on("error", function (error) {
  console.log(error.message);
})
})();

async function categorizeBanners(word) {
  var decline = ["decline", "decline all", "decline all cookies","reject", "reject all", "reject cookies"]
  var accept = ["accept", "accept all", "Yes, accept cookies", "I understand", "i agree", "got it", "allow all", "allow", "accept all cookies"]
  var custom = ["customize", "customize settings", "personalize", "manage cookies", "preferences"]
  var acceptMax = 0
  for (let j = 0; j < accept.length; j++) {
    if (similarity(word, accept[j]) > acceptMax) {
      acceptMax = similarity(word, accept[j]);
    }
  }
  var declineMax = 0
  for (let j = 0; j < decline.length; j++) {
    if (similarity(word, decline[j]) > declineMax) {
      declineMax = similarity(word, decline[j]);
    }
  }
  var customMax = 0
  for (let j = 0; j < custom.length; j++) {
    if (similarity(word, custom[j]) > customMax) {
      customMax = similarity(word, custom[j]);
    }
  }
  const arr = [acceptMax, declineMax, customMax];
  return arr;
}

function similarity(s1, s2) {
  //Levenshtein distance similarity
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
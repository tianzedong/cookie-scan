const puppeteer = require('puppeteer');
const fs = require('fs');
const { parse } = require('csv-parse')
const top500 = [0, 0, 0, 0]

const urlChecker = fs.createReadStream('./top500Domains.csv').pipe(parse({from_line: 2}));
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


async function getLinks() {
  const page = await main();
  const elements = await page.$x("//a");
  elements.forEach(async element => {
	  const text = await (await element.getProperty("innerText")).jsonValue();
    categorizeBanners(text);
    signUpClicker(text);
  });
}

const main = async() => {
  const result = await bannerCheck("https://feedburner.com")
  console.log(result);
}

async function bannerCheck(URL) {
  //runs banner check algorithm
  //fully compliant (0), accept/reject (1), only accept (2), no banner (3)
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  try {
    await page.goto(URL, {waitUntil: 'domcontentloaded'});
  } catch (error) {
    console.log(error);
  }
  await page.waitForTimeout(5000);
  const buttons = await page.$x("//button");
  const links = await page.$x("//a");
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
  if (bool.accept & bool.decline & bool.customize) {
    console.log(URL + ", compliant");
    return 0;
  } else if (bool.accept & bool.decline) {
    console.log(URL + ", compliant, no customization");
    return 1;
  } else if (bool.accept) {
    console.log(URL + ", not compliant, not balanced choice");
    return 2;
  } else {
    console.log(URL + ", no banner");
    return 3;
  }
}

async function signUpClicker(word) {
  //inputs link text, if matches "sign up", then clicks link and scans for privacy policy
  var sign = ["sign up", "create account", "create new account"]
  var privacy = ["privacy policy", "cookie policy", "cookie use"]
  //first scans for policies
  var privacyMax = 0
  for (let i = 0; i < privacy.length; i++) {
    if (similarity(word, privacy[i]) > privacyMax) {
      privacyMax = similarity(word, privacy[i]);
    }
  }

}

async function categorizeBanners(word) {
  var decline = ["decline", "decline all", "decline all cookies","reject", "reject all", "reject cookies"]
  var accept = ["accept", "accept all", "Yes, accept cookies", "I understand", "understand", "agree", "i agree", "got it", "allow all", "allow", "accept all cookies"]
  var custom = ["customize", "customize settings", "personalize"]
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

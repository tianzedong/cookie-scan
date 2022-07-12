const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://ee.co.uk/")
  return page
}

async function getLinks() {
  const page = await main();
  const elements = await page.$x("//a");
  elements.forEach(async element => {
	  const text = await (await element.getProperty("innerText")).jsonValue();
    categorizeBanners(text);
  });
}

async function getButton() {
  const page = await main();
  const elements = await page.$x("//button");
  elements.forEach(async element => {
	  const text = await (await element.getProperty("innerText")).jsonValue();
    categorizeBanners(text);
  });
}

async function categorizeBanners(word) {
  var decline = ["decline", "decline all", "decline all cookies","reject", "reject all", "no"]
  var accept = ["accept", "accept all", "Yes, accept cookies", "I understand", "understand", "agree", "i agree"]
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
  if (acceptMax > 0.4) {
    console.log("Has accept: " + word + "," + acceptMax);
  }
  if (declineMax > 0.4) {
    console.log("Has decline: " + word + "," + declineMax);
  }
  if (customMax > 0.4) {
    console.log("Has customization: " + word + "," + customMax);
  }
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
getButton();
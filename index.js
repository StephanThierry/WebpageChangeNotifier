const axios = require('axios');
var nodemailer = require('nodemailer');
const puppeteer = require('puppeteer-extra')
const emailConfig = require('./email-config');

var transporter = nodemailer.createTransport(emailConfig);

var mailOptions = {
    from: 'noreply@protek.dk',
    to: 'stephan@protek.dk',
    subject: 'PlayStation 5 is possibly in stock!'
};


async function getURL(url) {
    return ((await axios.get(url)).data);
}

async function getURLWithJavascript(url) {
    let browser = await puppeteer.launch({ headless: true });
    let page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);
    await page.goto(url);
    await page.waitForSelector('.buy-area__webshop', {
        visible: true,
      });

    let response = await page.evaluate(() => document.documentElement.outerHTML);
    await browser.close();
    return(response);
}

async function detectPageChange(url, validate, change, decodeJS) {
    let resString;
    let found = false;
    try {
        let response = "";
        if (decodeJS) {
            response = await getURLWithJavascript(url);
        } else {
            response = await getURL(url);
        }

        let isValid = (response.indexOf(validate) != -1);
        let isChange = (response.indexOf(change) == -1);
        console.log(url);
        console.log("isValid: " + isValid + "  isChange: " + isChange);
        console.log();

        if (isValid && isChange) {
            mailOptions.text = "Try this URL: " + url;
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        }
    } catch (err) {
        console.log("Failed: " + err.message);
        return (null);
    }
    return (resString);
}


const checkSites = [
    { URL: "https://www.proshop.dk/Spillekonsol/Sony-PlayStation-5-Nordic/2831713", validate: "Pick-up Points lagerstatus", change: "ukendt leveringsdato" },
    { URL: "https://www.bilka.dk/produkter/sony-playstation-5-standard/100532624/", validate: "PS5 Standard", change: "OutOfStock" },
    { URL: "https://www.elgiganten.dk/product/gaming/konsoller/playstation-konsoller/220276/playstation-5-ps5", validate: "PlayStation 5", change: "Ukendt leveringsdato" },
    { URL: "https://www.power.dk/gaming-og-underholdning/playstation/playstation-konsoller/playstation-5/p-1077687/", validate: "Collect", change: "stock-unavailable", decodeJS: true },
]
function performCheck() {
    checkSites.forEach(function (item) {
        (async function (item) {
            await detectPageChange(item.URL, item.validate, item.change, item.decodeJS);
        })(item)
    })

    let minutes = 45;
    console.log(new Date().toString() + " - Que next run in " + minutes + " minues.");
    setTimeout(performCheck, 1000 * 60 * minutes);
}

performCheck();
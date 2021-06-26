const axios = require('axios');
var nodemailer = require('nodemailer');
const puppeteer = require('puppeteer-extra')
const emailConfig = require('./email-config');

const global_timeout = 60000;

var transporter = nodemailer.createTransport(emailConfig);

var mailOptions = {
    from: 'noreply@protek.dk',
    to: 'stephan@protek.dk',
    subject: 'PlayStation 5 is possibly in stock!'
};


async function getURL(url) {
    return ((await axios.get(url)).data);
}

async function getURLWithJavascript(url, waitForSelector) {
    let browser = await puppeteer.launch({ headless: true });
    let page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
    await page.setDefaultNavigationTimeout(global_timeout);
    await page.goto(url);

    if (waitForSelector) {
        await page.waitForSelector(waitForSelector, {
            visible: true,
            timeout: global_timeout
        });
    }

    let response = await page.evaluate(() => document.documentElement.outerHTML);
    await browser.close();
    return (response);
}

async function detectPageChange(url, validate, change, positiveChange, decodeJS, waitForSelector) {
    let resString;
    let found = false;
    try {
        let response = "";

        if (decodeJS) {
            response = await getURLWithJavascript(url, waitForSelector);
        } else {
            response = await getURL(url);
        }

        let isValid = (response.indexOf(validate) != -1);
        let isChange = false;

        if (positiveChange) {
            isChange = (response.indexOf(change) != -1);
        } else {
            isChange = (response.indexOf(change) == -1);
        }

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
        console.log("Failed: " + url + "  " + err.message);
        return (null);
    }
    return (resString);
}


const checkSites = [
    { URL: "https://www.proshop.dk/Spillekonsol/Sony-PlayStation-5-Digital-Edition-Nordic/2863627", validate: "Pick-up Points lagerstatus", change: "ukendt leveringsdato", decodeJS: true, waitForSelector: '.site-currency-attention' },
 /*   { URL: "https://www.bilka.dk/elektronik/computere-og-gaming/konsoller-og-spil/playstation-5/playstation-5-konsoller/pl/ps5-konsol/", validate: "PlayStation 5 konsoller", change: "no-results", decodeJS: true, waitForSelector: '.image__container'  },*/
    { URL: "https://www.elgiganten.dk/product/gaming/konsoller/playstation-konsoller/220276/playstation-5-ps5", validate: "PlayStation 5", change: "Ukendt leveringsdato" },
    { URL: "https://www.power.dk/gaming-og-underholdning/playstation/playstation-konsoller/playstation-5/p-1077687/", validate: "Collect", change: "stock-unavailable", decodeJS: true, waitForSelector: '.buy-area__webshop' },
/*    { URL: "https://www.br.dk/produkter/sony-playstation-5-digital/100553322/", validate: "PlayStation 5 konsoller", change: "Ikke på lager online", decodeJS: true },*/
    { URL: "https://cdon.dk/spil/playstation/playstation-5-konsol/", validate: "Playstation 5 - Konsol", change: "produktet er faret vild" },
]
function performCheck() {
    checkSites.forEach(function (item) {
        (async function (item) {
            await detectPageChange(item.URL, item.validate, item.change, item.positiveChange, item.decodeJS, item.waitForSelector);
        })(item)
    })

    let minutes = 90;
    console.log(new Date().toString() + " - Que next run in " + minutes + " minues.");
    setTimeout(performCheck, 1000 * 60 * minutes);
}

performCheck();
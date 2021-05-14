const axios = require('axios');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'stephan@protek.dk',
        pass: ''
    }
});

var mailOptions = {
    from: 'noreply@protek.dk',
    to: 'stephan@protek.dk',
    subject: 'PlayStation 5 is possibly in stock!'
};

async function detectPageChange(url, validate, change) {
    let resString;
    let found = false;
    try {
        let response = await axios.get(url);
        response = response.data;
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
        console.log("Tween or get failed: " + err.message);
        return (null);
    }
    return (resString);
}

const checkSites = [
    { URL: "https://www.proshop.dk/Spillekonsol/Sony-PlayStation-5-Nordic/2831713", validate: "Pick-up Points lagerstatus", change: "ukendt leveringsdato" },
    { URL: "https://www.bilka.dk/produkter/sony-playstation-5-standard/100532624/", validate: "PS5 Standard", change: "OutOfStock" },
    { URL: "https://www.elgiganten.dk/product/gaming/konsoller/playstation-konsoller/220276/playstation-5-ps5", validate: "PlayStation 5", change: "Ukendt leveringsdato" },
]
function performCheck() {
    checkSites.forEach(function (item) {
        (async function (item) {
            await detectPageChange(item.URL, item.validate, item.change);
        })(item)
    })

    let minutes = 45;
    console.log("Que next run in " + minutes + " minues.");
    setTimeout(performCheck, 1000 * 60 * minutes);
}

performCheck();
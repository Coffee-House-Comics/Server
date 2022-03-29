const nodemailer = require("nodemailer");
const dotenv = require('dotenv');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const json = require('../Secrets/gmail_auth_file.json');

// Extract the environment variables
dotenv.config();
const my_email = process.env.GMAIL_ADDRESS;
const client_id = process.env.GMAIL_OAUTH_CLIENT_ID;
const client_secret = process.env.GMAIL_OAUTH_CLIENT_SECRET;
const refresh_token = process.env.GMAIL_OAUTH_REFRESH_TOKEN;
let access_token = process.env.GMAIL_OAUTH_ACCESS_TOKEN;

const password = process.env.GMAIL_PASSWORD;

const privKey = process.env.GMAIL_IAM_PRIV_KEY;


const mailController = {};

// const oauth2Client = new OAuth2(
//     client_id,
//     client_secret, // Client Secret
// );

// oauth2Client.setCredentials({
//     refresh_token: refresh_token
// });

// access_token = oauth2Client.getAccessToken(function (token) {
//     access_token = token;
// });

mailController.generateMail = function (toAddress, message) {
    return (
        {
            from: "Coffee House Comics Team <" + my_email + ">",
            to: toAddress,
            subject: "Confirm your Coffee House Comics Account",
            text: "You successfully registered an account with www.coffeehousecomics.com",
            html: "<p>You successfully registered an account with www.coffeehousecomics.com</p>"
        }
    );
}

mailController.sendMail = async function (mailObj) {
    console.log("Sending mail...");

    // TODO: Maybe get OAUTH token working in the future
    // const transporter = nodemailer.createTransport({
    //     host: 'smtp.gmail.com',
    //     port: 465,
    //     secure: true,
    //     auth: {
    //         type: 'OAuth2',
    //         user: my_email,
    //         serviceClient: json.client_id,
    //         privateKey: json.private_key,
    //     }
    // });

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'coffeehousecomics416@gmail.com',
            pass: password
        }
    });

    await transporter.verify();

    transporter.sendMail(mailObj, function (err, info) {
        if (err) {
            console.log(err);
        } else {
            // see https://nodemailer.com/usage
            console.log("info.messageId: " + info.messageId);
            console.log("info.envelope: " + info.envelope);
            console.log("info.accepted: " + info.accepted);
            console.log("info.rejected: " + info.rejected);
            console.log("info.pending: " + info.pending);
            console.log("info.response: " + info.response);
        }
        transporter.close();
    });
}

module.exports = mailController;


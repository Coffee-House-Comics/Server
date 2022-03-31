const nodemailer = require("nodemailer");
const dotenv = require('dotenv');

// Extract the environment variables
dotenv.config();
const my_email = process.env.GMAIL_ADDRESS;
const password = process.env.GMAIL_PASSWORD;

const mailController = {};

mailController.generateMail = function (toAddress, subject, message) {
    return (
        {
            from: "Coffee House Comics Team <" + my_email + ">",
            to: toAddress,
            subject: subject,
            text: message,
            html: "<p>" + message + "</p>"
        }
    );
}

mailController.sendMail = async function (mailObj) {
    console.log("Sending mail...");

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


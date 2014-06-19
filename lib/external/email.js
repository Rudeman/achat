var nodemailer = require("nodemailer");

function MailOptions(from,to,subject,text,html) {
    this.from = from;
    this.to = to;
    this.subject = subject;
    this.text = text;
    this.html = html;
}

function sendEmail(mailOptions,handler) {
    var smtpTransport = nodemailer.createTransport("SMTP",{
        service: "Gmail",
        auth: {
            user: "mobshare12@gmail.com",
            pass: "mobshare2012"
        }
    });
     
    // send mail with defined transport object
    smtpTransport.sendMail(mailOptions, handler);
}

exports.sendEmail = sendEmail;
exports.MailOptions = MailOptions;
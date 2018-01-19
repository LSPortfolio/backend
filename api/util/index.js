const winston = require('winston');
require('winston-loggly-bulk');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDRIG_API_KEY);
const emails = require('./emails');

winston.add(winston.transports.Loggly, {
    token: process.env.LOGGY_TOKEN,
    subdomain: 'lambda_showcase',
    tags: ['winston-nodejs'],
    json: true
});

const emailUser = (type, to, subject, body) => {
    const from = {
        name: "Lambda School",
        email: "hello@lambdashowcase.com"
    }
    return new Promise((resolve, reject) => {
        const msg = {
            to,
            from,
            subject: type.subject || subject,
            html: type.html || body,
            //TODO: Get tpl id
            templateId: ''
        };
        sgMail.send(msg, (err, result) => err ? reject(err) : resolve(result));
    })
};

module.exports = {
    handleErr: (res, status, message, data) => {
        winston.log("Site error", `${status} - ${message}: ${data}`);
        return status === 500 ? res.status(500).send({ message: 'Server error with this operation.' }) : res.status(status).send({ message });
    },
    isLoggedIn: (req, res, next) => {
        const message = "You are not authorized to perform this operation.";
        const token = req.body.token || req.query.token || req.headers['x-access-token'];
        if (!token) return res.status(403).send({ message });
        jwt.verify(token, process.env.SECRET, (err, decoded) => {
            if (err) return res.status(403).send({ message });
            req.decoded = decoded;
            next();
        });
    },
    isAdmin: (req, res, next) => {
        const message = "You must be an admin to perform this operation.";
        const { role } = req.decoded;
        if (role !== "staff" && role !== "admin") return res.status(403).send({ message });
        next();
    },
    sendEmail: {
			welcome: to => emailUser(emails.welcome, to),
			forgotPassword: (to, token) => {
				const type = {
					subject: emails.resetPassword.subject,
					html: emails.resetPassword.html(token)
				}
				return emailUser(type, to);
			}
    }
}
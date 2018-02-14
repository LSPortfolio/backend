const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const emails = require('./emails');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const emailUser = (type, to, subject, body) => {
  const from = {
    name: "Lambda School",
    email: "lambdaschool@lambdashowcase.com"
  }
  return new Promise((resolve, reject) => {
    const msg = {
      to,
      from: from.email,    //change email here
      subject: type.subject || subject,
      html: type.html || body,
      //TODO: Get tpl id
      //templateId: ''
    };
    sgMail.send(msg, (err, result) => err ? reject(err) : resolve(result));
  })
};


module.exports = {
  handleErr: (res, status, message, data) => {
    return status === 500 ? res.status(500).send({ message: 'Server error with this operation.' }) : res.status(status).send({ message });
  },

  format: (first, last) => {
  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  }
  return `${first.capitalize()} ${last.capitalize()}`;
  },

  isLoggedIn: (req, res, next) => {
    const message = "You are not authorized to perform this operation.";
    const token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (!token) return res.status(403).send({ message });
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
      if (err) return res.status(403).send({ message });
			req.decoded = decoded;
			req.userId = decoded.id;
      next();
    });
  },
  
  sendEmail: {
		welcome: to => emailUser(emails.welcome, to),
		forgotPassword: (to, token) => {
			const type = {
				subject: emails.resetPassword.subject,
				html: emails.resetPassword.html(token)
      }
			return emailUser(type, to);
    },
    pwResetSuccess: to => emailUser(emails.pwResetSuccess, to),
    makeLive: to => emailUser(emails.makeLive, to),
    makeDraft: to => emailUser(emails.makeDraft, to),
  },
}
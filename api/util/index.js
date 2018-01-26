const winston = require('winston');
require('winston-loggly-bulk');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const emails = require('./emails');
const Airtable = require('airtable');
const Permitted = require('../user/permitted-model');
const async = require('async');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API }).base(process.env.AIRTABLE_BASE);
const cloudinary = require('cloudinary');

cloudinary.config({ cloud_name: 'dbquvargx', api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

winston.add(winston.transports.Loggly, {
	token: process.env.LOGGY_TOKEN,
  subdomain: 'lambda_showcase',
  tags: ['winston-nodejs'],
  json: true
});

const emailUser = (type, to, subject, body) => {
  /*
  const from = {
    name: "Lambda School",
    email: "lambdaschool@lambdashowcase.com"
  }
  */
  return new Promise((resolve, reject) => {
    const msg = {
      to,
      from: 'lambdaschool@lambdashowcase.com',
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
			req.userId = decoded.id;
      next();
    });
  },
  isPermitted: (req, res, next) => {
    const message = "Your account is not permitted to perform this operation.";
    const { permitted } = req.decoded;
    if (!permitted) return res.status(403).send({ message });
    next();
  },
  isAdmin: (req, res, next) => {
    const message = "You must be an admin to perform this operation.";
    const { role } = req.decoded;
    if (role !== "staff" && role !== "admin") return res.status(403).send({ message });
    next();
  },
  checkAirTableRoles: (email, role) => {
			let emailFound = false;
			const table = role === 'student' ? 'Table 1' : 'Table 2';
			const checkOnly = () => {
				Permitted.findOne({ email }, (err, found) => {
					if (err) return false;
					if (found) return true;
				})
			}	
			const checkAndAdd = (record, callback) => {
				if (record.get('email') === email) emailFound = true;
				Permitted.findOne({ email: record.get('email')}, (err, permitted) => {
					if (err) return callback(err);
					if (permitted) return callback();
					const newPermitted = new Permitted({ email: record.get('email'), airtableId: record.get('id') });
					newPermitted.save((error, newEntry) => {
						if (error) return callback(error);
						callback();
					})
				});
			}  
    return new Promise((resolve, reject) => {
    Permitted.findOne({ email }).exec()
      .then(permitted => {
				if (permitted) return resolve();
				base(table).select({
					maxRecords: 100
				}).eachPage(function page(records, fetchNextPage) {			
					async.each(records, checkAndAdd, err => {
						if (err) return reject(err);
						if (emailFound || checkOnly()) return resolve();
						return records.length < 100 ? reject() : fetchNextPage();
				});
      }, function done(err) {
        if (err) return reject(err)
      	})
					}, e => reject(e))
      .catch(error => reject(error))
    })
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
  },

  sendToCloudinary: (res, file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(file, (err, result) => {
        if (err) return reject(err);
        resolve(result)
      });
    });
  },
}

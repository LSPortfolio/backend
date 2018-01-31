const Airtable = require('airtable');
const sendGrid = require('@sendgrid/mail');
const container = require('../../config/config');

const mail = (res, email, title, body) => {
  sendGrid.setApiKey(container.sendgridApi);
  let msg = {
    to: email,
    from: 'rolandc5@hotmail.com',
    subject: title,
    text: body,
    html: '<strong>and easy to do anywhere, even with Node.js</strong>'
  }
  sendGrid.send(msg, (err, data) => {
    if (err || !data) return res.status(500).json({ message: 'Something went wrong when delivering message' });
  });
  return;
}

const airTable = (res , name, role) => {
  const base = new Airtable({ apiKey: container.airtableApi}).base(container.airtableBaseKey);
  base('People').create({
    "Name": name,
    "Role": role
  }, (err, data) => {
    if (err || !data) return res.status(422).send({ message: 'Error sending applicant type' });
  });
  return;
}

const formatName = (first, last) => {
  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  }
  return `${first.capitalize()} ${last.capitalize()}`;
}

module.exports = {
  mail,
  airTable,
  formatName
}
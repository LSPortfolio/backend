const path = require('path');
const rootPath = path.normalize(__dirname + '/../../');

module.exports = {
  db: process.env.DATABASE_CONNECTION,
  port: process.env.PORT || 5000,
  secret: process.env.SECRET,
  token: process.env.TOKEN,
  sendgridApi: process.env.SENDGRID_API_KEY,
  airtableApi: process.env.AIRTABLE_API_KEY,
  airtableBaseKey: process.env.AIRTABLE_BASE_KEY,
}

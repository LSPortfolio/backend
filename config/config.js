const path = require('path');
const rootPath = path.normalize(__dirname + '/../../');

module.exports = {
  db: process.env.DATABASE_CONNECTION || 'mongodb://localhost:27017',
  rootPath,
  port: process.env.PORT || 5280,
  secret: 'thiouas;jiopudfjewlafueipfjewnqflueiwapbcdjvlahfvdbalsgds39213847p39uh30ry47pfh170y7p89' || process.env.SECRET,
  token: process.env.TOKEN,
  sendgridApi: process.env.SENDGRID_API_KEY,
  airtableApi: process.env.AIRTABLE_API_KEY,
  airtableBaseKey: process.env.AIRTABLE_BASE_KEY,
}

const path = require('path');
const rootPath = path.normalize(__dirname + '/../../');

module.exports = {
  db: process.env.DATABASE_CONNECTION,
  rootPath,
  port: process.env.PORT || 5280,
  secret: process.env.SECRET,
  token: process.env.TOKEN,
  sendgridApi: process.env.SENDGRID_API_KEY,
}
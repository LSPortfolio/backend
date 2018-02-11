require('dotenv').config();

const port = process.env.PORT || 3030;
const app = require('express')();
const config = require('./config/config');

require('./config/express')(app,config);
require('./config/mongoose')(config);
require('./config/routes')(app);

app.listen(port, () => {
  console.log('The Lambda School Portfolio server is up and running.');
});

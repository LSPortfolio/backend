require('dotenv').config();

const app = require('express')();
const config = require('./config/config');

require('./config/express')(app,config);
require('./config/mongoose')(config);
require('./config/routes')(app);

app.listen(app.get(config.port), () => {
  console.log('The Lambda School Portfolio server is up and running.');
});

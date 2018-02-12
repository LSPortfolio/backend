require('dotenv').config();

const app = require('express')();
const config = require('./config/config');

require('./config/express')(app, config);
require('./config/mongoose')(config);
require('./config/routes')(app);

app.listen(config.port, () => {
  console.log(`Server up and runnning on ${config.port}`);
});
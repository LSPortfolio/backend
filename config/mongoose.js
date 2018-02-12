const mongoose = require('mongoose');


module.exports = (config) => {
  mongoose.connect(config.db);
  mongoose.Promise = global.Promise;

  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'Could not connect to database'));
  db.once('open', () => console.log('Now connected to database'));

}
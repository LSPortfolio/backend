const mongoose = require('mongoose');


module.exports = (config) => {
  mongoose.connect(config.db, {useMongoClient: true });
  mongoose.Promise = global.Promise;

  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'lambda School could not connect to the database'));
  db.once('open', () => console.log('Lambda school is connected to the database'));

}
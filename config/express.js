const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');



module.exports = (app, config) => {
  app.use(logger('dev'));
  app.use(bodyParser.json());
  // TODO: Modify cors settings
  app.use(cors());
}
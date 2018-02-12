const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

module.exports = (app, config) => {
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(cors());
};


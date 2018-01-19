const express = require('express');
const router = express.Router();
const controller = require('./project-controller');

router.get('/all', controller.all);

module.exports = router;
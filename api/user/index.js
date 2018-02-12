const express = require('express');
const router = express.Router();
const controller = require('./user-controller');

router.post('/create', controller.createUser);
router.post('/login', controller.login);
router.put('/find', controller.find);

module.exports = router;
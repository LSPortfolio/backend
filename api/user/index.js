const express = require('express');
const router = express.Router();
const controller = require('./user-controller');

router.post('/create', controller.createUser);
router.post('/login', controller.userLogin);
router.post('/forgotPassword', controller.forgotPassword);
router.put('/resetPassword/:token', controller.resetPassword);

module.exports = router;
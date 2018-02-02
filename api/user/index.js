const express = require('express');
const router = express.Router();
const controller = require('./user-controller');
const { isLoggedIn } = require('../util/index');

router.post('/create', controller.createUser);
router.post('/login', controller.userLogin);
router.post('/forgotPassword', controller.forgotPassword);
router.put('/resetPassword', controller.resetPassword);
router.put('/findUser', controller.findUser);
router.get('/listStudentsFinished', controller.studentsWhoFinished);
router.get('/home', isLoggedIn, controller.userHome);

module.exports = router;
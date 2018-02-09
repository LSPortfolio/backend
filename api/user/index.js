const express = require('express');
const router = express.Router();
const controller = require('./user-controller');
const { isLoggedIn } = require('../util/index');

router.get('/hello', controller.hi);
router.post('/create', controller.createUser);
router.post('/login', controller.userLogin);
router.post('/forgotPassword', controller.forgotPassword);
router.put('/resetPassword', controller.resetPassword);
router.put('/findUser', controller.findUser);
router.get('/home', isLoggedIn, controller.home);
router.get('/listStudentsFinished', controller.studentsWhoFinished);

module.exports = router;
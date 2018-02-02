const express = require('express');
const router = express.Router();
const controller = require('./project-controller');
const { isLoggedIn, isPermitted } = require('../util/index');

router.get('/all', controller.all);
router.get('/tags', controller.tagSearch);
router.post('/create?token=', isLoggedIn, isPermitted, controller.createDraft);
router.put('/removeContributor:id', controller.removeContributor);
router.put('/updateCategory:id', controller.updateCategory);
router.put('/makeLive:id', controller.makeLive);
router.put('/deleteProject:id', controller.deleteProject);
router.put('/addComment:id', controller.addComment);
router.put('/removeComment:id', controller.removeComment);
module.exports = router;
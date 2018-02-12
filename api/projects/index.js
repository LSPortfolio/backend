const express = require('express');
const router = express.Router();
const controller = require('./project-controller');

router.get('/all', controller.all);
router.get('/tags', controller.tagSearch);
router.get('/single:id', controller.single);

router.post('/create', controller.create);

router.put('/iamcommentingteehee', controller.addComment);

module.exports = router;
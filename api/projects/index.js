const express = require('express');
const router = express.Router();
const controller = require('./project-controller');

router.get('/all', controller.all);
router.post('/create', controller.createDraft);
router.get('/tags', controller.tagSearch);
router.put('/remcon:id', controller.removeContributor);
router.put('/updateCategory:id', controller.updateCategory);
module.exports = router;
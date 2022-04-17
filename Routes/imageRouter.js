const express = require('express');
const auth = require('../Auth');
const router = express.Router();
const CommonController = require('../Controllers/commonController');

router.post('/upload', auth.verify, CommonController.uploadImage);
router.get('/fetch/:imgName', CommonController.fetchImage);

module.exports = router
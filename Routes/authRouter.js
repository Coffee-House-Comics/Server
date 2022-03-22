const express = require('express')
const auth = require('../auth')
const router = express.Router()
const AuthController = require('../Controllers/authController')


router.post('/register', AuthController.registerUser);

router.post('/login', AuthController.loginUser);

router.post('/forgotPassword', AuthController.forgotPassword);

router.post('/logout', auth.verify, AuthController.logoutUser);

// Used to confirm the email
router.get('/confirmCode/:id', AuthController.confirmCode);

// Account maintenence ------------------------------------------------
router.put('/updateProfile', auth.verify, AuthController.updateProfile);

router.put('/changePassword', auth.verify, AuthController.changePassword);

router.put('/changeUserName', auth.verify, AuthController.changeUserName);


module.exports = router
const express = require('express')
const auth = require('../Auth')
const router = express.Router()
const AuthController = require('../Controllers/authController')

router.post('/register', AuthController.registerUser);

router.post('/login', auth.emailIsVerified, AuthController.loginUser);

router.post('/forgotPassword', auth.emailIsVerified, AuthController.forgotPassword);

router.post('/logout', auth.verify, AuthController.logoutUser);

// Used to confirm the email
router.get('/confirmCode/:id/:code', AuthController.confirmCode);

// Account maintenence ------------------------------------------------
router.put('/updateProfile', auth.verify, auth.emailIsVerified, AuthController.updateProfile);

router.put('/changePassword', auth.verify, auth.emailIsVerified, AuthController.changePassword);

router.put('/changeUserName', auth.verify, auth.emailIsVerified, AuthController.changeUserName);


module.exports = router
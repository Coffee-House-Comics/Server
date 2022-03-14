const express = require('express')
const router = express.Router()
const AuthController = require('../Controllers/authController')

router.post('/register', AuthController.registerUser);
router.post('/login', AuthController.loginUser);
router.get('/logout', AuthController.logoutUser);

// Used to confirm the email
router.get('/confirmCode/:id', AuthController.confirmCode);

// Account maintenence
router.post('/updateProfile', AuthController.XXX);
router.post('/changeEmail', AuthController.XXX);
router.post('/changePassword', AuthController.XXX);
router.post('/changeUserName', AuthController.XXX);



module.exports = router
const express = require('express')
const router = express.Router()
const AuthController = require('../Controllers/authController')

/* Register ------------
    Request body: {
        userName: String,
        password: String,
        confirmPassword: String, 

        displayName: String,
        bio: String
    }

    Response {
        status: 200 OK or 500 ERROR
        body: {
            id: ObjectId
            displayName: String,
            bio: String,
            profileImage: Image,
        }
    }
*/
router.post('/register', AuthController.registerUser);
/* Login ------------
    Request body: {
        userName: String
        password: String
    }

    Response {
        status: 200 OK or 500 ERROR
        body: {
            id: ObjectId
            displayName: String,
            bio: String,
            profileImage: Image,           
        }
    }
*/
router.post('/login', AuthController.loginUser);
/* Forgot Password ------------
    Request body: {
        userName: String,
        email: String 
    }

    Response {
        status: 200 OK or 500 ERROR
    }
*/
router.post('/forgotPassword', AuthController.AAA);
/* Logout ------------
    Request body: {}

    Response {
        status: 200 OK or 500 ERROR
    }
*/
router.post('/logout', AuthController.logoutUser);

// Used to confirm the email
/* Confirm Code ------------
    Request body: {}

    Response {
        status: 200 OK or 500 ERROR
        
        HTML Page saying, code has been verified
    }
*/
router.get('/confirmCode/:id', AuthController.confirmCode);

// Account maintenence ------------------------------------------------
/* Update Profile ------------
    Request body: {
        image: Image,
        displayName: String,
        bio: String,
    }

    Response {
        status: 200 OK or 500 ERROR
        body: {
            id: ObjectId
            displayName: String,
            bio: String,
            profileImage: Image,
        }
    }
*/
router.put('/updateProfile', AuthController.XXX);
/* Change Email ------------
    Request body: {
        oldEmail: String, 
        newEmail: String
    }

    Response {
        status: 200 OK or 500 ERROR
        body: {
            id: ObjectId
            displayName: String,
            bio: String,
            profileImage: Image,
        }
    }
*/
router.put('/changeEmail', AuthController.XXX);
/*
    Request body: {
        oldPassword: String,
        newPassword: String,
        confirmNewPassword: String,
    }

    Response {
        status: 200 OK or 500 ERROR
    }
*/
router.put('/changePassword', AuthController.XXX);
/*
    Request body: {
        oldUserName: String,
        newUserName: String
    }

    Response {
        status: 200 OK or 500 ERROR
        body: {
            id: ObjectId
            displayName: String,
            bio: String,
            profileImage: Image,
        }
    }
*/
router.put('/changeUserName', AuthController.XXX);



module.exports = router
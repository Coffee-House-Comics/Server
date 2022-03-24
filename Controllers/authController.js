// Helper functions ----------------------------------------------

async function sendConfirmationEmail(Recepient, confirmationCode) {

}


// Main functions ----------------------------------------------

const AuthController = {};

AuthController.registerUser = async function (req, res) {
    /* Register (POST) ------------
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
}

AuthController.loginUser = async function (req, res) {
    /* Login (POST) ------------
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
}

AuthController.forgotPassword = async function (req, res) {
    /* Forgot Password (POST) ------------
        Request body: {
            userName: String,
            email: String 
        }

        Response {
            status: 200 OK or 500 ERROR
        }
    */
}

AuthController.logoutUser = async function (req, res) {
    /* Logout (POST) ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR
        }
    */
}

AuthController.confirmCode = async function (req, res) {
    /* Confirm Code (GET) ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR
            
            HTML Page saying, code has been verified
        }
    */
}

AuthController.updateProfile = async function (req, res) {
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
}

AuthController.changeEmail = async function (req, res) {
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
}

AuthController.changePassword = async function (req, res) {
    /* Change Password ------------
        Request body: {
            oldPassword: String,
            newPassword: String,
            confirmNewPassword: String,
        }
    
        Response {
            status: 200 OK or 500 ERROR
        }
    */
}

AuthController.changeUserName = async function (req, res) {
    /* Chnage Username ------------
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
}

module.exports = AuthController;
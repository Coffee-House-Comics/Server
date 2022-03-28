/** REMINDER **
    - Every response in the controllers must be one of these 2 to actually send the data:
        1. res.status(CODE).send(DATA || EMPTY)
        2. res.status(CODE).json({})
*/

const emailController = require("../Mailer");
import {
    Account
} from '../Schemas/schemas';
const crypto = require("crypto");


// Helper functions ----------------------------------------------

async function sendConfirmationEmail(Recepient, confirmationCode) {

}

// Generate a random string with num bytes `len`
function generateCode(len = 22) {
    return crypto.randomBytes(len).toString('hex');
}


// Main functions ----------------------------------------------

const AuthController = {};

AuthController.registerUser = async function (req, res, next) {
    /* Register (POST) ------------
        Request body: {
            userName: String,
            password: String,
            email: String,
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

    // First we need to confirm all the credentials of the soon-to-be user
    const body = req.body;

    if (!body) {
        return res.status(500);
    }

    const userName = body.userName;
    const password = body.password;
    const confirmPassword = body.confirmPassword;
    const displayName = body.displayName;
    const bio = body.bio;

    if (!userName || !password || !confirmPassword || !displayName || !bio) {
        return res.status(500);
    }

    // Check if username is sufficient
    if (userName.trim() === "" /* or if it already exists */) {
        return res.status(500).json({
            error: "Malformed Username"
        });
    }

    // Check if password is good
    if (password !== confirmPassword) {
        return res.status(500).json({
            error: "Passwords do not match"
        });
    }

    // Confirm Display name
    if (displayName.trim() === "") {
        return res.status(500).json({
            error: "Display name may not be blank"
        });
    }

    // Bio may be blank - so don't check it

    // Generate a verification code






    // HERE - send email to the client to confirm it






    // HERE - create the user object and place it into the database
    const newAccount = new Account({
        userName: String,
        email: String,
        passwordHash: String,
        isLoggedIn: Boolean,
        isverified: Boolean,
        verificationCode: String,

        user: {
            displayName: String,
            bio: String,
            profileImage: Image,

            totalBeans: Number,

            story: {
                beans: Number,
                posts: [StoryPostSchema],
                series: [SeriesSchema],

                liked: [ObjectId],
                disliked: [ObjectId],
                saved: [ObjectId],
                forum: ForumSchema
            },

            comic: {
                beans: Number,
                posts: [ObjectId],
                series: [ObjectId],

                savedStickers: [JSON],

                liked: [ObjectId],
                disliked: [ObjectId],
                saved: [ObjectId],
                forum: ForumSchema
            },


            subscriptions: [SubscriptionSchema],

            likedPosts: [ObjectId],
            dislikedPosts: [ObjectId],
            savedPosts: [ObjectId],

            // If the forum is not active these are just null
            comicForum: ForumSchema,
            storyForum: ForumSchema,
        }
    });








    return res.status(200).json({});
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

    console.log("Attempting to login...");

    return res.status(200).json({});
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

    console.log("Entering forgot password");



    const email = emailController.generateMail("shaan10901@gmail.com", "TESTING");
    emailController.sendMail(email);


    return res.status(200).json({});
}

AuthController.logoutUser = async function (req, res) {
    /* Logout (POST) ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR,
            body: {
                loggedIn: Boolean

                // If 500 (Optional):
                errorMessage: String
            }
        }
    */

    console.log("Attempting to logout.");

    if (!req || !req.userId) {
        return res.status(500);
    }


    try {
        // Update the Token
        auth.verify(req, res, async function () {
            // Now actually do the updating

            // const loggedInUser = await User.findOne({ _id: req.userId });
            // if (loggedInUser) {
            //     loggedInUser.isLoggedIn = false;

            //     await loggedInUser.save();

            //     return res.status(200).json({
            //         loggedIn: false,
            //     });
            // }

            return res
                .status(500)
                .json({
                    errorMessage: "This user was not logged in."
                });
        })


        return res.status(200);
    }
    catch (err) {
        console.error(err);
        return res.status(500);
    }
}

AuthController.confirmCode = async function (req, res) {
    /* Confirm Code (GET) ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR
            
            HTML Page saying, code has been verified
        }
    */

    if (!req || !req.params || !req.params.id) {
        res.status(500).send("Failure to approve the code.");
        return;
    }

    // The code is stored within the request url
    const code = req.params.id;

    console.log("Trying to verify the code:", code);

    return res.status(200).send("<h4>Thank you for confirming your email!  You may login now.</h4>");
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
/** REMINDER **
    - Every response in the controllers must be one of these 2 to actually send the data:
        1. res.status(CODE).send(DATA || EMPTY)
        2. res.status(CODE).json({})
*/

const emailController = require("../Mailer");
const schemas = require('../Schemas/schemas');
const crypto = require("crypto");
const bcrypt = require('bcrypt');


// Helper functions ----------------------------------------------

// Generate a random string with num bytes `len`
function generateCode(len = 22) {
    return crypto.randomBytes(len).toString('hex');
}

function generateEmailAuthLink(userId, code) {
    return "https://coffeehousecomics.com/" + userId + "/" + code;
}

async function sendConfirmationEmail(Recepient, userId, confirmationCode) {
    const authLink = generateEmailAuthLink(userId, confirmationCode);

    const subject = "Confirm your Coffee House Comics Account";
    const message = "Thank you for registering an account with coffee house comics! Press this link (or paste it into the url) to verify your email: " + authLink;

    const emailMessage = emailController.generateMail(Recepient, subject, message);
    await emailController.sendMail(emailMessage);
}

async function sendPasswordResetEmail(Recepient, password) {
    const subject = "You have reset the password for your Coffee House Comics Account";
    const message = "You have reset the password for your Coffee House Comics Account\n \
        The new password is: " + password + "\n \
        You may sign into your account using this new password \n \
        We recommend you change the password to something you can remember\n \
        Have a good day!";

    const emailMessage = emailController.generateMail(Recepient, subject, message);
    await emailController.sendMail(emailMessage);
}

async function generatePassHash(password) {
    const saltRounds = 15;
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
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

            // If error:
            error: String
        }
    */

    try {
        // First we need to confirm all the credentials of the soon-to-be user
        const body = req.body;

        if (!body) {
            return res.status(500).json({
                error: "Malformed Body"
            });
        }

        const userName = body.userName;
        const password = body.password;
        const confirmPassword = body.confirmPassword;
        const email = body.email;
        const displayName = body.displayName;
        const bio = body.bio;

        if (!userName || !password || !confirmPassword || !email || !displayName || !bio) {
            return res.status(500).json({
                error: "Malformed body"
            });
        }

        // Check if username is sufficient
        if (userName.trim() === "") {
            return res.status(500).json({
                error: "Malformed Username"
            });
        }

        // If this username already exists
        if (! await schemas.Account.findOne({ _id: id })) {
            return res.status(500).json({
                error: "Username alreay exists"
            });
        }

        // Check if password is good
        if (password.trim() === "" || password !== confirmPassword) {
            return res.status(500).json({
                error: "Password insufficient or Passwords do not match."
            });
        }

        // Check if email is already registered
        if (! await schemas.Account.findOne({ email: email })) {
            return res.status(500).json({
                error: "This email is associated with an existing account."
            });
        }

        // Brief check on email
        if (email.trim() === "") {
            return res.status(500).json({
                error: "Email is blank"
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
        const code = generateCode();

        // Generate Password Hash
        const passwordHash = await generatePassHash(password);

        // Create the user object
        const newAccount = new schemas.Account({
            userName: userName,
            email: email,
            passwordHash: passwordHash,
            // Wait for email to be verified
            isverified: false,
            verificationCode: code,

            user: {
                displayName: displayName,
                bio: (bio) ? bio : "This user likes to keep things secret.",
                profileImage: null,

                totalBeans: 0,

                story: {
                    beans: 0,
                    posts: [],
                    series: [],

                    liked: [],
                    disliked: [],
                    saved: [],

                    subscriptions: [],

                    forum: {
                        active: false,
                        posts: []
                    }
                },

                comic: {
                    beans: 0,
                    posts: [],
                    series: [],

                    liked: [],
                    disliked: [],
                    saved: [],

                    subscriptions: [],

                    forum: {
                        active: false,
                        posts: []
                    },

                    savedStickers: [],
                },
            }
        });

        //  ...and place it into the database

        const savedAccount = await newAccount.save();
        console.log("New Account saved: " + savedAccount._id);

        // Send email to the client to confirm it (we could await it but no need to)
        sendConfirmationEmail(email, savedAccount._id, code);

        // **Remember we do not login the user here since the email must be confirmed first**

        return res.status(200).json({});
    }
    catch (err) {
        console.log("Create Account Error", err);
        return res.status(500).json({
            error: "Error creating the account."
        });
    }

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
                
                // If error:
                error: String
            }
        }
    */

    console.log("Attempting to login...");

    const body = req.body;

    if (!body) {
        return res.status(500).json({
            error: "Malformed Body"
        });
    }

    const userName = body.userName;
    const password = body.password;

    if (!userName || !password) {
        return res.status(500).json({
            error: "Malformed Body"
        });
    }

    try {
        const targetAccount = await schemas.Account.findOne({ userName: userName });

        if (!targetAccount) {
            return res.status(500).json({
                error: "Account does not exist."
            });
        }

        // Now get the password hash
        const isPasswordCorrect = await bcrypt.compare(password, targetAccount.passwordHash);

        if (!isPasswordCorrect) {
            return res.status(500).json({
                error: "Password is incorrect."
            });
        }

        // By now the user exists and the password has been verified

        // Now create the cookie for the user and return it
        const token = auth.signToken(targetAccount._id);
        console.log(token);

        return res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: true
        }).status(200).json({
            id: targetAccount._id,
            displayName: targetAccount.user.displayName,
            bio: targetAccount.user.bio,
            profileImage: targetAccount.user.profileImage,

        });
    }
    catch (err) {
        console.log("Login Error", err);
        return res.status(500).json({
            error: "Error logging in."
        });
    }
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

    // The way we are doing this is by emailing a new temporary password that will remain 
    //  in effect until the user resets it so something else

    console.log("Entering forgot password");

    const body = req.body;

    if (!body) {
        return res.status(500).json({
            error: "Malformed Body"
        });
    }

    const userName = body.userName;
    const email = body.email;

    if (!userName || !email) {
        return res.status(500).json({
            error: "Malformed Body"
        });
    }

    try {
        const account = await schemas.Account.findOne({ email: email });

        if (!account || account.userName !== userName) {
            return res.status(500).json({
                error: "Either email or username is incorrect"
            });
        }

        // Generate the new temporary password
        const tempPass = generateCode(12);
        const passHash = await generatePassHash(tempPass);

        account.passwordHash = passHash;

        // Send the email with the new password (no need to await)
        sendPasswordResetEmail(account.email, tempPass);

        await account.save();

        return res.status(200).send("<h4>Check your email for a temporary password to use. Most emails arrive within a few minutes</h4>");
    }
    catch (err) {
        console.log("Error in forgot password:", err);
        return res.status(500).json({
            error: "Error resseting password."
        });
    }
}

AuthController.logoutUser = async function (req, res) {
    /* Logout (POST) ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR,
            body: {
                // If 500 (Optional):
                error: String
            }
        }
    */

    console.log("Attempting to logout.");

    if (!req || !req.userId) {
        return res.status(500).send();
    }


    try {
        // Update the Token

        // Now actually do the updating

        const loggedInUser = await schemas.Account.findOne({ _id: req.userId });

        if (!loggedInUser) {
            return res.status(400).json({
                error: "User does not exist",
            });
        }

        // Now create the cookie for the user (with the expired token) and return it
        const token = auth.expireToken();
        console.log(token);

        return res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: true
        }).status(200).json({
            id: targetAccount._id,
            displayName: targetAccount.user.displayName,
            bio: targetAccount.user.bio,
            profileImage: targetAccount.user.profileImage,

        });
    }
    catch (err) {
        console.log("Login Error", err);
        return res.status(500).json({
            error: "Error logging out."
        });
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

    if (!req || !req.params || !req.params.id || !req.params.code) {
        return res.status(500).send("Failure to approve the code.");
    }

    // The code is stored within the request url
    const id = req.params.id;
    const code = req.params.code;

    console.log("Trying to verify the code " + code + " for user id:", id);

    try {
        // Get the user by ID
        const user = await schemas.Account.findOne({ _id: id });

        if (!user) {
            return res.status(500).send("Failure to approve the code.");
        }

        const savedCode = user.verificationCode;

        if (!savedCode) {
            return res.status(500).send("Server error");
        }

        if (savedCode !== code) {
            return res.status(500).send("Failure to match the code.");
        }

        // Reach here if the code is valid
        user.isverified = true;

        await user.save();

        return res.status(200).send("<h4>Thank you for confirming your email!  You may login now.</h4>");
    }
    catch (err) {
        return res.status(500).send("Failure to match the code.");
    }
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

                // If error:
                error: String
            }
        }
    */

    console.log("Attempting to update profile.");

    if (!req || !req.userId) {
        return res.status(500).send();
    }

    const body = req.body;

    if (!body) {
        return res.status(500).json({
            error: "Malformed Body"
        });
    }

    const image = body.image;
    const displayName = body.displayName;
    const bio = body.bio;

    if (!image || !displayName || !bio) {
        return res.status(500).json({
            error: "Malformed Body"
        });
    }

    try {
        const account = await schemas.Account.findOne({ _id: req.userId });

        if (!user) {
            return res.status(500).json({
                error: "User does not exist"
            });
        }

        account.user.displayName = displayName;
        account.user.bio = bio;
        account.user.profileImage = image;

        // Now save the updated account
        const savedAccount = await account.save();

        return res.status(200).json({
            id: savedAccount._id,
            displayName: savedAccount.user.displayName,
            bio: savedAccount.user.bio,
            profileImage: savedAccount.user.profileImage
        });
    }
    catch (err) {
        console.log("Update Account Error", err);
        return res.status(500).json({
            error: "Error Updating profile."
        });
    }
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

            // If there is an error
            error: String
        }
    */

    console.log("Attempting to change the password.");

    if (!req || !req.userId) {
        return res.status(500).send();
    }

    const body = req.body;

    if (!body) {
        return res.status(500).json({
            error: "Malformed Body"
        });
    }

    const oldPassword = body.oldPassword;
    const newPassword = body.newPassword;
    const confirmNewPassword = body.confirmNewPassword;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
        return res.status(500).json({
            error: "Malformed Body"
        });
    }

    if (newPassword !== confirmNewPassword) {
        return res.status(500).json({
            error: "New Passwords do not match"
        });
    }

    try {
        const targetAccount = await schemas.Account.findOne({ _id: req.userId });

        const isPasswordCorrect = await bcrypt.compare(oldPassword, targetAccount.passwordHash);

        if (!isPasswordCorrect) {
            return res.status(500).json({
                error: "Old password is incorrect."
            });
        }

        // Generate Password Hash
        const passwordHash = await generatePassHash(newPassword);

        targetAccount.passwordHash = passwordHash;

        await targetAccount.save();

        return res.status(200).send();
    }
    catch (err) {
        console.log("Error in change password:", err);
        return res.status(500).json({
            error: "Error changing password"
        });
    }
}

AuthController.changeUserName = async function (req, res) {
    /* Chnage Username ------------
        Request body: {
            newUserName: String
        }
    
        Response {
            status: 200 OK or 500 ERROR
            body: {
                id: ObjectId
                displayName: String,
                bio: String,
                profileImage: Image,

                // If there is an error:
                error: String
            }
        }
    */

    console.log("Attempting to change the userName.");

    if (!req || !req.userId) {
        return res.status(500).send();
    }

    const body = req.body;

    if (!body) {
        return res.status(500).json({
            error: "Malformed Body"
        });
    }

    const newUserName = body.newUserName;

    if (!newUserName) {
        return res.status(500).json({
            error: "Malformed Body"
        });
    }

    try {
        // First let's make sure somebody else doesn't have the same username
        const potentialConflict = await schemas.Account.findOne({ userName: newUserName });

        if (!potentialConflict) {
            return res.status(500).json({
                error: "Somebody else has this username"
            });
        }

        const targetAccount = await schemas.Account.findOne({ _id: req.userId });

        targetAccount.userName = newUserName;

        const savedAccount = await targetAccount.save();

        return res.status(200).json({
            id: savedAccount._id,
            displayName: savedAccount.user.displayName,
            bio: savedAccount.user.bio,
            profileImage: savedAccount.user.profileImage
        });
    }
    catch (err) {
        console.log("Error in change userName:", err);
        return res.status(500).json({
            error: "Error changing userName"
        });
    }
}

module.exports = AuthController;
const jwt = require("jsonwebtoken")

function authManager() {
    verify = function (req, res, next) {
        // console.log("req: " + req);
        // console.log("next: " + next);
        console.log("Who called verify?");
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).json({
                    loggedIn: false,
                    user: null,
                    errorMessage: "Unauthorized"
                })
            }

            const verified = jwt.verify(token, process.env.JWT_SECRET)
            console.log("verified.userId: " + verified.userId);
            req.userId = verified.userId;

            // Get the expiration time
            const time = req.exp;
            const currentTime = Math.floor(Date.now() / 1000);
            const isExpired = time <= currentTime;

            if (isExpired) {
                return res.status(401).json({
                    user: null,
                    errorMessage: "Expired"
                });
            }

            next();
        } catch (err) {
            console.error(err);
            return res.status(401).json({
                user: null,
                errorMessage: "Unauthorized"
            });
        }
    }

    expire = function (token) {
        try {

        } catch (err) {

        }
    }

    verifyUser = function (req) {
        try {
            const token = req.cookies.token;
            if (!token) {
                return null;
            }

            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            return decodedToken.userId;
        } catch (err) {
            return null;
        }
    }

    signToken = function (userId) {
        return jwt.sign({
            userId: userId
        }, process.env.JWT_SECRET, { expiresIn: '1h' });
    }

    return this;
}

const auth = authManager();
module.exports = auth;
const jwt = require("jsonwebtoken");
const schemas = require('../Schemas/schemas');
const mongoose = require('mongoose');

function authManager() {
    verify = function (req, res, next) {
        console.log("Who called verify?");
        try {
            const token = req.cookies.token;
            if (!token) {
                return res.status(401).json({
                    loggedIn: false,
                    user: null,
                    error: "Unauthorized"
                })
            }

            const verified = jwt.verify(token, process.env.JWT_SECRET)
            console.log("verified.userId: " + verified.userId);
            req.userId = verified.userId;

            // Get the expiration time
            const time = req.exp;
            const currentTime = Math.floor(Date.now() / 1000);
            console.log("Time, current Time:", time, currentTime);
            const isExpired = time <= currentTime;

            if (isExpired) {
                return res.status(401).json({
                    userId: null,
                    error: "Expired"
                });
            }

            next();
        } catch (err) {
            console.error(err);
            return res.status(401).json({
                userId: null,
                error: "Unauthorized"
            });
        }
    }

    expireToken = function () {
        return jwt.sign({
            exp: 0,
            userId: null
        }, process.env.JWT_SECRET);
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
        }, process.env.JWT_SECRET, { expiresIn: '48h' });
    }

    return this;
}

const auth = authManager();
module.exports = auth;
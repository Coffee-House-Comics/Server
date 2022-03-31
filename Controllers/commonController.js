/*
    ** This controller hosts methods that are the same for both comic and story such as get profile by id **
*/

const schemas = require('../Schemas/schemas');
const types = require('../Schemas/types');
const utils = require('../Utils');

// Helper functions ----------------------------------------------

function arrRemove(arr, toRemove) {
    return utils.arrRemove(arr, toRemove);
}

function findObjInArrayById(arr, id) {
    return utils.findObjInArrayById(arr, id);
}

// Main functions ----------------------------------------------

const CommonController = {};

CommonController.getProfileById = async function (req, res) {
    /* Get profile By ID ------------
        Request body: {}

        Response {
            status 200 OK or 500 ERROR
            body: {
                id: ObjectId
                displayName: String,
                bio: String,
                profileImage: Image,

                storyBeans: Number,
                comicBeans: Number,

                // If error:
                error: String
            }
        }
    */

    console.log("Entering getProfileById");

    if (!req || !req.params || !req.params.id) {
        return res.status(500).json({
            error: "No id provided"
        });
    }

    try {
        const account = await schemas.Account.findOne({ _id: req.params.id });

        if (!account) {
            return res.status(500).json({
                err: "user does not exist"
            });
        }

        return res.status(200).json({
            id: account._id,
            displayName: account.user.displayName,
            bio: account.user.bio,
            profileImage: account.user.profileImage
        });

    }
    catch (err) {
        return res.status(500).json({
            err: "Server error getting profile by id"
        });
    }
}

CommonController.getProfileByUserName = async function (req, res) {
    /* Get profile By userName ------------
        Request body: {}

        Response {
            status 200 OK or 500 ERROR
            body: {
                id: ObjectId
                displayName: String,
                bio: String,
                profileImage: Image,
            }
        }
    */

    console.log("Entering getProfileByUserName");

    if (!req || !req.params || !req.params.userName) {
        return res.status(500).json({
            error: "No userName provided"
        });
    }

    try {
        const account = await schemas.Account.findOne({ userName: req.params.userName });

        if (!account) {
            return res.status(500).json({
                err: "user does not exist"
            });
        }

        return res.status(200).json({
            id: account._id,
            displayName: account.user.displayName,
            bio: account.user.bio,
            profileImage: account.user.profileImage
        });

    }
    catch (err) {
        return res.status(500).json({
            err: "Server error getting profile by user Name"
        });
    }
}
























// TODO: Vote on a comment on a post
CommonController.vote_comment = async function (req, res, isStory) {
    /* Vote on a Comment ------------
        Request body: {
            type: Integer

            // The id of the account that owns the post or the location of the forum where the forum post is
            locationOwnerId: String
        }
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}


















CommonController.publish = async function (req, res, mode) {
    /* Publish Story ------------ 
        Request body: {
            series: {
                isSeriesMember: Boolean,
                seriesName: String,
            },

            Response {
                status 200 OK or 500 ERROR
            }
        }
    */






}


module.exports = CommonController;
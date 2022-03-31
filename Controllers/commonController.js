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






























CommonController.vote_forumPost = async function (req, res) {
    /* Vote on a Forum Post ------------
        Request body: {
            type: Integer,
            // The id of the user that owns the forum
            forumOwnerId: String
        }
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */

    console.log("Entering vote on story forum post");

    if (!req || !req.userId) {
        return res.status(500).send();
    }

    if (!req.params || !req.params.id) {
        return res.status(500).json({
            error: "No id provided"
        });
    }

    const body = req.body;

    if (!body) {
        return res.status(500).json({
            error: "Malformed Body"
        });
    }

    const type = body.type;
    const forumOwnerId = body.forumOwnerId;

    if (!type || !forumOwnerId) {
        return res.status(500).json({
            error: "Malformed Body"
        });
    }

    try {
        // Get account that is doing the voting
        const account = await schemas.Account.findOne({ _id: req.userId });

        // Get account of the Account that owns the forum
        const forumOwner = await schemas.Account.findOne({ _id: forumOwnerId });

        if (!account || !forumOwner) {
            return res.status(500).json({
                error: "Issue finding users"
            });
        }

        const forumPostObj = forumOwner.user.story.forum;

        if (!forumPostObj || !forumPostObj.active) {
            return res.status(500).json({
                error: "Invalid request"
            });
        }

        // Get forum post that the voting is happening on
        const post = utils.findObjInArrayById(forumPostObj.posts, req.params.id);

        if (!post) {
            return res.status(500).json({
                error: "Forum Post does not exist"
            });
        }

        // Get the owner of the forum post
        const postOwner = await schemas.Account.findOne({ _id: post.ownerId });

        const userLiked = account.user.story.liked;
        const userDisliked = account.user.story.disliked;

        // 3 Different cases
        if (userLiked.includes(post._id)) {
            if (type === types.VoteType.down) {
                userLiked = arrRemove(userLiked, post._id);
                post.beans -= 2;
                postOwner.user.story.beans -= 2;
                userDisliked.push(post._id);
            }
            else if (type === types.VoteType.up) {
                /* Do Nothing */
            }
            else {
                userLiked = arrRemove(userLiked, post._id);
                post.beans -= 1;
                postOwner.user.story.beans -= 1;
            }
        }
        else if (userDisliked.includes(post._id)) {
            if (type === types.VoteType.down) {
                /* Do Nothing */
            }
            else if (type === types.VoteType.up) {
                userDisliked = arrRemove(userDisliked, post._id);
                post.beans += 2;
                postOwner.user.story.beans += 2;
                userLiked.push(post._id);
            }
            else {
                userDisliked = arrRemove(userDisliked, post._id);
                post.beans += 1;
                postOwner.user.story.beans += 1;
            }
        }
        else {
            if (type === types.VoteType.down) {
                userDisliked.push(post._id);
                post.beans -= 1;
                postOwner.user.story.beans -= 1;
            }
            else if (type === types.VoteType.up) {
                userLiked.push(post._id);
                post.beans += 1;
                postOwner.user.story.beans += 1;
            }
            else {
                /* Do nothing */
            }
        }

        // Now we need to do the saving



        await postOwner.save();


        res.status(200).send();
    }
    catch (err) {
        res.status(500).json({
            error: "Server issue with voting on forum post."
        });
    }
}

// TODO:
CommonController.vote_comment = async function (req, res, isStory) {
    /* Vote on a Comment ------------
        Request body: {
            type: Integer

            // Where does the comment sit: Forum Post or Post
            commentLocation: Integer
            forumPostId: String // null if comment location not in a forumPost

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
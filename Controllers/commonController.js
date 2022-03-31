/*
    ** This controller hosts methods that are the same for both comic and story such as get profile by id **
*/

const schemas = require('../Schemas/schemas');
const types = require('../Schemas/types');

// Helper functions ----------------------------------------------

function arrRemove(arr, toRemove) {
    return arr.filter(item => item !== toRemove);
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











// Voting (upvoting/downvoting AKA liking/disliking)
CommonController.vote = async function (req, res, isStory) {
    /* Vote on a Story OR Comic Post ------------
        Request body: {
            type: Integer (-1, 0, 1)
        }
    
        Response {
            status: 200 OK or 500 ERROR,

            //If error
            error: String
        }
    */

    console.log("Entering vote on post (common)");

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

    if (!type) {
        return res.status(500).json({
            error: "Malformed Body"
        });
    }

    try {
        // Get account that is doing the voting
        const account = await schemas.Account({ _id: req.userId });

        // Get post that the voting is happening on
        let post = null;
        if (isStory)
            post = await schemas.StoryPost.findOne({ _id: req.params.id });
        else
            post = await schemas.ComicPost.findOne({ _id: req.params.id });

        if (!account || !post) {
            return res.status(500).json({
                error: "User or post does not exist"
            });
        }

        let userLiked = null;
        let userDisliked = null;
        if (isStory) {
            userLiked = account.user.story.liked;
            userDisliked = account.user.story.disliked;
        }
        else {
            userLiked = account.user.comic.liked;
            userDisliked = account.user.comic.disliked;
        }

        // 3 Different cases
        if (userLiked.includes(post._id)) {
            if (type === types.VoteType.down) {
                userLiked = arrRemove(userLiked, post._id);
                post.beans -= 2;
                userDisliked.push(post._id);
            }
            else if (type === types.VoteType.up) {
                /* Do Nothing */
            }
            else {
                userLiked = arrRemove(userLiked, post._id);
                post.beans -= 1;
            }
        }
        else if (userDisliked.includes(post._id)) {
            if (type === types.VoteType.down) {
                /* Do Nothing */
            }
            else if (type === types.VoteType.up) {
                userDisliked = arrRemove(userDisliked, post._id);
                post.beans += 2;
                userLiked.push(post._id);
            }
            else {
                userDisliked = arrRemove(userDisliked, post._id);
                post.beans += 1;
            }
        }
        else {
            if (type === types.VoteType.down) {
                userDisliked.push(post._id);
                post.beans -= 1;
            }
            else if (type === types.VoteType.up) {
                userLiked.push(post._id);
                post.beans += 1;
            }
            else {
                /* Do nothing */
            }
        }

        res.status(200).send();

    }
    catch (err) {
        res.status(500).json({
            error: "Server issue with voting on post."
        });
    }
}

// TODO:
CommonController.vote_forumPost = async function (req, res, isStory) {
    /* Vote on a Forum Post ------------
        Request body: {
            type: Integer,
            // The id of the user that owns the forum
            forumUserId: String
        }
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */

    console.log("Entering vote on  forum post (common)");

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

    if (!type) {
        return res.status(500).json({
            error: "Malformed Body"
        });
    }

    try {
        // Get account that is doing the voting
        const account = await schemas.Account({ _id: req.userId });

        // Get forum post that the voting is happening on
        const post = schemas.ForumPost.findOne({ _id: req.params.id });

        if (!account || !post) {
            return res.status(500).json({
                error: "User or forumPost does not exist"
            });
        }

        let userLiked = null;
        let userDisliked = null;
        if (isStory) {
            userLiked = account.user.story.liked;
            userDisliked = account.user.story.disliked;
        }
        else {
            userLiked = account.user.comic.liked;
            userDisliked = account.user.comic.disliked;
        }

        // 3 Different cases
        if (userLiked.includes(post._id)) {
            if (type === types.VoteType.down) {
                userLiked = arrRemove(userLiked, post._id);
                post.beans -= 2;
                userDisliked.push(post._id);
            }
            else if (type === types.VoteType.up) {
                /* Do Nothing */
            }
            else {
                userLiked = arrRemove(userLiked, post._id);
                post.beans -= 1;
            }
        }
        else if (userDisliked.includes(post._id)) {
            if (type === types.VoteType.down) {
                /* Do Nothing */
            }
            else if (type === types.VoteType.up) {
                userDisliked = arrRemove(userDisliked, post._id);
                post.beans += 2;
                userLiked.push(post._id);
            }
            else {
                userDisliked = arrRemove(userDisliked, post._id);
                post.beans += 1;
            }
        }
        else {
            if (type === types.VoteType.down) {
                userDisliked.push(post._id);
                post.beans -= 1;
            }
            else if (type === types.VoteType.up) {
                userLiked.push(post._id);
                post.beans += 1;
            }
            else {
                /* Do nothing */
            }
        }

        res.status(200).send();

    }
    catch (err) {
        res.status(500).json({
            error: "Server issue with voting on forum post."
        });
    }
}

// TODO:
CommonController.vote_comment = async function (req, res) {
    /* Vote on a Comment ------------
        Request body: {
            type: Integer
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
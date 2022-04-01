const schemas = require('../Schemas/schemas');

const utils = {};

utils.constructProfileObjFromAccount = function (account) {
    if (!account || !account._id || !account.user || !account.user.displayName ||
        !account.user.bio || !account.user.profileImage || !account.user.story.beans ||
        !account.user.comic.beans) {
        return null;
    }

    return {
        id: account._id,
        displayName: account.user.displayName,
        bio: account.user.bio,
        profileImage: account.user.profileImage,

        storyBeans: account.user.story.beans,
        comicBeans: account.user.story.beans,

        storyForum: (account.user.story.forum.active) ? account.user.story.forum.posts : null,
        comicForum: (account.user.comic.forum.active) ? account.user.comic.forum.posts : null,
    };
}

utils.findObjInArrayById = function (arr, id) {
    return arr.find(element => element._id === id)
}

utils.arrRemove = function (arr, toRemove) {
    return arr.filter(item => item !== toRemove);
}

/**
 * Removes all "effects" of a comment
 * Updates bean count and liked/disliked lists of all users involved in comment.
 * 
 * @param {CommentSchema} comment The comment to disconnect
 * @returns A string error if one occurred, null if successful
 */
utils.disconnectComment = async function (comment) {
    //Find the user who made this comment
    let commenter = await schemas.Account.findOne({ _id: comment.ownerId });
    if (!commenter) {
        return "Error finding comment owner";
    }

    //Find all users who liked this comment
    for (let likerID of comment.whoLiked) {
        //Find the user for this ID
        let liker = await schemas.Account.findOne({ _id: likerID });
        if (!liker) {
            return "Liker could not be found";
        }

        //Change the commenter's reputation
        let currentBeanCount = commenter.user.story.beans;
        try {
            await schemas.Account.findByIdAndUpdate(userId, {
                "$set": { "user.story.beans": currentBeanCount - 1 }
            });
        } catch (err) {
            return "Error updating commenter's bean count";
        }

        //Remove this comment from the user's list of liked things
        let likedIds = Utils.arrRemove(liker.user.story.liked, comment._id);
        try {
            await schemas.Account.findByIdAndUpdate(userId, {
                "$set": { "user.story.liked": likedIds }
            });
        } catch (err) {
            return "Error updating comment liker's list of liked objects";
        }
    }

    //Find all users who disliked this comment
    for (let dislikerID of comment.whoDisliked) {
        //Find the user for this ID
        let disliker = await schemas.Account.findOne({ _id: dislikerID });
        if (!disliker) {
            return "Disliker could not be found";
        }

        //Change the commenter's reputation
        let currentBeanCount = commenter.user.story.beans;
        try {
            await schemas.Account.findByIdAndUpdate(userId, {
                "$set": { "user.story.beans": currentBeanCount + 1 }
            });
        } catch (err) {
            return "Error updating commenter's bean count";
        }

        //Remove this comment from the user's list of disliked things
        let dislikedIds = Utils.arrRemove(disliker.user.story.disliked, comment._id);
        try {
            await schemas.Account.findByIdAndUpdate(userId, {
                "$set": { "user.story.disliked": dislikedIds }
            });
        } catch (err) {
            return "Error updating comment disliker's list of disliked objects";
        }
    }
    return null;
}
module.exports = utils;
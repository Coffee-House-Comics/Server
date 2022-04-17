const schemas = require('../Schemas/schemas');
const mongoose = require('mongoose');
const deepEqual = require('fast-deep-equal/es6');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const utils = {};

utils.verifyValidId = function (req, res, next) {
    if (!req.params || !req.params.id) {
        return res.status(500).json({
            error: "No ID provided in request params"
        });
    } else {
        try {
            mongoose.Types.ObjectId(req.params.id)
            next();
        } catch (err) {
            console.error("Invalid ID in request params: " + req.params.id);
            return res.status(500).json({
                error: "Invalid ID in request params"
            });
        }
    }
}

utils.generatePostSnapshot = async function (isComic, posts) {
    console.log("Posts:", posts);
    const snapshots = await Promise.all(posts.flatMap(async function (value) {
        // Get the post data
        const post = (isComic) ? await schemas.ComicPost.findOne({ _id: value }) : await schemas.StoryPost.find({ _id: value });

        // console.log("post:", post);

        return (post && posts.isPublished) ? [{
            name: post.name,
            author: post.author,
            series: post.series,
            beans: post.beans
        }] : [];
    }));

    console.log("GPS:", snapshots);

    return snapshots;
}

utils.constructProfileObjFromAccount = async function (account) {
    if (!account || !account._id || !account.user || !account.user.displayName ||
        (account.user.bio === null) || (account.user.profileImage === null) || (account.user.story.beans === null) ||
        (account.user.comic.beans === null)) {
        return null;
    }

    return {
        id: account._id,
        displayName: account.user.displayName,
        userName: account.userName,
        bio: account.user.bio,
        profileImage: account.user.profileImage,

        storyBeans: account.user.story.beans,
        comicBeans: account.user.story.beans,

        storySnapshots: await utils.generatePostSnapshot(false, account.user.story.posts),
        comicSnapshots: await utils.generatePostSnapshot(true, account.user.comic.posts),

        // TODO: Fix this - we dont actually store this information
        storySubscribers: 0,
        comicSubscribers: 0,

        storyForum: (account.user.story.forum.active) ? account.user.story.forum.posts : null,
        comicForum: (account.user.comic.forum.active) ? account.user.comic.forum.posts : null,
    };
}

utils.findObjInArrayById = function (arr, id) {
    return arr.find(element => element._id == id)
}

utils.arrRemove = function (arr, toRemove) {
    return arr.filter(item => !deepEqual(item, toRemove));
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
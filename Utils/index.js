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

utils.generatePostSnapshot = async function (isComic, posts, isMy) {
    console.log("Posts:", posts);
    let snapshots = await Promise.all(posts.flatMap(async function (value) {
        // Get the post data
        // console.log("ID?", value);
        const post = (isComic) ? await schemas.ComicPost.findById(value) : await schemas.StoryPost.findById(value);

        // console.log("post:", post);

        return (post && (isMy || post.isPublished)) ? [{
            name: post.name,
            _id: post._id,
            author: post.author,
            series: post.series,
            beans: post.beans,
            coverPhoto: post.coverPhoto,
            isPublished: post.isPublished,
            publishedDate: Date,
        }] : [];
    }));

    snapshots = snapshots.filter(elem => { return elem.length > 0 });

    console.log("GPS:", JSON.stringify(snapshots));

    return snapshots;
}

utils.constructSeriesRepresentation = function (allPosts) {
    // First get all the different types of series
    const seriesMap = new Map();

    allPosts.forEach(([element]) => {
        // console.log("csr elem:", JSON.stringify(element));

        if (seriesMap.has(element.series)) {
            const entry = seriesMap.get(element.series);
            // console.log("Entry:", JSON.stringify(entry));

            entry.posts = [...entry.posts, element];
            seriesMap.set(element.series, entry);
        }
        else {
            seriesMap.set(element.series, {
                name: element.series,
                posts: [element]
            });
        }
    });

    // console.log("map:", JSON.stringify(seriesMap));

    const out = [...seriesMap.values()];

    // console.log("csr:", JSON.stringify(out));

    return out;
}

utils.constructProfileObjFromAccount = async function (account, isMy) {
    if (!account || !account._id || !account.user || !account.user.displayName ||
        (account.user.bio === null) || (account.user.profileImage === null) || (account.user.story.beans === null) ||
        (account.user.comic.beans === null)) {
        return null;
    }

    const storySnaps = await utils.generatePostSnapshot(false, account.user.story.posts, isMy);
    const comicSnaps = await utils.generatePostSnapshot(true, account.user.comic.posts, isMy);

    const out = {
        _id: account._id,
        displayName: account.user.displayName,
        userName: account.userName,
        bio: account.user.bio,
        profileImage: account.user.profileImage,
        email: account.email,

        storyBeans: account.user.story.beans,
        comicBeans: account.user.story.beans,

        storySnapshots: utils.constructSeriesRepresentation(storySnaps),
        comicSnapshots: utils.constructSeriesRepresentation(comicSnaps),

        // TODO: Fix this - we dont actually store this information
        storySubscribers: 0,
        comicSubscribers: 0,

        storyForum: (account.user.story.forum.active) ? account.user.story.forum.posts : null,
        comicForum: (account.user.comic.forum.active) ? account.user.comic.forum.posts : null,
    };

    console.log("out:", out.comicSnapshots);

    return out;
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
 * @param {Boolean} isComic true 
 * @param {CommentSchema} comment The comment to disconnect
 * @returns A string error if one occurred, null if successful
 */
utils.disconnectComment = async function (isComic, comment) {
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

        if (isComic) {
            //Change the commenter's reputation
            let currentBeanCount = commenter.user.comic.beans;
            try {
                await schemas.Account.findByIdAndUpdate(comment.ownerId, {
                    "$set": { "user.comic.beans": currentBeanCount - 1 }
                });
            } catch (err) {
                return "Error updating commenter's bean count (was " + currentBeanCount + "). ID: " + comment.ownerId;
            }

            //Remove this comment from the user's list of liked things
            let likedIds = utils.arrRemove(liker.user.comic.liked, comment._id);
            try {
                await schemas.Account.findByIdAndUpdate(comment.ownerId, {
                    "$set": { "user.comic.liked": likedIds }
                });
            } catch (err) {
                return "Error updating comment liker's list of liked objects";
            }

        } else {
            //Change the commenter's reputation
            let currentBeanCount = commenter.user.story.beans;
            try {
                await schemas.Account.findByIdAndUpdate(comment.ownerId, {
                    "$set": { "user.story.beans": currentBeanCount - 1 }
                });
            } catch (err) {
                return "Error updating commenter's bean count (was " + currentBeanCount + ")";
            }

            //Remove this comment from the user's list of liked things
            let likedIds = utils.arrRemove(liker.user.story.liked, comment._id);
            try {
                await schemas.Account.findByIdAndUpdate(comment.ownerId, {
                    "$set": { "user.story.liked": likedIds }
                });
            } catch (err) {
                return "Error updating comment liker's list of liked objects";
            }
        }

    }

    //Find all users who disliked this comment
    for (let dislikerID of comment.whoDisliked) {
        //Find the user for this ID
        let disliker = await schemas.Account.findOne({ _id: dislikerID });
        if (!disliker) {
            return "Disliker could not be found";
        }

        if (isComic) {
            //Change the commenter's reputation
            let currentBeanCount = commenter.user.comic.beans;
            try {
                await schemas.Account.findByIdAndUpdate(comment.ownerId, {
                    "$set": { "user.comic.beans": currentBeanCount + 1 }
                });
            } catch (err) {
                return "Error updating commenter's bean count";
            }

            //Remove this comment from the user's list of disliked things
            let dislikedIds = utils.arrRemove(disliker.user.comic.disliked, comment._id);
            try {
                await schemas.Account.findByIdAndUpdate(comment.ownerId, {
                    "$set": { "user.comic.disliked": dislikedIds }
                });
            } catch (err) {
                return "Error updating comment disliker's list of disliked objects";
            }
        } else {
            //Change the commenter's reputation
            let currentBeanCount = commenter.user.story.beans;
            try {
                await schemas.Account.findByIdAndUpdate(comment.ownerId, {
                    "$set": { "user.story.beans": currentBeanCount + 1 }
                });
            } catch (err) {
                return "Error updating commenter's bean count";
            }

            //Remove this comment from the user's list of disliked things
            let dislikedIds = utils.arrRemove(disliker.user.story.disliked, comment._id);
            try {
                await schemas.Account.findByIdAndUpdate(comment.ownerId, {
                    "$set": { "user.story.disliked": dislikedIds }
                });
            } catch (err) {
                return "Error updating comment disliker's list of disliked objects";
            }
        }

    }
    return null;
}
module.exports = utils;
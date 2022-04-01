/** REMINDER **
    - Every response in the controllers must be one of these 2 to actually send the data:
        1. res.status(CODE).send(DATA || EMPTY)
        2. res.status(CODE).json({})
*/

const schemas = require('../Schemas/schemas');
const common = require('./commonController');
const Utils = require('../Utils');
const { SubscriptionType } = require('../Schemas/types');
const { json } = require('body-parser');

// Variables -----------------------------------------------------

//The number of recent posts to deliver for explore page
const NUM_RECENT_POSTS = 10;

//The number of most liked posts to deliver for explore page
const NUM_LIKED_POSTS = 10;

// Helper functions ----------------------------------------------


// Main functions ------------------------------------------------

const ComicController = {};

ComicController.explore = async function (req, res) {
    /* Explore ------------
        Request body: {}

        Response {
            status 200 OK or 500 ERROR
            body: {
                mostRecent: [ComicPost Objects]
                mostLiked: [ComicPost Objects]

                //If error
                error: String
            }
        }
    */

    let recentContent = [];
    let likedContent = [];

    //Find most recent posts
    recentContent = await schemas.ComicPost.find({}).sort({ publishedDate: 'descending' }).limit(NUM_RECENT_POSTS);

    //Find most liked posts
    likedContent = await schemas.ComicPost.find({}).sort({ beans: 'descending' }).limit(NUM_LIKED_POSTS);

    //Convert lists from Post objects to IDs
    recentIds = recentContent.map((post) => post._id);
    likedIds = likedContent.map((post) => post._id);

    if (recentContent && likedContent) {
        //Send content in response body
        return res.status(200).json({
            mostRecent: recentIds,
            mostLiked: likedIds
        });
    }

    return res.status(500).json({
        error: "Server error processing explore request"
    });

}

ComicController.search = async function (req, res) {
    /* Search ------------
        Request body: {
            searchCriteria: [String]
        }

        Response {
            status 200 OK or 500 ERROR
            body: {
                content: {
                    posts: [ObjectId]
                    authors: [ObjectId]
                }

                //If error
                error: String
            }
        }
    */

    //Find all posts
    let posts = await schemas.ComicPost.find({});

    //Find all authors
    let authors = await schemas.Account.find({});

    //Check for errors
    if (!posts || !authors) {
        return res.status(500).json({
            error: "Server error getting all posts & authors to search/sort"
        });
    }

    //Build custom author objects
    authors = authors.map((account) => {
        return {
            id: account._id,
            displayName: account.user.displayName,
            bio: account.user.bio,
            profileImage: account.user.profileImage
        }
    });

    //Filter results by search
    if (req.body && req.body.searchCriteria) {
        for (let query of searchCriteria) {
            //Filter posts
            posts = posts.filter((post) => {
                return (post.name.includes(query) || post.author.includes(query) || post.series.includes(query));
            });

            //Filter authors
            authors = authors.filter((author) => {
                return (author.displayName.includes(query));
            });
        }
    }

    //Get lists of IDs to return
    let postIds = posts.map((post) => post._id);
    let authorIds = authors.map((author) => author.id);

    return res.status(200).json({
        posts: postIds,
        authors: authorIds
    });
}

ComicController.subscriptions = async function (req, res) {
    /* Subscriptions ------------
        Request body: {}

        Response {
            status 200 OK or 500 ERROR
            body: {
                content: [ObjectId]

                //If error
                error: String
            }
        }
    */

    //Get the user that made the request
    let account = await schemas.Account.findOne({ _id: req.userId });

    //Check for error
    if (!account) {
        return res.status(500).json({
            error: "Server error getting user from ID"
        });
    }
    let user = account.user;

    //Find all posts
    let content = await schemas.ComicPost.find({});
    if (!content) {
        return res.status(500).json({
            error: "Server error getting user from ID"
        });
    }

    //Filter for subscribed posts
    content = content.filter((post) => {
        return user.comic.subscriptions.map((subscription) => subscription.id).includes(post._id);
    });

    //Get IDs to return instead of objects
    contentIds = content.map((post) => post._id);

    return res.status(200).json({
        content: contentIds
    });
}

ComicController.getProfileById = async function (req, res) {
    /* Get profile By ID ------------
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
}

ComicController.getProfileByUserName = async function (req, res) {
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
}


// Need Authentication ------------------------------------------------

// Creating
ComicController.create = async function (req, res) {
    /* Create a Comic Post (On the backend) ------------
        Request body: {
            name: String,
            description: String
        }

        Response {
            status: 200 OK or 500 ERROR,
            body: {
                id: ObjectId

                //If error
                error: String
            }
        }
    */

    //Check params
    if (!req) {
        return res.status(500).json({
            error: "No request provided"
        });
    }
    if (!req.userId) {
        return res.status(500).json({
            error: "User ID not found"
        });
    }
    if (!req.body || !req.body.name || !req.body.description) {
        return res.status(400).json({
            error: "Invalid request body"
        });
    }

    //Get params
    let userId = req.userId;
    let name = req.body.name;
    let description = req.body.description;

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Create comic and save to DB
    let createdComic = null;
    try {
        createdComic = await schemas.ComicPost.create({
            name: name,
            description: description,
            author: account.user.displayName,
            isPublished: false,
            publishedDate: null,
            beans: 0,
            series: null,
            comments: [],
            authorID: userId,
            unpublished: [],
            published: []
        });
    } catch (err) {
        return res.status(500).json({
            error: "Error saving new comic"
        })
    }

    //Get current posts array
    let currentPosts = account.user.comic.posts;
    if (!currentPosts) {
        currentPosts = [];
    }

    //Add post to user's posts array
    currentPosts.push(createdComic._id);

    //Save change to user
    try {
        await schemas.Account.findByIdAndUpdate(userId, {
            "$set": { "user.comic.posts": currentPosts }
        });
    } catch (err) {
        return res.status(500).json({
            error: "Error updating forum state"
        });
    }

    res.status(200).json({
        id: createdComic._id
    });
}

ComicController.published = async function (req, res) {
    /* Get published comic by id  ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR,
            body: {
                content: ComicPost object

                //If error
                error: String
            }
        }
    */

    //Get params
    let comicId = req.params.id;

    //Get post
    let comic = await schemas.ComicPost.findOne({ _id: comicId });
    if (!comic) {
        return res.status(500).json({
            error: "Comic could not be found"
        });
    }

    //Make sure user the comic is published
    if (!comic.isPublished) {
        return res.status(403).json({
            error: "This comic is not published"
        });
    }

    //The comic is published. Now send it in response
    return res.status(200).json({
        content: comic
    });
}

ComicController.unpublished = async function (req, res) {
    /* Get UNpublished comic by id  ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR,
            body: {
                content: ComicPost object

                //If error
                error: String
            }
        }
    */

    //Check params
    if (!req) {
        return res.status(500).json({
            error: "No request provided"
        });
    }
    if (!req.params.id) {
        return res.status(500).json({
            error: "No id provided"
        });
    }
    if (!req.userId) {
        return res.status(500).json({
            error: "User ID not found"
        });
    }

    //Get params
    let userId = req.userId;
    let comicId = req.params.id;

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get post
    let comic = await schemas.ComicPost.findOne({ _id: comicId });
    if (!comic) {
        return res.status(500).json({
            error: "Comic could not be found"
        });
    }

    //Make sure user owns this comic
    if (comic.authorID !== userId) {
        return res.status(403).json({
            error: "This user does not own this post"
        });
    }

    //Make sure comic is unpublished
    if (comic.isPublished) {
        return res.status(400).json({
            error: "This comic is published"
        });
    }

    //The user does own this comic and it is published. Now send it in response body
    return res.status(200).json({
        content: comic
    });
}

// Publishing
ComicController.publish = async function (req, res) {
    /* Publish Comic ------------ 
        Request body: {
            series: String
        }
        Response {
            status 200 OK or 500 ERROR or 403 FORBIDDEN
        }
    */

    //Check params
    if (!req) {
        return res.status(500).json({
            error: "No request provided"
        });
    }
    if (!req.params.id) {
        return res.status(500).json({
            error: "No id provided"
        });
    }
    if (!req.userId) {
        return res.status(500).json({
            error: "User ID not found"
        });
    }

    //Get params
    let userId = req.userId;
    let comicId = req.params.id;
    let series = null;
    if (req.body && req.body.series) {
        series = req.body.series;
    }

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get post
    let comic = await schemas.ComicPost.findOne({ _id: comicId });
    if (!comic) {
        return res.status(500).json({
            error: "Comic could not be found"
        });
    }

    //Make sure user owns this comic
    if (comic.authorID !== userId) {
        return res.status(403).json({
            error: "This user does not own this post"
        });
    }

    //The user does own this comic. Now set it to published
    try {
        await schemas.ComicPost.updateOne({ _id: comicId }, {
            isPublished: true,
            series: series
        });
    } catch (err) {
        return res.status(500).json({
            error: "Error updating comic"
        });
    }

    return res.status(200).send();
}

// Deleting
ComicController.delete = async function (req, res) {
    /* Deleting a Comic ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR,
        }
    */

    //Check params
    if (!req) {
        return res.status(500).json({
            error: "No request provided"
        });
    }
    if (!req.params.id) {
        return res.status(500).json({
            error: "No id provided"
        });
    }
    if (!req.userId) {
        return res.status(500).json({
            error: "User ID not found"
        });
    }

    //Get params
    let userId = req.userId;
    let comicId = req.params.id;

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get post
    let comic = await schemas.ComicPost.findOne({ _id: comicId });
    if (!comic) {
        return res.status(500).json({
            error: "Comic could not be found"
        });
    }

    //Make sure user owns this comic
    if (comic.authorID !== userId) {
        return res.status(403).json({
            error: "This user does not own this post"
        });
    }

    //Disconnect comments
    for (let comment of comic.comments) {
        //Disconnect comment from all users
        let err = await Utils.disconnectComment(comment);
        if (err) {
            return res.status(500).json({
                error: err
            });
        }
    }

    //Remove this post from all users' liked lists
    for (let likerId of comic.whoLiked) {
        //Get the user's Account object
        let liker = await schemas.Account.findOne({ _id: likerId });
        if (!liker) {
            return res.status(500).json({
                error: "Error retreiving liker account obj"
            });
        }

        //Remove this post from the user's list of liked things
        let likedIds = Utils.arrRemove(liker.user.comic.liked, comic._id);
        try {
            await schemas.Account.findByIdAndUpdate(userId, {
                "$set": { "user.comic.liked": likedIds }
            });
        } catch (err) {
            return res.status(500).json({
                error: "Error updating comic liker's list of liked objects"
            });
        }
    }

    //Remove this post from all users' disliked lists
    for (let dislikerId of comic.whoDisliked) {
        //Get the user's Account object
        let disliker = await schemas.Account.findOne({ _id: dislikerId });
        if (!disliker) {
            return res.status(500).json({
                error: "Error retreiving disliker account obj"
            });
        }

        //Remove this post from the user's list of disliked things
        let dislikedIds = Utils.arrRemove(disliker.user.comic.disliked, comic._id);
        try {
            await schemas.Account.findByIdAndUpdate(userId, {
                "$set": { "user.comic.disliked": dislikedIds }
            });
        } catch (err) {
            return res.status(500).json({
                error: "Error updating comic disliker's list of disliked objects"
            });
        }
    }

    //Change the author's bean count
    let newBeanCount = account.user.comic.beans - comic.beans;
    try {
        await schemas.Account.findByIdAndUpdate(userId, {
            "$set": { "user.beans": newBeanCount }
        });
    } catch (err) {
        return res.status(500).json({
            error: "Error updating author's bean count"
        });
    }

    //Delete the post
    try {
        await schemas.ComicPost.deleteOne({ _id: comicId });
        return res.status(200).send();
    } catch (err) {
        return res.status(500).json({
            error: "Error deleting comic"
        });
    }
}

ComicController.delete_forumPost = async function (req, res) {
    /* Delete a Forum Post------------
        Request body: {}
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */

    //Check params
    if (!req) {
        return res.status(500).json({
            error: "No request provided"
        });
    }
    if (!req.params) {
        return res.status(500).json({
            error: "No req. params provided"
        });
    }
    if (!req.params.id) {
        return res.status(500).json({
            error: "No id provided"
        });
    }
    if (!req.userId) {
        return res.status(500).json({
            error: "User ID not found"
        });
    }

    //Get params
    let userId = req.userId;
    let postId = req.params.id;

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get post
    let post = Utils.findObjInArrayById(account.user.comic.forum.posts, postId);
    if (!post) {
        return res.status(500).json({
            error: "There is no forum post with the provided ID in this user's comic forum"
        });
    }

    //Disconnect comments
    for (let comment of post.comments) {
        //Disconnect comment from all users
        let err = await Utils.disconnectComment(comment);
        if (err) {
            return res.status(500).json({
                error: err
            });
        }
    }

    //Remove this post from all users' liked lists
    for (let likerId of post.whoLiked) {
        //Get the user's Account object
        let liker = await schemas.Account.findOne({ _id: likerId });
        if (!liker) {
            return res.status(500).json({
                error: "Error retreiving liker account obj"
            });
        }

        //Remove this post from the user's list of liked things
        let likedIds = Utils.arrRemove(liker.user.comic.liked, post._id);
        try {
            await schemas.Account.findByIdAndUpdate(userId, {
                "$set": { "user.comic.liked": likedIds }
            });
        } catch (err) {
            return res.status(500).json({
                error: "Error updating forum post liker's list of liked objects"
            });
        }
    }

    //Remove this post from all users' disliked lists
    for (let dislikerId of post.whoDisliked) {
        //Get the user's Account object
        let disliker = await schemas.Account.findOne({ _id: dislikerId });
        if (!disliker) {
            return res.status(500).json({
                error: "Error retreiving disliker account obj"
            });
        }

        //Remove this post from the user's list of disliked things
        let dislikedIds = Utils.arrRemove(disliker.user.comic.disliked, post._id);
        try {
            await schemas.Account.findByIdAndUpdate(userId, {
                "$set": { "user.comic.disliked": dislikedIds }
            });
        } catch (err) {
            return res.status(500).json({
                error: "Error updating forum post disliker's list of disliked objects"
            });
        }
    }

    //Change the author's bean count
    let newBeanCount = account.user.comic.beans - post.beans;
    try {
        await schemas.Account.findByIdAndUpdate(userId, {
            "$set": { "user.beans": newBeanCount }
        });
    } catch (err) {
        return res.status(500).json({
            error: "Error updating author's bean count"
        });
    }

    //Delete the post
    try {
        let newForumPostsArray = Utils.arrRemove(account.user.comic.forum.posts, post);
        await schemas.Account.findByIdAndUpdate(userId, {
            "$set": { "user.comic.forum.posts": newForumPostsArray }
        });
        return res.status(200).send();
    } catch (err) {
        return res.status(500).json({
            error: "Error deleting forum post"
        });
    }
}

ComicController.deleteSticker = async function (req, res) {
    /* Delete a sticker ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR
        }
    */
}

// User related Content
ComicController.user_saved = async function (req, res) {
    /* Get user's saved comics ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR,
        }
    */

    //Get the user that made the request
    let account = await schemas.Account.findOne({ _id: req.userId });

    //Check for error
    if (!account) {
        return res.status(500).json({
            error: "Server error getting user from ID"
        });
    }
    let user = account.user;

    //Find all posts
    let content = await schemas.ComicPost.find({});
    if (!content) {
        return res.status(500).json({
            error: "Server error getting user from ID"
        });
    }

    //Filter for bookmarked (saved) posts
    content = content.filter((post) => {
        return user.comic.saved.includes(post);
    });

    //Extract post IDs to return array of IDs
    contentIds = content.map((post) => post._id);

    return res.status(200).json({
        content: contentIds
    });
}

ComicController.user_toggleForum = async function (req, res) {
    /* Toggle Forum for user ------------
        Request body: {}
    
        Response {
            status: 200 OK or 500 ERROR,
            body: {
                isForumEnabled: Boolean

                //If error
                error: String
            }
        }
    */

    //Check params
    if (!req) {
        return res.status(500).json({
            error: "No request provided"
        });
    }
    if (!req.userId) {
        return res.status(500).json({
            error: "User ID not found"
        });
    }

    //Get params
    let userId = req.userId;

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Check existence of forum object
    if (!account || !account.user || !account.user.comic || !account.user.comic.forum) {
        return res.status(500).json({
            error: "No forum set for this account"
        });
    }

    //Determine new (toggled) forum state
    let newForumStatus = !(account.user.comic.forum.active)

    //Toggle user's forum state
    try {
        await schemas.Account.findByIdAndUpdate(userId, {
            "$set": { "user.comic.forum.active": newForumStatus }
        });
    } catch (err) {
        return res.status(500).json({
            error: "Error updating forum state"
        });
    }

    res.status(200).json({
        isForumEnabled: newForumStatus
    });
}

// Comic metadata editing (Cover photo, Title, Bio, Series)
ComicController.metadata_update = async function (req, res) {
    /* Update the metadata of a comic ------------
        Request body: {
            title: String,
            bio: String
        }

        Response {
            status: 200 OK or 500 ERROR
        }
    */
}

// Comic content editing
ComicController.content_save = async function (req, res) {
    /* Update the metadata of a comic ------------
        Request body: {
            title: String,
            bio: String
        }

        Response {
            status: 200 OK or 500 ERROR
        }
    */
}

ComicController.content_saveSticker = async function (req, res) {
    /* Save a Sticker ------------
        Request body: {
            title: String,
            bio: String
        }

        Response {
            status: 200 OK or 500 ERROR,
            body: {
                id: ObjectId
            }
        }
    */
}

// Commenting
ComicController.comment = async function (req, res) {
    /* Comment on a Comic ------------
        Request body: {
            text: String
        }

        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

ComicController.comment_forumPost = async function (req, res) {
    /* Comment on a Forum Post ------------
        Request body: {
            text: String
        }
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

// Voting (upvoting/downvoting AKA liking/disliking)
ComicController.vote = async function (req, res) {
    /* Vote on a Comic Post ------------
            Request body: {
                type: Integer (-1, 0, 1)
            }
        
            Response {
                status: 200 OK or 500 ERROR,
    
                //If error
                error: String
            }
        */

    console.log("Entering vote on post (comic)");

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
        const post = await schemas.ComicPost.findOne({ _id: req.params.id });

        if (!account || !post) {
            return res.status(500).json({
                error: "User or post does not exist"
            });
        }

        // Get the owner of the post
        const postOwner = await schemas.Account.findOne({ _id: post.authorID });

        const postOwnerBeans = postOwner.user.comic.beans;

        const userLiked = userLiked = account.user.comic.liked;
        const userDisliked = account.user.comic.disliked;

        // 3 Different cases
        if (userLiked.includes(post._id)) {
            if (type === types.VoteType.down) {
                userLiked = Utils.arrRemove(userLiked, post._id);
                post.whoLiked = Utils.arrRemove(post.whoLiked, req.userId);

                post.beans -= 2;
                postOwnerBeans -= 2;

                postOwner.userDisliked.push(post._id);
                post.whoDisliked.push(req.userId);
            }
            else if (type === types.VoteType.up) {
                /* Do Nothing */
            }
            else {
                userLiked = Utils.arrRemove(userLiked, post._id);
                post.whoLiked = Utils.arrRemove(post.whoLiked, req.userId);

                post.beans -= 1;
                postOwnerBeans -= 1;
            }
        }
        else if (userDisliked.includes(post._id)) {
            if (type === types.VoteType.down) {
                /* Do Nothing */
            }
            else if (type === types.VoteType.up) {
                userDisliked = Utils.arrRemove(userDisliked, post._id);
                post.whoDisliked = Utils.arrRemove(post.whoDisliked, req.userId);

                post.beans += 2;
                postOwnerBeans += 2;

                userLiked.push(post._id);
                post.whoLiked.push(req.userId);
            }
            else {
                userDisliked = Utils.arrRemove(userDisliked, post._id);
                post.whoDisliked = Utils.arrRemove(post.whoDisliked, req.userId);

                post.beans += 1;
                postOwnerBeans += 1;
            }
        }
        else {
            if (type === types.VoteType.down) {
                userDisliked.push(post._id);
                post.whoDisliked.push(req.userId);

                post.beans -= 1;
                postOwnerBeans -= 1;
            }
            else if (type === types.VoteType.up) {
                userLiked.push(post._id);
                post.whoLiked.push(req.userId);

                post.beans += 1;
                postOwnerBeans += 1;
            }
            else {
                /* Do nothing */
            }
        }

        // Now we need to save all the information we updated into the database
        await post.save();

        account.user.comic.liked = userLiked;
        account.user.comic.disliked = userDisliked;
        await account.save();

        postOwner.user.comic.beans = postOwnerBeans;
        await postOwner.save();

        res.status(200).send();
    }
    catch (err) {
        res.status(500).json({
            error: "Server issue with voting on post."
        });
    }
}

ComicController.vote_forumPost = async function (req, res) {
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

    console.log("Entering vote on comic forum post");

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

        const forumPostObj = forumOwner.user.comic.forum;

        if (!forumPostObj || !forumPostObj.active) {
            return res.status(500).json({
                error: "Invalid request"
            });
        }

        // Get forum post that the voting is happening on
        const post = Utils.findObjInArrayById(forumPostObj.posts, req.params.id);

        console.log("vfp:", post);

        if (!post) {
            return res.status(500).json({
                error: "Forum Post does not exist"
            });
        }

        // Get the owner of the forum post
        const postOwner = await schemas.Account.findOne({ _id: post.ownerId });

        const userLiked = account.user.comic.liked;
        const userDisliked = account.user.comic.disliked;

        // 3 Different cases
        if (userLiked.includes(post._id)) {
            if (type === types.VoteType.down) {
                userLiked = arrRemove(userLiked, post._id);
                post.whoLiked = arrRemove(post.whoLiked, req.userId);

                post.beans -= 2;
                postOwner.user.comic.beans -= 2;

                userDisliked.push(post._id);
                post.whoDisliked.push(req.userId);
            }
            else if (type === types.VoteType.up) {
                /* Do Nothing */
            }
            else {
                userLiked = arrRemove(userLiked, post._id);
                post.whoLiked = arrRemove(post.whoLiked, req.userId);

                post.beans -= 1;
                postOwner.user.comic.beans -= 1;
            }
        }
        else if (userDisliked.includes(post._id)) {
            if (type === types.VoteType.down) {
                /* Do Nothing */
            }
            else if (type === types.VoteType.up) {
                userDisliked = arrRemove(userDisliked, post._id);
                post.whoDisliked = arrRemove(post.whoDisliked, req.userId);

                post.beans += 2;
                postOwner.user.comic.beans += 2;

                userLiked.push(post._id);
                post.whoLiked.push(req.userId);
            }
            else {
                userDisliked = arrRemove(userDisliked, post._id);
                post.whoDisliked = arrRemove(post.whoDisliked, req.userId);

                post.beans += 1;
                postOwner.user.comic.beans += 1;
            }
        }
        else {
            if (type === types.VoteType.down) {
                userDisliked.push(post._id);
                post.whoDisliked.push(req.userId);

                post.beans -= 1;
                postOwner.user.comic.beans -= 1;
            }
            else if (type === types.VoteType.up) {
                userLiked.push(post._id);
                post.whoLiked.push(req.userId);

                post.beans += 1;
                postOwner.user.comic.beans += 1;
            }
            else {
                /* Do nothing */
            }
        }

        // Now we need to do the saving
        await postOwner.save();

        account.user.comic.liked = userLiked;
        account.user.comic.disliked = userDisliked;
        await account.save();

        // FIXME: Maybe we have to do some reasigning here??? Or is this fine???
        await forumOwner.save();

        res.status(200).send();
    }
    catch (err) {
        res.status(500).json({
            error: "Server issue with voting on forum post."
        });
    }
}

ComicController.vote_comment = async function (req, res) {
    /* Vote on a Comment ------------
        Request body: {
            type: Integer
        }
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

ComicController.bookmark = async function (req, res) {
    /* Bookmark a post ------------
       Request body: { }
   
       Response {
           status: 200 OK or 500 ERROR or 403 FORBIDDEN,
       }
   */

    //Check params
    if (!req) {
        return res.status(500).json({
            error: "No request provided"
        });
    }
    if (!req.params.id) {
        return res.status(500).json({
            error: "No id provided"
        });
    }
    if (!req.userId) {
        return res.status(500).json({
            error: "User ID not found"
        });
    }

    //Get params
    let userId = req.userId;
    let comicId = req.params.id;

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Make sure user bookmarks list exists
    if (!account || !account.user || !account.user.comic || !account.user.comic.saved) {
        return res.status(500).json({
            error: "User bookmarks list does not exist"
        });
    }

    //Get post
    let comic = await schemas.ComicPost.findOne({ _id: comicId });
    if (!comic) {
        return res.status(500).json({
            error: "Comic could not be found"
        });
    }

    //Make post is published
    if (!comic.isPublished) {
        return res.status(403).json({
            error: "This comic is not published"
        });
    }

    //Comic is published. Add its ID to user bookmarks list
    let newBookmarksList = account.user.comic.saved.push(comicId);
    try {
        await schemas.Account.findByIdAndUpdate(userId, {
            "$set": { "user.comic.saved": newBookmarksList }
        });
    } catch (err) {
        return res.status(500).json({
            error: "Error adding bookmark"
        });
    }

    return res.status(200).send();
}

ComicController.deleteBookmark = async function (req, res) {
    /* UN-Bookmark a post ------------
       Request body: { }
   
       Response {
           status: 200 OK or 500 ERROR,
       }
   */

    //Check params
    if (!req) {
        return res.status(500).json({
            error: "No request provided"
        });
    }
    if (!req.params.id) {
        return res.status(500).json({
            error: "No id provided"
        });
    }
    if (!req.userId) {
        return res.status(500).json({
            error: "User ID not found"
        });
    }

    //Get params
    let userId = req.userId;
    let comicId = req.params.id;

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Make sure user bookmarks list exists
    if (!account || !account.user || !account.user.comic || !account.user.comic.saved) {
        return res.status(500).json({
            error: "User bookmarks list does not exist"
        });
    }

    //Make sure comic is in bookmarks list
    if (!account.user.comic.saved.includes(comicId)) {
        return res.status(500).json({
            error: "The specified comic is not bookmarked by this user"
        });
    }

    //Comic is in bookmarks list. Remove it and update
    let newBookmarksList = account.user.comic.saved.splice(account.user.comic.saved.indexOf(comicId), 1);
    try {
        await schemas.Account.findByIdAndUpdate(userId, {
            "$set": { "user.comic.saved": newBookmarksList }
        });
    } catch (err) {
        return res.status(500).json({
            error: "Error removing bookmark"
        });
    }

    return res.status(200).send();
}

ComicController.subscribe_user = async function (req, res) {
    /*
        Request body { }

        Response {
            status: 200 OK or 500 ERROR,
        }
    */
    //Check params
    if (!req) {
        return res.status(500).json({
            error: "No request provided"
        });
    }
    if (!req.params.id) {
        return res.status(500).json({
            error: "No id provided"
        });
    }
    if (!req.userId) {
        return res.status(500).json({
            error: "User ID not found"
        });
    }

    //Get params
    let userId = req.userId;
    let subscribeeId = req.params.id;

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get subscribee (to make sure it exists)
    let subscribee = await schemas.Account.findOne({ _id: subscribeeId });
    if (!subscribee) {
        return res.status(500).json({
            error: "There is no user with the specified ID"
        });
    }

    //Add the subscribee's ID to the user's subscriptions list
    let subscriptions = account.user.comic.subscriptions;
    if (!subscriptions) {
        subscriptions = [];
    }
    subscriptions.push({ type: SubscriptionType.user, id: subscribeeId });
    try {
        await schemas.Account.findByIdAndUpdate(userId, {
            "$set": { "user.comic.subsciptions": subscriptions }
        });
        return res.status(200).send();
    } catch (err) {
        return res.status(500).json({
            error: "Error updating subscriber's list of subscriptions"
        });
    }
}

ComicController.unsubscribe_user = async function (req, res) {
    /*
        Request body { }

        Response {
            status: 200 OK or 500 ERROR,
        }
    */

    //Check params
    if (!req) {
        return res.status(500).json({
            error: "No request provided"
        });
    }
    if (!req.params.id) {
        return res.status(500).json({
            error: "No id provided"
        });
    }
    if (!req.userId) {
        return res.status(500).json({
            error: "User ID not found"
        });
    }

    //Get params
    let userId = req.userId;
    let subscribeeId = req.params.id;

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get subscribee (to make sure it exists)
    let subscribee = await schemas.Account.findOne({ _id: subscribeeId });
    if (!subscribee) {
        return res.status(500).json({
            error: "There is no user with the specified ID"
        });
    }

    //Get the user's current list of subscriptions
    let subscriptions = account.user.comic.subscriptions;
    if (!subscriptions) {
        subscriptions = [];
    }

    //Remove the subscription from the list
    let newSubscriptions = Utils.arrRemove(subscriptions, { type: SubscriptionType.user, id: subscribeeId });
    if (!newSubscriptions) {
        return res.status(500).json({
            error: "This user is not subscribed to the given item"
        });
    }

    //Update DB
    try {
        await schemas.Account.findByIdAndUpdate(userId, {
            "$set": { "user.comic.subsciptions": subscriptions }
        });
        return res.status(200).send();
    } catch (err) {
        return res.status(500).json({
            error: "Error updating user's list of subscriptions"
        });
    }
}


module.exports = ComicController;

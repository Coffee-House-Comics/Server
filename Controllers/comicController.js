/** REMINDER **
    - Every response in the controllers must be one of these 2 to actually send the data:
        1. res.status(CODE).send(DATA || EMPTY)
        2. res.status(CODE).json({})
*/

const schemas = require('../Schemas/schemas');
const common = require('./commonController');
const Utils = require('../Utils');
const deepEqual = require('fast-deep-equal/es6');
const types = require('../Schemas/types');

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

    console.log("Getting explore content");

    let recentContent = [];
    let likedContent = [];

    //Find most recent posts
    recentContent = await schemas.ComicPost.find({ isPublished: true }).sort({ publishedDate: 'descending' }).limit(NUM_RECENT_POSTS);

    //Find most liked posts
    likedContent = await schemas.ComicPost.find({ isPublished: true }).sort({ beans: 'descending' }).limit(NUM_LIKED_POSTS);

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

    console.log("Performing content search");

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
        for (let query of req.body.searchCriteria) {
            //Filter posts
            posts = posts.filter((post) => {
                return (post.name.includes(query) || post.author.includes(query) || (post.series && post.series.includes(query)));
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

    console.log("Getting subscribed content");

    //Get the user that made the request
    let account = await schemas.Account.findOne({ _id: req.userId });

    //Check for error
    if (!account) {
        return res.status(500).json({
            error: "Server error getting user from ID"
        });
    }
    let user = account.user;

    //Find all users
    let content = await schemas.Account.find({});
    if (!content) {
        return res.status(500).json({
            error: "Server error getting user from ID"
        });
    }

    //Filter for subscribed users and only keep their IDs (not the whole object)
    let subscriptionsIds = user.comic.subscriptions;
    console.log("Subscriptions IDs: ", subscriptionsIds);
    let contentIds = content.filter((user) => {
        for (subId of subscriptionsIds) {
            if (deepEqual(subId, user._id)) {
                return true;
            }
        }
        return false;
    }).map((user) => user._id);

    console.log("ContentIds: ", contentIds);

    return res.status(200).json({
        content: contentIds
    });
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

    console.log("Creating new comic");

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
        createdComic = new schemas.ComicPost({
            name: name,
            description: description,
            author: account.user.displayName,
            isPublished: false,
            publishedDate: null,
            beans: 0,
            coverPhoto: "https://coffeehousecomics.com/images/fetch/default_comic.jpg",
            series: "",
            comments: [],
            authorID: userId,
            whoLiked: [],
            whoDisliked: [],
            pages: [
                {
                    index: 0,
                    data: {
                        backgroundColor: 'white',
                        serialization: []
                    }
                }
            ]
        });

        createdComic = await createdComic.save(createdComic);
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

ComicController.createForumPost = async function (req, res) {
    /* Make forum post
        Request body: {
            title: String,
            body: String
        }

        Response {
            status: 200 OK or 500 ERROR,
            body: {
                id: 
                //If error
                error: String
            }
        }
     */

    console.log("Creating new forum post");

    //Check params
    if (!req) {
        return res.status(500).json({
            error: "No request provided"
        });
    }
    if (!req.params) {
        return res.status(500).json({
            error: "No params provided"
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
    let forumUserId = req.params.id;

    if (!req.body || !req.body.title || !req.body.body) {
        return res.status(500).json({
            error: "Invalid request body"
        });
    }
    let postTitle = req.body.title;
    let postBody = req.body.body;

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get forum user
    let forumAccount = await schemas.Account.findOne({ _id: forumUserId });
    if (!forumAccount) {
        return res.status(500).json({
            error: "Forum user could not be found"
        });
    }

    //Make sure the forum user's forum is enabled
    if (!forumAccount.user.comic.forum.active) {
        return res.status(500).json({
            error: "This user's forum is not enabled"
        });
    }

    //Make the post
    const forumPost = {
        ownerId: userId,
        title: postTitle,
        body: postBody,
        user: account.user.displayName,
        date: new Date(),
        beans: 0,
        comments: [],
        whoLiked: [],
        whoDisliked: []
    };

    //Add the post to the user's forum
    const index = forumAccount.user.comic.forum.posts.push(forumPost) - 1;

    //Save changes to DB
    try {
        const acc = await forumAccount.save();

        console.log("FP we just added:", acc.user.comic.forum.posts[index]);

        return res.status(200).json({
            id: acc.user.comic.forum.posts[index]._id
        });
    } catch (err) {
        return res.status(500).json({
            error: "Error saving forum posts to DB"
        });
    }
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

    console.log("Getting published comic");

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

    const userID = require('../Auth').verifyUser(req);

    // Handle the comments
    comic.comments = comic.comments.map(comment => {
        let myCommentVote = 0;

        if (userID) {
            if (comment.whoLiked.includes(userID))
                myCommentVote = 1;
            else if (comment.whoDisliked.includes(userID))
                myCommentVote = -1;
        }

        return ({
            ownerId: comment.ownerId,
            user: comment.user,
            date: comment.date,
            text: comment.text,
            beans: comment.beans,
            myVote: myCommentVote
        });
    });

    const { ["whoDisliked"]: whoDisliked, ["whoLiked"]: wholiked, ...updatedComic } = comic;

    let myPostVote = 0;

    if (userID) {
        if (whoLiked.includes(userID))
            myPostVote = 1;
        else if (whoDisliked.includes(userID))
            myPostVote = -1;
    }

    updatedComic.myVote = myPostVote;


    //The comic is published. Now send it in response
    return res.status(200).json({
        content: updatedComic
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

    console.log("Getting unpublished comic");

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
    console.log("Attempting to get comic with ID:", comicId);
    let comic = await schemas.ComicPost.findOne({ _id: comicId });
    if (!comic) {
        return res.status(500).json({
            error: "Comic could not be found"
        });
    }

    //Make sure user owns this comic
    console.log("Author ID: " + typeof comic.authorID + "  |  User ID: " + typeof userId);
    if (comic.authorID != userId) {
        console.log("Requesting user does not own the requested post");
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
        content: comic,
        stickers: account.user.comic.savedStickers
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

    console.log("Publishing comic");

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
    if (comic.authorID != userId) {
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

    console.log("Deleting comic");

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
    if (comic.authorID != userId) {
        console.error("User does not own this post");
        return res.status(403).json({
            error: "This user does not own this post"
        });
    }

    //Disconnect comments
    for (let comment of comic.comments) {
        //Disconnect comment from all users
        let err = await Utils.disconnectComment(true, comment);
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
        Request body: {
            forumUserId: ObjectId
        }
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */

    console.log("Deleting forum post");

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
    console.log("ID of forum post to delete: " + postId);

    if (!req.body || !req.body.forumUserId) {
        return res.status(500).json({
            error: "ID of forum owner not provided"
        });
    }

    let forumUserId = req.body.forumUserId;
    console.log("Forum user ID: ", forumUserId);

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    let forumAccount = await schemas.Account.findOne({ _id: forumUserId });
    if (!forumAccount) {
        return res.status(500).json({
            error: "Forum user could not be found"
        });
    }

    //Get post
    console.log("Forum posts arr: ", forumAccount.user.comic.forum.posts);
    let post = Utils.findObjInArrayById(forumAccount.user.comic.forum.posts, postId);
    if (!post) {
        return res.status(500).json({
            error: "There is no forum post with the provided ID in this forum user's comic forum"
        });
    }

    //Disconnect comments
    for (let comment of post.comments) {
        //Disconnect comment from all users
        let err = await Utils.disconnectComment(true, comment);
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
        let newForumPostsArray = Utils.arrRemove(forumAccount.user.comic.forum.posts, post);
        await schemas.Account.findByIdAndUpdate(forumUserId, {
            "$set": { "user.comic.forum.posts": newForumPostsArray }
        });
        return res.status(200).send();
    } catch (err) {
        return res.status(500).json({
            error: "Error deleting forum post"
        });
    }
}

ComicController.delete_comment = async function (req, res) {
    /* Delete comment on a post ------------
        Request body: {
            postId: ObjectID
        }
 
        Response {
            status 200 OK or 500 ERROR
            body: {
                postOwnerId: String 
                
                //If error
                error: String
            }
        }
    */

    console.log("Deleting comment");

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
    let commentId = req.params.id;
    if (!req.body || !req.body.postId) {
        return res.status(500).json({
            error: "Invalid request body"
        });
    }
    let postId = req.body.postId;

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get post
    const comic = await schemas.ComicPost.findOne({ _id: postId });
    if (!comic) {
        return res.status(500).json({
            error: "Comic could not be found"
        });
    }

    //Get comment
    let comment = Utils.findObjInArrayById(comic.comments, commentId);
    if (!comment) {
        return res.status(500).json({
            error: "The specified comment could not be found"
        });
    }

    //Disconnect comment
    await Utils.disconnectComment(true, comment)

    //Remove comment
    comic.comments = Utils.arrRemove(comic.comments, comment);

    //Save changes
    try {
        await comic.save();
        return res.status(200).send();
    } catch (err) {
        return res.status(500).json({
            error: "Unable to save changes after deleting comment"
        });
    }
}

ComicController.delete_forumPost_comment = async function (req, res) {
    /* Delete forum post comment ------------
        Request body: {
            forumUserId: ObjectID,
            forumPostId: ObjectID
        }
 
        Response {
            status 200 OK or 500 ERROR
            body: {
                //If error
                error: String
            }
        }
    */

    console.log("Deleting forum post comment");

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
    let commentId = req.params.id;
    if (!req.body || !req.body.forumUserId || !req.body.forumPostId) {
        return res.status(500).json({
            error: "Invalid request body"
        });
    }
    let forumUserId = req.body.forumUserId;
    let postId = req.body.forumPostId;

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get forum user
    let forumAccount = await schemas.Account.findOne({ _id: forumUserId });
    if (!forumAccount) {
        return res.status(500).json({
            error: "Forum user could not be found"
        });
    }

    //Get post
    let post = Utils.findObjInArrayById(forumAccount.user.comic.forum.posts, postId);
    let postIndex = forumAccount.user.comic.forum.posts.indexOf(post);
    if (!post) {
        return res.status(500).json({
            error: "There is no forum post with the provided ID in this forum user's comic forum"
        });
    }

    //Get comment
    let comment = Utils.findObjInArrayById(post.comments, commentId);
    let commentIndex = post.comments.indexOf(comment);
    if (!comment) {
        return res.status(500).json({
            error: "The specified comment could not be found"
        });
    }

    //Disconnect comment
    await Utils.disconnectComment(true, comment)

    //Remove comment
    let newPostsArr = [...forumAccount.user.comic.forum.posts];
    post.comments = Utils.arrRemove([...post.comments], comment);
    newPostsArr[postIndex] = post;

    //Save changes
    try {
        await schemas.Account.findByIdAndUpdate(forumAccount._id, {
            "$set": { "user.comic.forum.posts": newPostsArr }
        });
        return res.status(200).send();
    } catch (err) {
        return res.status(500).json({
            error: "Unable to save changes after deleting forum post comment"
        });
    }
}

ComicController.deleteSticker = async function (req, res) {
    /* Delete a sticker ------------
        Request body: {
            sticker: String
        }
 
        Response {
            status: 200 OK or 500 ERROR
 
            body: {
                //If error
                error: String
            }
        }
    */

    console.log("Deleting sticker");
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

    if (!req.body || !req.body.sticker) {
        return res.status(500).json({
            error: "Invalid request body"
        });
    }

    let sticker = req.body.sticker;
    console.log("Sticker to delete: ", sticker);

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get current list of stickers
    let stickers = account.user.comic.savedStickers;
    if (!stickers) {
        stickers = [];
    }

    //Remove sticker from list of stickers
    let newStickers = Utils.arrRemove(stickers, sticker);
    console.log("New stickers array: ", newStickers);
    if (newStickers.length === stickers.length) {
        console.error("The provided sticker is not in the list of saved stickers");
        return res.status(500).json({
            error: "The provided sticker is not in the saved stickers list"
        });
    }

    //Update DB
    account.user.comic.savedStickers = newStickers;
    console.log("New account object: ", account);
    try {
        await account.save();
        return res.status(200).send();
    } catch (err) {
        return res.status(500).json({
            error: "Error saving new sticker"
        });
    }
}

// User related Content
ComicController.user_saved = async function (req, res) {
    /* Get user's saved comics ------------
        Request body: {}
 
        Response {
            status: 200 OK or 500 ERROR,
        }
    */

    console.log("Getting bookmarked content");

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
    contentIds = content.map((post) => post._id);
    contentIds = contentIds.filter((post) => {
        return user.comic.saved.includes(post);
    });
    console.log("Bookmarked posts: ", contentIds);

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

    console.log("Toggling user forum state");

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
    /* Update the metadata of a Comic ------------
        //NOTE: A request should omit any fields in the body which should not change
        Request body: {
            name: String,
            description: String,
            coverPhoto: String,
            series: String
        }
 
        Response {
            status: 200 OK or 500 ERROR
            body:{
                //If error 
                error: String
            }
        }
    */

    console.log("Changing comic metadata");

    //Check params
    if (!req) {
        return res.status(500).json({
            error: "No request provided"
        });
    }
    if (!req.params) {
        return res.status(500).json({
            error: "No params provided"
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

    if (!req.body) {
        return res.status(500).json({
            error: "Invalid request body"
        });
    }

    let name = req.body.name;
    let description = req.body.description;
    let coverPhoto = req.body.coverPhoto;
    let series = req.body.series;

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get post
    const comic = await schemas.ComicPost.findOne({ _id: comicId });
    if (!comic) {
        return res.status(500).json({
            error: "Comic could not be found"
        });
    }

    //Make sure user owns this comic
    if (comic.authorID != userId) {
        console.log("User does not own this post");
        return res.status(403).json({
            error: "This user does not own this post"
        });
    }

    //Make sure comic is unpublished
    if (comic.isPublished) {
        return res.status(400).json({
            error: "A published comic cannot be edited"
        });
    }

    //Make edits
    if (name) {
        comic.name = name;
    }
    if (description) {
        comic.description = description;
    }
    if (coverPhoto) {
        comic.coverPhoto = coverPhoto;
    }
    if (series) {
        comic.series = series;
    }

    //Save to DB
    try {
        await comic.save();
        return res.status(200).send();
    } catch (err) {
        return res.status(500).json({
            error: "Error saving comic changes"
        });
    }
}

// Comic content editing
ComicController.content_save = async function (req, res) {
    /* Update the content of a comic ------------
        Request body: {
            pages: [ ]
        }
 
        Response {
            status: 200 OK or 500 ERROR
 
            body: {
                //If error
                error: String
            }
        }
    */

    console.log("Changing comic content");

    //Check params
    if (!req) {
        return res.status(500).json({
            error: "No request provided"
        });
    }
    if (!req.params) {
        return res.status(500).json({
            error: "No params provided"
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

    if (!req.body || !req.body.pages) {
        return res.status(500).json({
            error: "Invalid request body"
        });
    }

    const pages = req.body.pages;

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get post
    const comic = await schemas.ComicPost.findOne({ _id: comicId });
    if (!comic) {
        return res.status(500).json({
            error: "Comic could not be found"
        });
    }

    //Make sure user owns this comic
    if (comic.authorID != userId) {
        return res.status(403).json({
            error: "This user does not own this post"
        });
    }

    //Make sure comic is unpublished
    if (comic.isPublished) {
        return res.status(400).json({
            error: "A published comic cannot be edited"
        });
    }

    //Save changes to DB
    try {
        await schemas.ComicPost.findByIdAndUpdate(comic._id, {
            "$set": { "pages": pages }
        });
        return res.status(200).send();
    } catch (err) {
        return res.status(500).json({
            error: "Error saving comic content changes"
        });
    }
}

ComicController.content_saveSticker = async function (req, res) {
    /* Save a Sticker ------------
        Request body: {
            sticker: String
        }
 
        Response {
            status: 200 OK or 500 ERROR,
            body: {
                //If error
                error: String
            }
        }
    */

    console.log("Saving sticker");

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

    if (!req.body || !req.body.sticker) {
        return res.status(500).json({
            error: "Invalid request body"
        });
    }

    let sticker = req.body.sticker;

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get current list of stickers
    let stickers = account.user.comic.savedStickers;
    if (!stickers) {
        stickers = [];
    }

    //Add new sticker to list of stickers
    stickers.push(sticker);

    //Update DB
    account.user.comic.stickers = stickers;
    try {
        await account.save();
        return res.status(200).send();
    } catch (err) {
        return res.status(500).json({
            error: "Error saving new sticker"
        });
    }
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

    console.log("Commenting on comic");

    //Check params
    if (!req) {
        return res.status(500).json({
            error: "No request provided"
        });
    }
    if (!req.params) {
        return res.status(500).json({
            error: "No params provided"
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

    if (!req.body || !req.body.text) {
        return res.status(500).json({
            error: "Invalid request body"
        });
    }

    let commentText = req.body.text;

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get post
    const comic = await schemas.ComicPost.findOne({ _id: comicId });
    if (!comic) {
        return res.status(500).json({
            error: "Comic could not be found"
        });
    }

    //Make sure comic is published
    if (!comic.isPublished) {
        return res.status(400).json({
            error: "This comic is not published"
        });
    }

    //Build the comment
    const comment = {
        ownerId: userId,
        user: account.user.displayName,
        date: new Date(),
        text: commentText,
        beans: 0,
        whoLiked: [],
        whoDisliked: []
    };

    //Add the comment to the post
    let commentIndex = comic.comments.push(comment) - 1;

    //Save changes to DB
    try {
        let newComic = await comic.save();
        let commentId = newComic.comments[commentIndex]._id;
        console.log("ID of newly created comment on comic: ", commentId)
        return res.status(200).json({
            id: commentId
        });
    } catch (err) {
        return res.status(500).json({
            error: "Error saving forum posts to DB"
        });
    }
}

ComicController.comment_forumPost = async function (req, res) {
    /* Comment on a Forum Post ------------
        Request body: {
            text: String
            forumUserId: ObjectID
        }
    
        Response {
            status: 200 OK or 500 ERROR,
 
            body:{ 
                //If error
                error: String
            }
        }
    */

    console.log("Commenting on comic forum post");

    //Check params
    if (!req) {
        return res.status(500).json({
            error: "No request provided"
        });
    }
    if (!req.params) {
        return res.status(500).json({
            error: "No params provided"
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
    let forumPostId = req.params.id;

    if (!req.body || !req.body.text || !req.body.forumUserId) {
        return res.status(500).json({
            error: "Invalid request body"
        });
    }

    let commentText = req.body.text;
    let forumUserId = req.body.forumUserId;

    //Get user
    let account = await schemas.Account.findOne({ _id: userId });
    if (!account) {
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get forum user
    let forumAccount = await schemas.Account.findOne({ _id: forumUserId });
    if (!forumAccount) {
        return res.status(500).json({
            error: "Forum user could not be found"
        });
    }

    //Make sure the forum user's forum is enabled
    if (!forumAccount.user.comic.forum.active) {
        return res.status(500).json({
            error: "This user's forum is not enabled"
        });
    }

    //Find the post to comment on
    let forumPosts = forumAccount.user.comic.forum.posts;
    let post = Utils.findObjInArrayById(forumPosts, forumPostId);
    let postIndex = forumPosts.indexOf(post);

    //Build the comment
    const comment = {
        ownerId: userId,
        user: account.user.displayName,
        date: new Date(),
        text: commentText,
        beans: 0,
        whoLiked: [],
        whoDisliked: []
    };

    //Add the comment to the post
    let commentIndex = post.comments.push(comment) - 1;

    //Update the array of posts
    forumPosts[postIndex] = post;

    //Save changes to DB
    try {
        await schemas.Account.findByIdAndUpdate(forumUserId, {
            "$set": { "user.comic.forum.posts": forumPosts }
        });
        let newAcc = await schemas.Account.findById(forumUserId);
        let commentId = newAcc.user.comic.forum.posts[postIndex].comments[commentIndex]._id;
        console.log("ID of newly created forum post comment: ", commentId);
        return res.status(200).json({
            id: commentId
        });
    } catch (err) {
        console.log("Error updating account in DB to add forum post comment\n", err)
        return res.status(500).json({
            error: "Error saving forum posts to DB"
        });
    }
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
        const account = await schemas.Account.findOne({ _id: req.userId });

        // Get post that the voting is happening on
        const post = await schemas.ComicPost.findOne({ _id: req.params.id });

        if (!account || !post) {
            return res.status(500).json({
                error: "User or post does not exist"
            });
        }

        // Get the owner of the post
        const postOwner = await schemas.Account.findOne({ _id: post.authorID });

        let postOwnerBeans = postOwner.user.comic.beans;

        let userLiked = [...account.user.comic.liked];
        let userDisliked = [...account.user.comic.disliked];

        // 3 Different cases
        console.log("Vote type: ", type);
        console.log("userLiked: ", userLiked);
        if (account.user.comic.liked.includes(post._id)) {
            if (type == types.VoteType.down) {
                userLiked = Utils.arrRemove(userLiked, post._id);
                post.whoLiked = Utils.arrRemove(post.whoLiked, account._id);

                post.beans -= 2;
                postOwnerBeans -= 2;

                userDisliked.push(post._id);
                post.whoDisliked.push(req.userId);
            }
            else if (type == types.VoteType.up) {
                return res.status(500).json({
                    error: "This vote has already been performed on this post for this user"
                });
            }
            else {
                userLiked = Utils.arrRemove(userLiked, post._id);
                post.whoLiked = Utils.arrRemove(post.whoLiked, account._id);

                post.beans -= 1;
                postOwnerBeans -= 1;
            }
        }
        else if (account.user.comic.disliked.includes(post._id)) {
            if (type == types.VoteType.down) {
                return res.status(500).json({
                    error: "This vote has already been performed on this post for this user"
                })
            }
            else if (type == types.VoteType.up) {
                userDisliked = Utils.arrRemove(userDisliked, post._id);
                post.whoDisliked = Utils.arrRemove(post.whoDisliked, account._id);

                post.beans += 2;
                postOwnerBeans += 2;

                userLiked.push(post._id);
                post.whoLiked.push(account._id);
            }
            else {
                userDisliked = Utils.arrRemove(userDisliked, post._id);
                post.whoDisliked = Utils.arrRemove(post.whoDisliked, account._id);

                post.beans += 1;
                postOwnerBeans += 1;
            }
        }
        else {
            if (type == types.VoteType.down) {
                userDisliked.push(post._id);
                post.whoDisliked.push(account._id);

                post.beans -= 1;
                postOwnerBeans -= 1;
            }
            else if (type == types.VoteType.up) {
                console.log("Upvoting");
                userLiked.push(post._id);
                post.whoLiked.push(account._id);

                post.beans += 1;
                postOwnerBeans += 1;
            }
            else {
                console.log("Doing nothing");
                return res.status(500).json({
                    error: "This vote has already been performed on this post for this user"
                })
            }
        }

        // Now we need to save all the information we updated into the database
        await post.save();

        //Update user liked/disliked lists
        await schemas.Account.findByIdAndUpdate(account._id, {
            "$set": { "user.comic.liked": userLiked }
        });
        await schemas.Account.findByIdAndUpdate(account._id, {
            "$set": { "user.comic.disliked": userDisliked }
        });

        //Update post owner beans
        await schemas.Account.findByIdAndUpdate(postOwner._id, {
            "$set": { "user.comic.beans": postOwnerBeans }
        });

        res.status(200).send();
    }
    catch (err) {
        console.error(err);
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

        const forumObj = forumOwner.user.comic.forum;

        if (!forumObj || !forumObj.active) {
            return res.status(500).json({
                error: "Invalid request"
            });
        }

        // Get forum post that the voting is happening on
        console.log("Posts in this forum: ", forumObj.posts);
        console.log("ID of forum post to vote on: ", req.params.id);
        let post = Utils.findObjInArrayById(forumObj.posts, req.params.id);
        const postIndex = forumObj.posts.indexOf(post);

        console.log("vfp:", post);

        if (!post) {
            return res.status(500).json({
                error: "Forum Post does not exist"
            });
        }

        // Get the owner of the forum post
        let postOwner = await schemas.Account.findOne({ _id: post.ownerId });

        let userLiked = [...account.user.comic.liked];
        let userDisliked = [...account.user.comic.disliked];

        // 3 Different cases
        if (account.user.comic.liked.includes(post._id)) {
            if (type == types.VoteType.down) {
                console.log("From upvote to downvote");
                userLiked = Utils.arrRemove(userLiked, post._id);
                post.whoLiked = Utils.arrRemove(post.whoLiked, account._id);

                post.beans -= 2;
                postOwner.user.comic.beans -= 2;

                userDisliked.push(post._id);
                post.whoDisliked.push(account._id);
            }
            else if (type == types.VoteType.up) {
                return res.status(500).json({
                    error: "This vote has already been performed on this post for this user"
                })
            }
            else {
                console.log("From upvote to neutral");
                userLiked = Utils.arrRemove(userLiked, post._id);
                post.whoLiked = Utils.arrRemove(post.whoLiked, account._id);

                post.beans -= 1;
                postOwner.user.comic.beans -= 1;
            }
        }
        else if (account.user.comic.disliked.includes(post._id)) {
            if (type == types.VoteType.down) {
                return res.status(500).json({
                    error: "This vote has already been performed on this post for this user"
                })
            }
            else if (type == types.VoteType.up) {
                console.log("From downvote to upvote");
                userDisliked = Utils.arrRemove(userDisliked, post._id);
                post.whoDisliked = Utils.arrRemove(post.whoDisliked, account._id);

                post.beans += 2;
                postOwner.user.comic.beans += 2;

                userLiked.push(post._id);
                post.whoLiked.push(account._id);
            }
            else {
                console.log("From downvote to neutral");
                userDisliked = Utils.arrRemove(userDisliked, post._id);
                post.whoDisliked = Utils.arrRemove(post.whoDisliked, account._id);

                post.beans += 1;
                postOwner.user.comic.beans += 1;
            }
        }
        else {
            if (type == types.VoteType.down) {
                console.log("From neutral to downvote");
                userDisliked.push(post._id);
                post.whoDisliked.push(account._id);

                post.beans -= 1;
                postOwner.user.comic.beans -= 1;
            }
            else if (type == types.VoteType.up) {
                console.log("From neutral to upvote")
                userLiked.push(post._id);
                post.whoLiked.push(account._id);

                post.beans += 1;
                postOwner.user.comic.beans += 1;
            }
            else {
                return res.status(500).json({
                    error: "This vote has already been performed on this post for this user"
                })
            }
        }

        let newPostsArr = forumObj.posts;
        newPostsArr[postIndex] = post;
        console.log("newPostsArr", newPostsArr);

        // Now we need to do the saving
        await postOwner.save();

        //Update user liked/disliked lists
        await schemas.Account.findByIdAndUpdate(account._id, {
            "$set": { "user.comic.liked": userLiked }
        });
        await schemas.Account.findByIdAndUpdate(account._id, {
            "$set": { "user.comic.disliked": userDisliked }
        });

        await schemas.Account.findByIdAndUpdate(forumOwnerId, {
            "$set": { "user.comic.forum.posts": newPostsArr }
        });

        res.status(200).send();
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Server issue with voting on forum post."
        });
    }
}

ComicController.vote_comment = async function (req, res) {
    /* Vote on a Comment ------------
        Request body: {
            type: Integer
 
            // The id of the post
            postId: String
        }
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */

    console.log("Entering the vote on a comment on a comic post function");

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
    const postId = body.postId;

    if (!type || !postId) {
        return res.status(500).json({
            error: "Malformed Body"
        });
    }

    try {
        // Get account that is doing the voting
        const account = await schemas.Account.findOne({ _id: req.userId });

        // Get the post
        let post = await schemas.ComicPost.findOne({ _id: postId });

        if (!post) {
            return res.status(500).json({
                error: "Post does not exist"
            });
        }


        if (!account) {
            return res.status(500).json({
                error: "Issue finding users"
            });
        }

        // Find the comment
        let comment = Utils.findObjInArrayById(post.comments, req.params.id);
        let commentIndex = post.comments.indexOf(comment);

        if (!comment) {
            return res.status(500).json({
                error: "Issue finding comment"
            });
        }

        // Get the owner of the comment
        let commentOwner = await schemas.Account.findOne({ _id: comment.ownerId });

        let userLiked = [...account.user.comic.liked];
        let userDisliked = [...account.user.comic.disliked];

        // 3 Different cases
        if (account.user.comic.liked.includes(comment._id)) {
            if (type == types.VoteType.down) {
                console.log("From like to dislike");
                userLiked = Utils.arrRemove(userLiked, comment._id);
                comment.whoLiked = Utils.arrRemove(comment.whoLiked, account._id);

                comment.beans -= 2;
                commentOwner.user.comic.beans -= 2;

                userDisliked.push(comment._id);
                comment.whoDisliked.push(account._id);
            }
            else if (type == types.VoteType.up) {
                return res.status(500).json({
                    error: "This vote has already been performed on this post for this user"
                });
            }
            else {
                console.log("From like to neutral");
                userLiked = Utils.arrRemove(userLiked, comment._id);
                comment.whoLiked = Utils.arrRemove(comment.whoLiked, account._id);

                comment.beans -= 1;
                commentOwner.user.comic.beans -= 1;
            }
        }
        else if (account.user.comic.disliked.includes(comment._id)) {
            if (type == types.VoteType.down) {
                /* Do Nothing */
            }
            else if (type == types.VoteType.up) {
                console.log("From dislike to like");
                userDisliked = Utils.arrRemove(userDisliked, comment._id);
                comment.whoDisliked = Utils.arrRemove(comment.whoDisliked, account._id);

                comment.beans += 2;
                commentOwner.user.comic.beans += 2;

                userLiked.push(comment._id);
                comment.whoLiked.push(account._id);
            }
            else {
                console.log("From dislike to neutral");
                userDisliked = Utils.arrRemove(userDisliked, comment._id);
                comment.whoDisliked = Utils.arrRemove(comment.whoDisliked, account._id);

                comment.beans += 1;
                commentOwner.user.comic.beans += 1;
            }
        }
        else {
            if (type == types.VoteType.down) {
                console.log("From neutral to dislike");
                userDisliked.push(comment._id);
                comment.whoDisliked.push(account._id);

                comment.beans -= 1;
                commentOwner.user.comic.beans -= 1;
            }
            else if (type == types.VoteType.up) {
                console.log("From neutral to like");
                userLiked.push(comment._id);
                comment.whoLiked.push(account._id);

                comment.beans += 1;
                commentOwner.user.comic.beans += 1;
            }
            else {
                return res.status(500).json({
                    error: "This vote has already been performed on this post for this user"
                });
            }
        }

        let newComments = [...post.comments];
        newComments[commentIndex] = comment;

        // Now we need to do the saving
        await commentOwner.save();

        //Update user liked/disliked lists
        await schemas.Account.findByIdAndUpdate(account._id, {
            "$set": { "user.comic.liked": userLiked }
        });
        await schemas.Account.findByIdAndUpdate(account._id, {
            "$set": { "user.comic.disliked": userDisliked }
        });

        await schemas.ComicPost.findByIdAndUpdate(post._id, {
            "$set": { "comments": newComments }
        });

        res.status(200).send();
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Server issue with voting on comment."
        });
    }
}

ComicController.vote_forumpost_comment = async function (req, res) {
    /* Vote on a Comment ------------
        Request body: {
            type: Integer
 
            // The id of the forum post
            forumPostId: String,
            // The id of the owner of the forum
            forumOwnerId: String
        }
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */

    console.log("Entering the vote on a comment on a comic forum post function");

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

    let type = body.type;
    let forumPostId = body.forumPostId;
    let forumOwnerId = body.forumOwnerId;

    if (!type || !forumPostId || !forumOwnerId) {
        return res.status(500).json({
            error: "Malformed Body"
        });
    }

    try {
        // Get account that is doing the voting
        let account = await schemas.Account.findOne({ _id: req.userId });

        // Get the account that owns the forum
        let forumOwner = await schemas.Account.findOne({ _id: forumOwnerId });

        if (!account || !forumOwner) {
            return res.status(500).json({
                error: "Issue finding accounts"
            });
        }

        // Lets make sure thay forums are even activated
        if (!forumOwner.user.comic.forum.active) {
            return res.status(500).json({
                error: "Forum not active"
            });
        }

        // Now we must get the forum post
        let post = Utils.findObjInArrayById(forumOwner.user.comic.forum.posts, forumPostId);
        let postIndex = forumOwner.user.comic.forum.posts.indexOf(post);

        if (!post) {
            return res.status(500).json({
                error: "Forum Post does not contain the post"
            });
        }

        // Now we must get the comment
        let comment = Utils.findObjInArrayById(post.comments, req.params.id);
        let commentIndex = post.comments.indexOf(comment);

        if (!comment) {
            return res.status(500).json({
                error: "Issue finding comment"
            });
        }

        let commentOwner = await schemas.Account.findOne({ _id: comment.ownerId });
        console.log("Comment owner: ", commentOwner);

        if (!commentOwner) {
            return res.status(500).json({
                error: "Comment owner does not exist"
            });
        }

        let userLiked = [...account.user.comic.liked];
        let userDisliked = [...account.user.comic.disliked];

        // 3 Different cases
        if (account.user.comic.liked.includes(comment._id)) {
            if (type == types.VoteType.down) {
                console.log("From like to dislike");
                userLiked = Utils.arrRemove(userLiked, comment._id);
                comment.whoLiked = Utils.arrRemove(comment.whoLiked, account._id);

                comment.beans -= 2;
                commentOwner.user.comic.beans -= 2;

                userDisliked.push(comment._id);
                comment.whoDisliked.push(account._id);
            }
            else if (type == types.VoteType.up) {
                return res.status(500).json({
                    error: "This vote has already been performed on this post for this user"
                });
            }
            else {
                console.log("From like to neutral");
                userLiked = Utils.arrRemove(userLiked, comment._id);
                comment.whoLiked = Utils.arrRemove(comment.whoLiked, account._id);

                comment.beans -= 1;
                commentOwner.user.comic.beans -= 1;
            }
        }
        else if (account.user.comic.disliked.includes(comment._id)) {
            if (type == types.VoteType.down) {
                return res.status(500).json({
                    error: "This vote has already been performed on this post for this user"
                });
            }
            else if (type == types.VoteType.up) {
                console.log("From dislike to like");
                userDisliked = Utils.arrRemove(userDisliked, comment._id);
                comment.whoDisliked = Utils.arrRemove(comment.whoDisliked, account._id);

                comment.beans += 2;
                commentOwner.user.comic.beans += 2;

                userLiked.push(comment._id);
                comment.whoLiked.push(account._id);
            }
            else {
                console.log("From dislike to neutral");
                userDisliked = Utils.arrRemove(userDisliked, comment._id);
                comment.whoDisliked = Utils.arrRemove(comment.whoDisliked, account._id);

                comment.beans += 1;
                commentOwner.user.comic.beans += 1;
            }
        }
        else {
            if (type == types.VoteType.down) {
                console.log("From neutral to dislike");
                userDisliked.push(comment._id);
                comment.whoDisliked.push(account._id);

                comment.beans -= 1;
                commentOwner.user.comic.beans -= 1;
            }
            else if (type == types.VoteType.up) {
                console.log("From neutral to like");
                userLiked.push(comment._id);
                comment.whoLiked.push(account._id);

                comment.beans += 1;
                commentOwner.user.comic.beans += 1;
            }
            else {
                return res.status(500).json({
                    error: "This vote has already been performed on this post for this user"
                });
            }
        }

        let newPostsArr = [...forumOwner.user.comic.forum.posts];
        let newCommentsArr = [...post.comments];
        newCommentsArr[commentIndex] = comment;
        post.comments = newCommentsArr;
        newPostsArr[postIndex] = post;

        // Now we need to do the saving
        await commentOwner.save();

        //Update user liked/disliked lists
        await schemas.Account.findByIdAndUpdate(account._id, {
            "$set": { "user.comic.liked": userLiked }
        });
        await schemas.Account.findByIdAndUpdate(account._id, {
            "$set": { "user.comic.disliked": userDisliked }
        });

        await schemas.Account.findByIdAndUpdate(forumOwner._id, {
            "$set": { "user.comic.forum.posts": newPostsArr }
        });

        await account.save();

        res.status(200).send();
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Server issue with voting on forum post."
        });
    }
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

    let newBookmarksList = [...account.user.comic.saved];
    newBookmarksList.push(comicId);
    console.log("New bookmarks list: ", newBookmarksList);
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
    let newBookmarksList = [...account.user.comic.saved]
    newBookmarksList.splice(account.user.comic.saved.indexOf(comicId), 1);
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
    let subscriptions = [...account.user.comic.subscriptions];
    console.log("Subscriptions arr: ", subscriptions);
    if (!subscriptions) {
        subscriptions = [];
    }
    let subscriptionItem = subscribeeId;
    subscriptions.push(subscriptionItem);
    try {
        await schemas.Account.findByIdAndUpdate(userId, {
            "$set": { "user.comic.subscriptions": subscriptions }
        });
        return res.status(200).send();
    } catch (err) {
        console.log(err);
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
    console.log("ID of user to unsubscribe from: ", subscribeeId);
    let newSubscriptions = [];
    for (subscription of subscriptions) {
        if (subscription != subscribeeId) {
            newSubscriptions.push(subscription);
        }
    }
    console.log("Subscriptions: ", subscriptions);
    console.log("New Subscriptions: ", newSubscriptions);
    if (newSubscriptions.length == subscriptions.length) {
        return res.status(500).json({
            error: "This user is not subscribed to the given item"
        });
    }

    //Update DB
    try {
        await schemas.Account.findByIdAndUpdate(userId, {
            "$set": { "user.comic.subscriptions": newSubscriptions }
        });
        return res.status(200).send();
    } catch (err) {
        return res.status(500).json({
            error: "Error updating user's list of subscriptions"
        });
    }
}

ComicController.getAllForumPosts = async function (req, res) {
    /*
        Request body { }
 
        Response {
            status: 200 OK or 500 ERROR,
 
            body: {
                forumPosts: [ForumPostObjects]
            }
        }
    */

    console.log("Entering get all Forum Posts for comics");

    if (!req || !req.params || !req.params.id) {
        return res.status(500).json({
            error: "Invalid request params"
        });
    }

    const userId = req.params.id;

    const account = await schemas.Account.findOne({ _id: userId });

    if (!account) {
        return res.status(500).json({
            error: "This user does not exist."
        });
    }

    if (!account.user.comic.forum.active) {
        return res.status(500).json({
            error: "Forum not active"
        });
    }

    const userID = require('../Auth').verifyUser(req);

    // const forumPost = {
    //     ownerId: userId,
    //     title: postTitle,
    //     body: postBody,
    //     user: account.user.displayName,
    //     date: new Date(),
    //     beans: 0,
    //     comments: [],
    //     whoLiked: [],
    //     whoDisliked: []
    // };

    const forumPosts = account.user.comic.forum.posts.map(post => {
        let usersVote = 0;

        if (userID) {
            if (post.whoLiked.includes(userID))
                usersVote = 1;
            else if (post.whoDisliked.includes(userID))
                usersVote = -1;
        }

        // Now resolve all the comments

        const newComments = post.comments.map(comment => {
            let myCommentVote = 0;

            if (userID) {
                if (comment.whoLiked.includes(userID))
                    myCommentVote = 1;
                else if (comment.whoDisliked.includes(userID))
                    myCommentVote = -1;
            }

            return ({
                ownerId: comment.ownerId,
                user: comment.user,
                date: comment.date,
                text: comment.text,
                beans: comment.beans,
                myVote: myCommentVote
            });
        });

        return {
            ownerId: post.ownerId,
            title: post.title,
            body: post.body,
            user: post.user,
            date: post.date,
            beans: post.beans,
            comments: newComments,
            myVote: usersVote
        };
    });

    return res.status(200).json({
        forumPosts: forumPosts
    });
}

// Get all the published comics of a user (un authenticated)
ComicController.getAll = async function (req, res) {




}


module.exports = ComicController;

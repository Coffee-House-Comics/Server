/** REMINDER **
    - Every response in the controllers must be one of these 2 to actually send the data:
        1. res.status(CODE).send(DATA || EMPTY)
        2. res.status(CODE).json({})
*/

const schemas = require('../Schemas/schemas');
const common = require('./commonController');

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

    if (recentContent && likedContent) {
        //Send content in response body
        return res.status(200).json({
            mostRecent: recentContent,
            mostLiked: likedContent
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
                    posts: [ComicPost Objects]
                    authors: [{
                        id: ObjectId
                        displayName: String,
                        bio: String,
                        profileImage: Image,
                    }]
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

    return res.status(200).json({
        posts: posts,
        authors: authors
    });
}

ComicController.subscriptions = async function (req, res) {
    /* Subscriptions ------------
        Request body: {}

        Response {
            status 200 OK or 500 ERROR
            body: {
                content: [ComicPost Objects]

                //If error
                error: String
            }
        }
    */

    //Get the user that made the request
    let account = await schemas.Account.findOne({ _id: req.userId });

    //Check for error
    if(!account){
        return res.status(500).json({
            error: "Server error getting user from ID"
        });
    }
    let user = account.user;

    //Find all posts
    let content = await schemas.ComicPost.find({});
    if(!content){
        return res.status(500).json({
            error: "Server error getting user from ID"
        });
    }

    //Filter for subscribed posts
    content = content.filter((post) => {
        return user.comic.subscriptions.map((subscription) => subscription.id).includes(post._id);
    });

    return res.status(200).json({
        content: content
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
    /* Create a Comic (On the backend) ------------
        Request body: {
            id: String || null,
            userName: String  || null
        }

        Response {
            status: 200 OK or 500 ERROR,
            body: {
                id: ObjectId
            }
        }
    */
}

ComicController.published = async function (req, res) {
    /* Get published comic by id  ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR,
            body: {
                name: String,
                description: String,

                author: String,
                authorID: ObjectId,

                series: {
                    isSeriesMember: Boolean,
                    seriesName: String,
                    seriesID: Number
                },

                publishedDate: Date,
                beans: Number,
                comments: [CommentSchema],
                pages: [
                    {
                        title: String,
                        image: Image,
                    }
                ]
            }
        }
    */
}

ComicController.unpublished = async function (req, res) {
    /* Get UNpublished comic by id  ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR,
            body: {
                name: String,
                description: String,
                
                author: String,
                authorID: ObjectId,

                pages: [
                    {
                        title: String,
                        konvaPage: JSON
                    }
                ]

                prefabs: [ JSON ],
                stickers: [ JSON ]
            }
        }
    */
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
    if (!req.params.id){
        return res.status(500).json({
            error: "No id provided"
        });
    }
    if(!req.userId){
        return res.status(500).json({
            error: "User ID not found"
        });
    }

    //Get params
    let userId = req.userId;
    let comicId = req.params.id;
    let series = null;
    if(req.body && req.body.series){
        series = req.body.series;
    }

    //Get user
    let account = await schemas.Account.findOne({_id: userId});
    if(!account){
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get post
    let comic = await schemas.ComicPost.findOne({_id: comicId});
    if(!comic){
        return res.status(500).json({
            error: "Comic could not be found"
        });
    }

    //Make sure user owns this comic
    if(comic.authorID !== userId){
        return res.status(403).json({
            error: "This user does not own this post"
        });
    }

    //The user does own this comic. Now set it to published
    await schemas.ComicPost.updateOne({_id: comicId}, {
        isPublished: true,
        series: series
    });

    return res.status(200).send();
}

// Deleting
ComicController.delete = async function (req, res) {
    /* Deleting a comic ------------
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
    if (!req.params.id){
        return res.status(500).json({
            error: "No id provided"
        });
    }
    if(!req.userId){
        return res.status(500).json({
            error: "User ID not found"
        });
    }

    //Get params
    let userId = req.userId;
    let comicId = req.params.id;

    //Get user
    let account = await schemas.Account.findOne({_id: userId});
    if(!account){
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get post
    let comic = await schemas.ComicPost.findOne({_id: comicId});
    if(!comic){
        return res.status(500).json({
            error: "comic could not be found"
        });
    }

    //Make sure user owns this comic
    if(comic.authorID !== userId){
        return res.status(403).json({
            error: "This user does not own this post"
        });
    }

    //The user does own this comic. Now delete it
    try {
        await schemas.ComicPost.deleteOne({_id: comicId});
        return res.status(200).send();
    } catch(err){
        return res.status(500).json({
            error: "Error deleting comic"
        });
    }
}

ComicController.delete_comment = async function (req, res) {
    /* Delete a comment------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

ComicController.delete_forumPost = async function (req, res) {
    /* Delete a Forum Post------------
        Request body: {}
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */
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
}

ComicController.user_toggleForum = async function (req, res) {
    /* Toggle Forum for user ------------
        Request body: {}
    
        Response {
            status: 200 OK or 500 ERROR
        }
    */
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
    /* Vote on a Comic ------------
        Request body: {
            type: Integer
        }
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

ComicController.vote_forumPost = async function (req, res) {
    /* Vote on a Forum Post ------------
        Request body: {
            type: Integer
        }
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */
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
           status: 200 OK or 500 ERROR,
       }
   */
}

ComicController.deleteBookmark = async function (req, res) {
    /* UN-Bookmark a post ------------
       Request body: { }
   
       Response {
           status: 200 OK or 500 ERROR,
       }
   */
}

ComicController.subscribe_user = async function (req, res) {
    /*
        Request body { }

        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

ComicController.unsubscribe_user = async function (req, res) {
    /*
        Request body { }

        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

ComicController.subscribe_series = async function (req, res) {
    /*
        Request body { }

        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

ComicController.unsubscribe_series = async function (req, res) {
    /*
        Request body { }

        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}


module.exports = ComicController;

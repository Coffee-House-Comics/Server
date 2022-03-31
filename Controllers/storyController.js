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

const StoryController = {};

StoryController.explore = async function (req, res) {
    /* Explore ------------
        Request body: {}

        Response {
            status 200 OK or 500 ERROR
            body: {
                mostRecent: [StoryPost Objects]
                mostLiked: [StoryPost Objects]

                //If error
                error: String
            }
        }
    */

    let recentContent = [];
    let likedContent = [];

    //Find most recent posts
    recentContent = await schemas.StoryPost.find({}).sort({ publishedDate: 'descending' }).limit(NUM_RECENT_POSTS);

    //Find most liked posts
    likedContent = await schemas.StoryPost.find({}).sort({ beans: 'descending' }).limit(NUM_LIKED_POSTS);

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

StoryController.search = async function (req, res) {
    /* Search ------------
        Request body: {
            searchCriteria: [String]
        }

        Response {
            status 200 OK or 500 ERROR
            body: {
                content: {
                    posts: [StoryPost Objects]
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
    let posts = await schemas.StoryPost.find({});

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
    if (req.body.searchCriteria) {
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

StoryController.subscriptions = async function (req, res) {
    /* Subscriptions ------------
        Request body: {}

        Response {
            status 200 OK or 500 ERROR
            body: {
                content: [StoryPost Objects]

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
    let content = await schemas.StoryPost.find({});
    if(!content){
        return res.status(500).json({
            error: "Server error getting user from ID"
        });
    }

    //Filter for subscribed posts
    content = content.filter((post) => {
        return user.story.subscriptions.map((subscription) => subscription.id).includes(post._id);
    });

    return res.status(200).json({
        content: content
    });
}


// Need Authentication ------------------------------------------------

// Creating
// TODO:
StoryController.create = async function (req, res) {
    /* Create a Story Post (On the backend) ------------
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

// TODO:
StoryController.published = async function (req, res) {
    /* Get published Story by id  ------------
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
                    title: String,
                    body: JSON,
                    decisions: [
                        {
                            name: String,
                            nextPageId: String
                        }
                    ]
                ],    
            }
        }
    */
}

// TODO:
StoryController.unpublished = async function (req, res) {
    /* Get UNpublished Story by id  ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR,
            body: {
                name: String,
                description: String,
                
                author: String,
                authorID: ObjectId,

                pages: [
                    title: String,
                    body: JSON,
                    decisions: [
                        {
                            name: String,
                            nextPageId: String
                        }
                    ]
                ],
                ReactFlowJSON: JSON,
            }
        }
    */
}

// Publishing
// TODO:
StoryController.publish = async function (req, res) {
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

// Deleting
// TODO:
StoryController.delete = async function (req, res) {
    /* Deleting a Story ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

// TODO:
StoryController.delete_comment = async function (req, res) {
    /* Delete a comment------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

// TODO:
StoryController.delete_forumPost = async function (req, res) {
    /* Delete a Forum Post------------
        Request body: {}
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

// TODO:
StoryController.deleteSticker = async function (req, res) {
    /* Delete a sticker ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR
        }
    */
}

// User related Content
// TODO:
StoryController.user_saved = async function (req, res) {
    /* Get user's saved Storys ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

// TODO:
StoryController.user_toggleForum = async function (req, res) {
    /* Toggle Forum for user ------------
        Request body: {}
    
        Response {
            status: 200 OK or 500 ERROR
        }
    */
}

// Story metadata editing (Cover photo, Title, Bio, Series)
// TODO:
StoryController.metadata_update = async function (req, res) {
    /* Update the metadata of a Story ------------
        Request body: {
            title: String,
            bio: String
        }

        Response {
            status: 200 OK or 500 ERROR
        }
    */
}

// Story content editing
// TODO:
StoryController.content_save = async function (req, res) {
    /* Update the metadata of a Story ------------
        Request body: {
            title: String,
            bio: String
        }

        Response {
            status: 200 OK or 500 ERROR
        }
    */
}

// Commenting
// TODO:
StoryController.comment = async function (req, res) {
    /* Comment on a Story ------------
        Request body: {
            text: String
        }

        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

// TODO:
StoryController.comment_forumPost = async function (req, res) {
    /* Comment on a Forum Post ------------
        Request body: {
            text: String
        }
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

// TODO:
StoryController.bookmark = async function (req, res) {
    /* Bookmark a post ------------
       Request body: { }
   
       Response {
           status: 200 OK or 500 ERROR,
       }
   */
}

// TODO:
StoryController.deleteBookmark = async function (req, res) {
    /* UN-Bookmark a post ------------
       Request body: { }
   
       Response {
           status: 200 OK or 500 ERROR,
       }
   */
}

// TODO:
StoryController.subscribe_user = async function (req, res) {
    /*
        Request body { }

        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

// TODO:
StoryController.unsubscribe_user = async function (req, res) {
    /*
        Request body { }

        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

// TODO:
StoryController.subscribe_series = async function (req, res) {
    /*
        Request body { }

        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

// TODO:
StoryController.unsubscribe_series = async function (req, res) {
    /*
        Request body { }

        Response {
            status: 200 OK or 500 ERROR,
        }
    */

    console.log("Entering getProfileById");

    if (!req || !req.params || !req.params.id) {
        return res.status(500).json({
            error: "No id provided"
        });
    }

    try {
        const user = await schemas.Account.findOne({ _id: req.params.id });

    }
    catch (err) {
        return res.status(500).json({
            error: "Server error getting profile by id"
        });
    }
}


module.exports = StoryController;
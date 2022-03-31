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
    if (!account) {
        return res.status(500).json({
            error: "Server error getting user from ID"
        });
    }
    let user = account.user;

    //Find all posts
    let content = await schemas.StoryPost.find({});
    if (!content) {
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

StoryController.published = async function (req, res) {
    /* Get published Story by id  ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR or 403 FORBIDDEN,
            body: {
                content: StoryPost Object
                
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
    if (!req.params.id){
        return res.status(500).json({
            error: "No id provided"
        });
    }

    //Get params
    let storyId = req.params.id;
    
    //Get post
    let story = await schemas.StoryPost.findOne({_id: storyId});
    if(!story){
        return res.status(500).json({
            error: "Story could not be found"
        });
    }

    //Make sure user the story is published
    if(!story.isPublished){
        return res.status(403).json({
            error: "This story is not published"
        });
    }

    //The story is published. Now send it in response
    return res.status(200).json({
        content: story
    });
}


StoryController.unpublished = async function (req, res) {
    /* Get UNpublished Story by id  ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR or 400 BAD,
            body: {
                content: StoryPost Object

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
    let storyId = req.params.id;

    //Get user
    let account = await schemas.Account.findOne({_id: userId});
    if(!account){
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get post
    let story = await schemas.StoryPost.findOne({_id: storyId});
    if(!story){
        return res.status(500).json({
            error: "Story could not be found"
        });
    }

    //Make sure user owns this story
    if(story.authorID !== userId){
        return res.status(403).json({
            error: "This user does not own this post"
        });
    }

    //Make sure story is unpublished
    if(story.isPublished){
        return res.status(400).json({
            error: "This story is published"
        });
    }

    //The user does own this story and it is published. Now send it in response body
    return res.status(200).json({
        content: story
    });
}

// Publishing
StoryController.publish = async function (req, res) {
    /* Publish Story ------------ 
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
    let storyId = req.params.id;
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
    let story = await schemas.StoryPost.findOne({_id: storyId});
    if(!story){
        return res.status(500).json({
            error: "Story could not be found"
        });
    }

    //Make sure user owns this story
    if(story.authorID !== userId){
        return res.status(403).json({
            error: "This user does not own this post"
        });
    }

    //The user does own this story. Now set it to published
    try{
        await schemas.StoryPost.updateOne({_id: storyId}, {
            isPublished: true,
            series: series
        });
    } catch(err){
        return res.status(500).json({
            error: "Error updating story"
        });
    }

    return res.status(200).send();
}

// Deleting
StoryController.delete = async function (req, res) {
    /* Deleting a Story ------------
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
    let storyId = req.params.id;

    //Get user
    let account = await schemas.Account.findOne({_id: userId});
    if(!account){
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Get post
    let story = await schemas.StoryPost.findOne({_id: storyId});
    if(!story){
        return res.status(500).json({
            error: "Story could not be found"
        });
    }

    //Make sure user owns this story
    if(story.authorID !== userId){
        return res.status(403).json({
            error: "This user does not own this post"
        });
    }

    //The user does own this story. Now delete it
    try {
        await schemas.StoryPost.deleteOne({_id: storyId});
        return res.status(200).send();
    } catch(err){
        return res.status(500).json({
            error: "Error deleting story"
        });
    }
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

StoryController.user_toggleForum = async function (req, res) {
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
    if(!req.userId){
        return res.status(500).json({
            error: "User ID not found"
        });
    }

    //Get params
    let userId = req.userId;
    
    //Get user
    let account = await schemas.Account.findOne({_id: userId});
    if(!account){
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Check existence of forum object
    if(!account || !account.user || !account.user.story || !account.user.story.forum){
        return res.status(500).json({
            error: "No forum set for this account"
        });
    }

    //Determine new (toggled) forum state
    let newForumStatus = !(account.user.story.forum.active)

    //Toggle user's forum state
    try {
        await schemas.Account.findByIdAndUpdate(userId, {
            "$set": {"user.story.forum.active": newForumStatus}
        });
    } catch(err){
        return res.status(500).json({
            error: "Error updating forum state"
        });
    }

    res.status(200).json({
        isForumEnabled: newForumStatus
    });
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
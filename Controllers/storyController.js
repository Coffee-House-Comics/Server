/** REMINDER **
    - Every response in the controllers must be one of these 2 to actually send the data:
        1. res.status(CODE).send(DATA || EMPTY)
        2. res.status(CODE).json({})
*/

const schemas = require('../Schemas/schemas');
const common = require('./commonController');
const Utils = require('../Utils');

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
        return Utils.constructProfileObjFromAccount(account);
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
StoryController.create = async function (req, res) {
    /* Create a Story Post (On the backend) ------------
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
    if(!req.userId){
        return res.status(500).json({
            error: "User ID not found"
        });
    }
    if(!req.body || !req.body.name || !req.body.description){
        return res.status(400).json({
            error: "Invalid request body"
        });
    }

    //Get params
    let userId = req.userId;
    let name = req.body.name;
    let description = req.body.description;

    //Get user
    let account = await schemas.Account.findOne({_id: userId});
    if(!account){
        return res.status(500).json({
            error: "User could not be found"
        });
    }

    //Create story and save to DB
    let createdStory = null;
    try {
        createdStory = await schemas.StoryPost.create({
            name: name,
            description: description,
            author: account.user.displayName,
            isPublished: false,
            publishedDate: null,
            beans: 0,
            series: null,
            comments: [],
            authorID: userId,
            unpublished: {
                pages: [],
                ReactFlowJSON: null
            },
            published: {
                pages: []
            }
        });
    } catch(err){
        return res.status(500).json({
            error: "Error saving new story"
        })
    }

    //Get current posts array
    let currentPosts = account.user.story.posts;
    if(!currentPosts){
        currentPosts = [];
    }
    
    //Add post to user's posts array
    currentPosts.push(createdStory._id);

    //Save change to user
    try {
        await schemas.Account.findByIdAndUpdate(userId, {
            "$set": {"user.story.posts": currentPosts}
        });
    } catch(err){
        return res.status(500).json({
            error: "Error updating forum state"
        });
    }
    
    res.status(200).json({
        id: createdStory._id
    });
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

    //Disconnect comments
    for(let comment of story.comments){
        //Disconnect comment from all users
        let err = Utils.disconnectComment(comment);
        if(err){
            return res.status(500).json({
                error: err
            });
        }
    }

    //Remove this post from all users' liked lists
    for(let likerId of story.whoLiked){
        //Get the user's Account object
        let liker = await schemas.Account.findOne({_id: likerId});
        if(!liker){
            return res.status(500).json({
                error: "Error retreiving liker account obj"
            });
        }

        //Remove this post from the user's list of liked things
        let likedIds = Utils.arrRemove(liker.user.story.liked, story._id);
        try {
            await schemas.Account.findByIdAndUpdate(userId, {
                "$set": {"user.story.liked": likedIds}
            });
        } catch(err){
            return "Error updating post liker's list of liked objects";
        }
    }

    //Remove this post from all users' disliked lists
    for(let dislikerId of story.whoLiked){
        //Get the user's Account object
        let disliker = await schemas.Account.findOne({_id: dislikerId});
        if(!disliker){
            return res.status(500).json({
                error: "Error retreiving disliker account obj"
            });
        }

        //Remove this post from the user's list of disliked things
        let dislikedIds = Utils.arrRemove(disliker.user.story.disliked, story._id);
        try {
            await schemas.Account.findByIdAndUpdate(userId, {
                "$set": {"user.story.disliked": dislikedIds}
            });
        } catch(err){
            return "Error updating post disliker's list of disliked objects";
        }
    }

    //Change the author's bean count
    let newBeanCount = account.user.story.beans - story.beans;
    try{
        await schemas.Account.findByIdAndUpdate(userId, {
            "$set": {"user.beans": newBeanCount}
        });
    } catch(err){
        return res.status(500).json({
            error: "Error updating author's bean count"
        });
    }

    //Delete the post
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

StoryController.bookmark = async function (req, res) {
    /* Bookmark a post ------------
       Request body: { }
   
       Response {
           status: 200 OK or 500 ERROR or 403 FORBIDDEN,
           body:{
               //If error:
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

    //Make sure user bookmarks list exists
    if(!account || !account.user || !account.user.story || !account.user.story.saved){
        return res.status(500).json({
            error: "User bookmarks list does not exist"
        });
    }

    //Get post
    let story = await schemas.StoryPost.findOne({_id: storyId});
    if(!story){
        return res.status(500).json({
            error: "Story could not be found"
        });
    }

    //Make post is published
    if(!story.isPublished){
        return res.status(403).json({
            error: "This story is not published"
        });
    }

    //Story is published. Add its ID to user bookmarks list
    let newBookmarksList = account.user.story.saved.push(storyId);
    try {
        await schemas.Account.findByIdAndUpdate(userId, {
            "$set": {"user.story.saved": newBookmarksList}
        });
    } catch(err){
        return res.status(500).json({
            error: "Error adding bookmark"
        });
    }

    return res.status(200).send();
}

StoryController.deleteBookmark = async function (req, res) {
    /* UN-Bookmark a post ------------
       Request body: { }
   
       Response {
           status: 200 OK or 500 ERROR,
           body: {
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

    //Make sure user bookmarks list exists
    if(!account || !account.user || !account.user.story || !account.user.story.saved){
        return res.status(500).json({
            error: "User bookmarks list does not exist"
        });
    }

    //Make sure story is in bookmarks list
    if(!account.user.story.saved.includes(storyId)){
        return res.status(500).json({
            error: "The specified story is not bookmarked by this user"
        });
    }

    //Story is in bookmarks list. Remove it and update
    let newBookmarksList = account.user.story.saved.splice(account.user.story.saved.indexOf(storyId), 1);
    try {
        await schemas.Account.findByIdAndUpdate(userId, {
            "$set": {"user.story.saved": newBookmarksList}
        });
    } catch(err){
        return res.status(500).json({
            error: "Error removing bookmark"
        });
    }

    return res.status(200).send();
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
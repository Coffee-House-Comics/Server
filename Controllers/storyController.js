/** REMINDER **
    - Every response in the controllers must be one of these 2 to actually send the data:
        1. res.status(CODE).send(DATA || EMPTY)
        2. res.status(CODE).json({})
*/

const schemas = require('../Schemas/schemas');
const common = require('./commonController'); 


// Helper functions ----------------------------------------------



// Main functions ----------------------------------------------

const StoryController = {};

//TODO: 
StoryController.explore = async function (req, res) {
    /* Explore ------------
        Request body: {
            sortMethod: String
            searchCriteria: String
        }

        Response {
            status 200 OK or 500 ERROR
            body: {
                [Story Series Objects]
            }
        }
    */




}

// TODO:
StoryController.subscriptions = async function (req, res) {
    /* Subscriptions ------------
        Request body: {
            sortMethod: String
            searchCriteria: String
        }

        Response {
            status 200 OK or 500 ERROR
            body: {
                [Story Series Objects]
            }
        }
    */
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
            err: "Server error getting profile by id"
        });
    }
}


module.exports = StoryController;
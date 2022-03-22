const StoryController = {};

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

StoryController.getProfileById = async function (req, res) {
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

StoryController.getProfileByUserName = async function (req, res) {
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
StoryController.create = async function (req, res) {
    /* Create a Story (On the backend) ------------
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
StoryController.delete = async function (req, res) {
    /* Deleting a Story ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

StoryController.delete_comment = async function (req, res) {
    /* Delete a comment------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

StoryController.delete_forumPost = async function (req, res) {
    /* Delete a Forum Post------------
        Request body: {}
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

StoryController.deleteSticker = async function (req, res) {
    /* Delete a sticker ------------
        Request body: {}

        Response {
            status: 200 OK or 500 ERROR
        }
    */
}

// User related Content
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
            status: 200 OK or 500 ERROR
        }
    */
}

// Story metadata editing (Cover photo, Title, Bio, Series)
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

StoryController.content_saveSticker = async function (req, res) {
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

// Voting (upvoting/downvoting AKA liking/disliking)
StoryController.vote = async function (req, res) {
    /* Vote on a Story ------------
        Request body: {
            isUpvote: Boolean
        }
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

StoryController.vote_forumPost = async function (req, res) {
    /* Vote on a Forum Post ------------
        Request body: {
            isUpvote: Boolean
        }
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

StoryController.vote_comment = async function (req, res) {
    /* Vote on a Comment ------------
        Request body: {
            isUpvote: Boolean
        }
    
        Response {
            status: 200 OK or 500 ERROR,
        }
    */
}

module.export = StoryController;
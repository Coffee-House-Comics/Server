const express = require('express')
const router = express.Router()
const ComicController = require('../Controllers/comicController')

/* Explore ------------
    Request body: {
        sortMethod: String
        searchCriteria: String
    }

    Response {
        status 200 OK or 500 ERROR
        body: {
            [Comic Series Objects]
        }
    }
*/
router.get('/explore', ComicController.explore);
/* Subscriptions ------------
    Request body: {
        sortMethod: String
        searchCriteria: String
    }

    Response {
        status 200 OK or 500 ERROR
        body: {
            [Comic Series Objects]
        }
    }
*/
router.get('/subscriptions', ComicController.subscriptions);

/* Get profile By ID or Username ------------
    Request body: {
        id: String || null,
        userName: String  || null
    }

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
router.get('/profile', ComicController.getProfile);

// Creating ------------------------------------------------
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
router.post('/create', ComicController.create);
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
router.get('/published/:id', ComicController.XXX);
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
router.get('/unpublished/:id', ComicController.XXX);





/* Activates the forum for comics
    Request body: {}

    Response {
        status: 200 OK or 500 ERROR,
        body: {
            
        }

    }
*/
router.post('/create/forum', ComicController.create_forum);


// Publishing
/* Publish Comic ------------ 
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
router.post('/publish/:id', ComicController.publish);

/* Deleting a comic ------------
    Request body: {}

    Response {
        status: 200 OK or 500 ERROR,
    }
*/
router.delete('/:id', ComicController.delete);
/* Delete a comment------------
    Request body: {}

    Response {
        status: 200 OK or 500 ERROR,
    }
*/
router.delete('/comment/:id', ComicController.delete_comment);
/* Delete a Forum Post------------
    Request body: {}

    Response {
        status: 200 OK or 500 ERROR,
    }
*/
router.delete('/forumPost/:id', ComicController.delete_forumPost);
/* Delete a sticker ------------
    Request body: {}

    Response {
        status: 200 OK or 500 ERROR
    }
*/
router.delete('/sticker/:id', ComicController.CCC);

// User related Content
/* Get user's saved comics ------------
    Request body: {}

    Response {
        status: 200 OK or 500 ERROR,
    }
*/
router.get('/user/saved', ComicController.user_saved);
/* Toggle Forum for user ------------
    Request body: {}

    Response {
        status: 200 OK or 500 ERROR
    }
*/
router.post('/user/toggleForum', ComicController.user_toggleForum);

// Comic metadata editing (Cover photo, Title, Bio, Series)
/* Update the metadata of a comic ------------
    Request body: {
        title: String,
        bio: String
    }

    Response {
        status: 200 OK or 500 ERROR
    }
*/
router.put('/metadata/update/:id', ComicController.metadata_update);

// Comic content editing
/* Update the metadata of a comic ------------
    Request body: {
        title: String,
        bio: String
    }

    Response {
        status: 200 OK or 500 ERROR
    }
*/
router.put('/content/save', ComicController.content_save);
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
router.post('/content/saveSticker', ComicController.content_saveSticker);

// Commenting
/* Comment on a Comic ------------
    Request body: {
        text: String
    }

    Response {
        status: 200 OK or 500 ERROR,
    }
*/
router.post('/comment/:id', ComicController.comment);
/* Comment on a Forum Post ------------
    Request body: {
        text: String
    }

    Response {
        status: 200 OK or 500 ERROR,
    }
*/
router.post('/comment/forumPost/:id', ComicController.comment_forum);

// Voting (upvoting/downvoting AKA liking/disliking)
/* Vote on a Comic ------------
    Request body: {
        isUpvote: Boolean
    }

    Response {
        status: 200 OK or 500 ERROR,
    }
*/
router.post('/vote/:id', ComicController.vote);
/* Vote on a Forum Post ------------
    Request body: {
        isUpvote: Boolean
    }

    Response {
        status: 200 OK or 500 ERROR,
    }
*/
router.post('/vote/forumPost', ComicController.vote_forumPost);
/* Vote on a Comment ------------
    Request body: {
        isUpvote: Boolean
    }

    Response {
        status: 200 OK or 500 ERROR,
    }
*/
router.post('/vote/comment', ComicController.vote_comment);

module.exports = router
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
router.get('published/:id', ComicController.XXX);
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
        }
    }
*/
router.get('unpublished/:id', ComicController.XXX);





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
            seriesID: Number
        },

        
    }
*/
router.post('/publish', ComicController.publish);

// Deleting
router.delete('/:id', ComicController.delete);
router.delete('/comment', ComicController.delete_comment);
router.delete('/forumPost', ComicController.delete_forumPost);
// Deletes/Deactivates the forum the user has for their Comics page
router.delete('/forum', ComicController.XXX);

// User related Content
router.get('/user/saved', ComicController.user_saved);
router.post('/user/toggleForum', ComicController.user_toggleForum);

// Comic metadata editing (Cover photo, Title, Bio, Series)
router.post('/metadata/update', ComicController.metadata_update);

// Comic content editing
router.post('/content/save', ComicController.content_save);
router.post('/content/saveSticker', ComicController.content_saveSticker);

// Commenting
router.post('/comment/', ComicController.comment);
router.post('/comment/forumPost', ComicController.comment_forum);

// Voting (upvoting/downvoting AKA liking/disliking)
router.post('/vote', ComicController.vote);
router.post('/vote/forumPost', ComicController.vote_forumPost);
router.post('/vote/comment', ComicController.vote_comment);

module.exports = router
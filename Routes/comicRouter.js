const express = require('express')
const router = express.Router()
const ComicController = require('../Controllers/comicController')

router.get('/explore', ComicController.explore);
router.get('/subscriptions', ComicController.subscriptions);

router.get('/profileById', ComicController.profileById);
router.get('/profileByUserName', ComicController.profileByUserName);

// Need Authentication ------------------------------------------------

// Creating
router.post('/create', ComicController.create);
router.post('/create/forum', ComicController.create_forum);

// Publishing
router.post('/publish', ComicController.publish);

// Deleting
router.delete('/', ComicController.delete);
router.delete('/comment', ComicController.delete_comment);
router.delete('/forumPost', ComicController.delete_forumPost);

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
router.post('/comment/forum', ComicController.comment_forum);

// Voting (upvoting/downvoting AKA liking/disliking)
router.post('/vote', ComicController.vote);
router.post('/vote/forumPost', ComicController.vote_forumPost);
router.post('/vote/comment', ComicController.vote_comment);

module.exports = router
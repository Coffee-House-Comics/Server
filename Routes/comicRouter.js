const express = require('express')
const router = express.Router()
const ComicController = require('../Controllers/comicController')


router.get('/explore', ComicController.explore);
router.get('/subscriptions', ComicController.subscriptions);

router.get('/profile/:id', ComicController.getProfileById);
router.get('/profile/:userName', ComicController.getProfileByUserName);


// Creating ------------------------------------------------
router.post('/create', ComicController.create);
router.get('/published/:id', ComicController.published);
router.get('/unpublished/:id', ComicController.unpublished);

// Publishing
router.post('/publish/:id', ComicController.publish);

// Deleting
router.delete('/:id', ComicController.delete);
router.delete('/comment/:id', ComicController.delete_comment);
router.delete('/forumPost/:id', ComicController.delete_forumPost);
router.delete('/sticker/:id', ComicController.deleteSticker);

// User related Content
router.get('/user/saved', ComicController.user_saved);
router.post('/user/toggleForum', ComicController.user_toggleForum);

// Comic metadata editing (Cover photo, Title, Bio, Series)
router.put('/metadata/update/:id', ComicController.metadata_update);

// Comic content editing
router.put('/content/save', ComicController.content_save);
router.post('/content/saveSticker', ComicController.content_saveSticker);

// Commenting
router.post('/comment/:id', ComicController.comment);
router.post('/comment/forumPost/:id', ComicController.comment_forumPost);

// Voting (upvoting/downvoting AKA liking/disliking)
router.post('/vote/:id', ComicController.vote);
router.post('/vote/forumPost', ComicController.vote_forumPost);
router.post('/vote/comment', ComicController.vote_comment);

module.exports = router
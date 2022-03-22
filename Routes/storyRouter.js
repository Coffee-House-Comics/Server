const express = require('express')
const router = express.Router()
const StoryController = require('../Controllers/storyController')


router.get('/explore', StoryController.explore);
router.get('/subscriptions', StoryController.subscriptions);

router.get('/profile/:id', StoryController.getProfileById);
router.get('/profile/:userName', StoryController.getProfileByUserName);


// Creating ------------------------------------------------
router.post('/create', StoryController.create);
router.get('/published/:id', StoryController.published);
router.get('/unpublished/:id', StoryController.unpublished);

// Publishing
router.post('/publish/:id', StoryController.publish);

// Deleting
router.delete('/:id', StoryController.delete);
router.delete('/comment/:id', StoryController.delete_comment);
router.delete('/forumPost/:id', StoryController.delete_forumPost);
router.delete('/sticker/:id', StoryController.deleteSticker);

// User related Content
router.get('/user/saved', StoryController.user_saved);
router.post('/user/toggleForum', StoryController.user_toggleForum);

// Comic metadata editing (Cover photo, Title, Bio, Series)
router.put('/metadata/update/:id', StoryController.metadata_update);

// Comic content editing
router.put('/content/save', StoryController.content_save);
router.post('/content/saveSticker', StoryController.content_saveSticker);

// Commenting
router.post('/comment/:id', StoryController.comment);
router.post('/comment/forumPost/:id', StoryController.comment_forumPost);

// Voting (upvoting/downvoting AKA liking/disliking)
router.post('/vote/:id', StoryController.vote);
router.post('/vote/forumPost', StoryController.vote_forumPost);
router.post('/vote/comment', StoryController.vote_comment);

module.exports = router
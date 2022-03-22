const express = require('express')
const router = express.Router()
const auth = require('../auth')
const StoryController = require('../Controllers/storyController')

router.get('/explore', StoryController.explore);
router.get('/subscriptions', auth.verify, StoryController.subscriptions);

router.get('/profile/:id', auth.verify, StoryController.getProfileById);
// Get a profiles information by userName (unauthenticated)
router.get('/profile/:userName', StoryController.getProfileByUserName);


// Creating ------------------------------------------------
// Create a post
router.post('/create', auth.verify, StoryController.create);

// Get published post by ID (unauthenticated)
router.get('/published/:id', StoryController.published);
// Get unpublished post 
router.get('/unpublished/:id', auth.verify, StoryController.unpublished);

// Publishing
router.post('/publish/:id', auth.verify, StoryController.publish);

// Deleting
router.delete('/:id', auth.verify, StoryController.delete);
router.delete('/comment/:id', auth.verify, StoryController.delete_comment);
router.delete('/forumPost/:id', auth.verify, StoryController.delete_forumPost);

// User related Content
router.get('/user/saved', auth.verify, StoryController.user_saved);
router.post('/user/toggleForum', auth.verify, StoryController.user_toggleForum);

// Story metadata editing (Cover photo, Title, Bio, Series)
router.put('/metadata/update/:id', auth.verify, StoryController.metadata_update);

// Story content editing
router.put('/content/save', auth.verify, StoryController.content_save);

// Commenting
router.post('/comment/:id', auth.verify, StoryController.comment);
router.post('/comment/forumPost/:id', auth.verify, StoryController.comment_forumPost);

// Voting (upvoting/downvoting AKA liking/disliking)
router.post('/vote/:id', auth.verify, StoryController.vote);
router.post('/vote/forumPost', auth.verify, StoryController.vote_forumPost);
router.post('/vote/comment', auth.verify, StoryController.vote_comment);

// Bookmarking a post
router.post('/bookmark/:id', auth.verify, ComicController.bookmark);

// Subscribing to a user
router.post('/subscribe/user/:id', auth.verify, StoryController.subscribe_user);
// Subscribing to a series
router.post('/subscribe/series/:id', auth.verify, StoryController.subscribe_series);

module.exports = router
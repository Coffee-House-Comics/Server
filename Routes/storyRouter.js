const express = require('express');
const router = express.Router();
const auth = require('../Auth');
const types = require('../Schemas/types');

const StoryController = require('../Controllers/storyController');
const CommonController = require('../Controllers/commonController');


router.get('/explore', StoryController.explore);
router.get('/search', StoryController.search);
router.get('/subscriptions', auth.verify, StoryController.subscriptions);

router.get('/profile/:id', CommonController.getProfileById);
// Get a profiles information by userName 
router.get('/profile/:userName', CommonController.getProfileByUserName);


// Creating ------------------------------------------------
// Create a post
router.post('/create', auth.verify, auth.emailIsVerified, StoryController.create);

// Get published post by ID (unauthenticated)
router.get('/published/:id', StoryController.published);
// Get unpublished post 
router.get('/unpublished/:id', auth.verify, auth.emailIsVerified, StoryController.unpublished);

// Publishing
router.post('/publish/:id', auth.verify, StoryController.publish);

// Deleting
router.delete('/:id', auth.verify, StoryController.delete);
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
router.post('/vote/:id', auth.verify, auth.emailIsVerified, StoryController.vote);
router.post('/vote/forumPost/:id', auth.verify, auth.emailIsVerified, StoryController.vote_forumPost);
router.post('/vote/comment/:id', auth.verify, auth.emailIsVerified, (req, res) => CommonController.vote_comment(req, res, true));
router.post('/vote/forumPost/comment/:id', auth.verify, auth.emailIsVerified, (req, res) => CommonController.vote_comment(req, res, true));

// Bookmarking a post
router.post('/bookmark/:id', auth.verify, StoryController.bookmark);
router.delete('/bookmark/:id', auth.verify, StoryController.deleteBookmark);

// Subscribing to a user
router.post('/subscribe/user/:id', auth.verify, StoryController.subscribe_user);
router.delete('/subscribe/user/:id', auth.verify, StoryController.unsubscribe_user);







module.exports = router
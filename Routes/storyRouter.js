const express = require('express');
const router = express.Router();
const auth = require('../Auth');
const types = require('../Schemas/types');
const utils = require('../Utils');

const StoryController = require('../Controllers/storyController');
const CommonController = require('../Controllers/commonController');


router.get('/explore', StoryController.explore);
router.get('/search/:crit', StoryController.search);
router.get('/subscriptions', auth.verify, StoryController.subscriptions);

router.get('/profile/:id', utils.verifyValidId, CommonController.getProfileById);
// Get a profiles information by userName 
router.get('/profile/:userName', CommonController.getProfileByUserName);


// Creating ------------------------------------------------
// Create a post
router.post('/create', auth.verify, StoryController.create);
//Create a forum post
router.post('/forumPost/:id', auth.verify, utils.verifyValidId, StoryController.createForumPost);

// Get published post by ID (unauthenticated)
router.get('/published/:id', utils.verifyValidId, StoryController.published);
// Get unpublished post 
router.get('/unpublished/:id', auth.verify, utils.verifyValidId, StoryController.unpublished);
// Get forum posts for a user by id
router.get('/allForumPosts/:id', utils.verifyValidId, StoryController.getAllForumPosts);

// Publishing
router.post('/publish/:id', auth.verify, utils.verifyValidId, StoryController.publish);

// Deleting
router.delete('/forumPost/:id', auth.verify, utils.verifyValidId, StoryController.delete_forumPost);
router.delete('/comment/:id', auth.verify, utils.verifyValidId, StoryController.delete_comment);
router.delete('/forumPost/comment/:id', auth.verify, utils.verifyValidId, StoryController.delete_forumPost_comment);
router.delete('/:id', auth.verify, utils.verifyValidId, StoryController.delete);

// User related Content
router.get('/user/saved', auth.verify, StoryController.user_saved);
router.post('/user/toggleForum', auth.verify, StoryController.user_toggleForum);

// Story metadata editing (Cover photo, Title, Bio, Series)
router.put('/metadata/update/:id', auth.verify, utils.verifyValidId, StoryController.metadata_update);

// Story content editing
router.put('/content/save/:id', auth.verify, utils.verifyValidId, StoryController.content_save);

// Commenting
router.post('/comment/:id', auth.verify, utils.verifyValidId, StoryController.comment);
router.post('/comment/forumPost/:id', auth.verify, utils.verifyValidId, StoryController.comment_forumPost);

// Voting (upvoting/downvoting AKA liking/disliking)
router.post('/vote/:id', auth.verify, utils.verifyValidId, StoryController.vote);
router.post('/vote/forumPost/:id', auth.verify, utils.verifyValidId, StoryController.vote_forumPost);
router.post('/vote/comment/:id', auth.verify, utils.verifyValidId, StoryController.vote_comment);
router.post('/vote/forumPost/comment/:id', auth.verify, utils.verifyValidId, StoryController.vote_forumpost_comment);

// Bookmarking a post
router.post('/bookmark/:id', auth.verify, utils.verifyValidId, StoryController.bookmark);
router.delete('/bookmark/:id', auth.verify, utils.verifyValidId, StoryController.deleteBookmark);

// Subscribing to a user
router.post('/subscribe/user/:id', auth.verify, utils.verifyValidId, StoryController.subscribe_user);
router.delete('/subscribe/user/:id', auth.verify, utils.verifyValidId, StoryController.unsubscribe_user);


module.exports = router
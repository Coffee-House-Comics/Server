const express = require('express')
const router = express.Router()
const auth = require('../Auth')
const ComicController = require('../Controllers/comicController')

// Get the explore tab
router.get('/explore', ComicController.explore);
// Search
router.get('/search', ComicController.search);
// Get the subscriptions tab
router.get('/subscriptions', auth.verify, ComicController.subscriptions);

// Get profile by ID
router.get('/profile/:id', auth.verify, ComicController.getProfileById);
// Get profile by Username (Unauthenticated)
router.get('/profile/:userName', ComicController.getProfileByUserName);


// Creating ------------------------------------------------
// Create a Comic
router.post('/create', auth.verify, ComicController.create);
//Create a forum post
router.post('/forumPost/:id', auth.verify, ComicController.createForumPost);

//Viewing
// View a published comic by id
router.get('/published/:id', ComicController.published);
// view an unpublished comic (to edit it)
router.get('/unpublished/:id', auth.verify, ComicController.unpublished);

// Publishing
// Publish a comic
router.post('/publish/:id', auth.verify, ComicController.publish);

// Deleting
// Delete a comic by ID
router.delete('/:id', auth.verify, ComicController.delete);
// Delete a forum post by ID
router.delete('/forumPost/:id', auth.verify, ComicController.delete_forumPost);
// Delete a Sticker
router.delete('/sticker', auth.verify, ComicController.deleteSticker);

// User related Content
// Get a users saved content
router.get('/user/saved', auth.verify, ComicController.user_saved);
// Activate/Deactivate the comic forum
router.post('/user/toggleForum', auth.verify, ComicController.user_toggleForum);

// Comic metadata editing (Cover photo, Title, Bio, Series)
router.put('/metadata/update/:id', auth.verify, ComicController.metadata_update);

// Comic content editing
router.put('/content/save', auth.verify, ComicController.content_save);
router.post('/content/saveSticker', auth.verify, ComicController.content_saveSticker);

// Commenting
router.post('/comment/:id', auth.verify, ComicController.comment);
router.post('/comment/forumPost/:id', auth.verify, ComicController.comment_forumPost);
router.delete('/comment/:id', auth.verify, ComicController.delete_comment);
router.delete('/forumPost/comment/:id', auth.verify, ComicController.delete_forumPost_comment);

// Voting (upvoting/downvoting AKA liking/disliking)
router.post('/vote/:id', auth.verify, ComicController.vote);
router.post('/vote/forumPost/:id', auth.verify, ComicController.vote_forumPost);
router.post('/vote/comment/:id', auth.verify, ComicController.vote_comment);
router.post('/vote/forumPost/comment/:id', auth.verify, ComicController.vote_forumpost_comment);


// Bookmarking a post
router.post('/bookmark/:id', auth.verify, ComicController.bookmark);
router.delete('/bookmark/:id', auth.verify, ComicController.deleteBookmark);

// Subscribing to a user
router.post('/subscribe/user/:id', auth.verify, ComicController.subscribe_user);
router.delete('/subscribe/user/:id', auth.verify, ComicController.unsubscribe_user);

module.exports = router

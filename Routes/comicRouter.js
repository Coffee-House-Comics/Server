const express = require('express')
const router = express.Router()
const auth = require('../auth')
const ComicController = require('../Controllers/comicController')

// Get the explore tab
router.get('/explore', ComicController.explore);
// Get the subscriptions tab
router.get('/subscriptions', auth.verify, ComicController.subscriptions);

// Get profile by ID
router.get('/profile/:id', auth.verify, ComicController.getProfileById);
// Get profile by Username (Unauthenticated)
router.get('/profile/:userName', ComicController.getProfileByUserName);


// Creating ------------------------------------------------
// Create a Comic
router.post('/create', auth.verify, ComicController.create);
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
// Delete a comment by ID
router.delete('/comment/:id', auth.verify, ComicController.delete_comment);
// Delete a forum post by ID
router.delete('/forumPost/:id', auth.verify, ComicController.delete_forumPost);
// Delete a Sticker by ID
router.delete('/sticker/:id', auth.verify, ComicController.deleteSticker);

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

// Voting (upvoting/downvoting AKA liking/disliking)
router.post('/vote/:id', auth.verify, ComicController.vote);
router.post('/vote/forumPost', auth.verify, ComicController.vote_forumPost);
router.post('/vote/comment', auth.verify, ComicController.vote_comment);

// Bookmarking a post
router.post('/bookmark/:id', auth.verify, ComicController.bookmark);

// Subscribing to a user
router.post('/subscribe/user/:id', auth.verify, ComicController.subscribe_user);
// Subscribing to a series
router.post('/subscribe/series/:id', auth.verify, ComicController.subscribe_series);

module.exports = router
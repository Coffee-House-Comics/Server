const express = require('express')
const router = express.Router()
const AuthController = require('../Controllers/comicController')

router.get('/explore', ComicController.xxx);
router.get('/subscriptions', ComicController.xxx);

router.get('/profileById', ComicController.xxx);
router.get('/profileByUserName', ComicController.aaa);

// Need Authentication ------------------------------------------------

// Creating
router.post('/create', ComicController.bbb);
router.post('/create/forum', ComicController.ccc);

// Publishing
router.post('/publish', ComicController.yyy);

// Deleting
router.delete('/', ComicController.ppp);
router.delete('/comment', ComicController.zzz);
router.delete('/forumPost', ComicController.yyy);

// User related Content
router.get('/user/saved', ComicController.xxx);
router.post('/user/toggleForum', ComicController.XXX);

// Comic metadata editing (Cover photo, Title, Bio, Series)
router.post('/metadata/update', ComicController.xxx);

// Comic content editing
router.post('/content/save', ComicController.xxx);
router.post('/content/saveSticker', ComicController.qqq);

// Commenting
router.post('/comment/', ComicController.ddd);
router.post('/comment/forum', ComicController.ddd);

// Voting (upvoting/downvoting AKA liking/disliking)
router.post('/vote', ComicController.ggg);
router.post('/vote/forumPost', ComicController.eee);
router.post('/vote/comment', ComicController.fff);













router.get('/postById', ComicController.xxx);


// Returns an array of s
// Make helper function
router.get('/seriesByIds', AuthController.xxx);



module.exports = router
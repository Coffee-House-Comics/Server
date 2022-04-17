const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const model = mongoose.model;
const ObjectId = Schema.Types.ObjectId;

// Schemas

// ---------------------------------------------------

// Needs to be separate schema so we can search for it by id
const CommentSchema = new Schema({
    ownerId: ObjectId,
    user: String,
    date: Date,
    text: String,
    beans: Number,

    whoLiked: [ObjectId],
    whoDisliked: [ObjectId]
});

// Needs to be separate schema so we can search for it by id
const ForumPostSchema = new Schema({
    ownerId: ObjectId,
    title: String,
    body: String,
    user: String,
    date: Date,
    beans: Number,
    comments: [CommentSchema],

    whoLiked: [ObjectId],
    whoDisliked: [ObjectId]
});

// ---------------------------------------------------

const PostMetadata = ({
    // Metadata of the post
    name: String,
    description: String,
    author: String,

    isPublished: Boolean,
    publishedDate: Date,
    beans: Number,
    coverPhoto: String,

    series: String,

    comments: [CommentSchema],

    // Linking information
    authorID: ObjectId,

    whoLiked: [ObjectId],
    whoDisliked: [ObjectId]
});

const ComicPostSchema = new Schema({
    ...PostMetadata,

    pages: [
        {
            title: String,
            konvaPage: JSON
        }
    ],

});

const StoryPostSchema = new Schema({
    ...PostMetadata,

    pages: [
        {
            title: String,
            body: JSON,
            decisions: [
                {
                    name: String,
                    nextPageIndex: Number
                }
            ]
        }
    ],
    ReactFlowJSON: JSON
});

// ---------------------------------------------------

const appMetadata = ({
    beans: Number,
    posts: [ObjectId],
    series: [String],

    // Everything liked including posts, forum posts, and comments.
    liked: [ObjectId],
    disliked: [ObjectId],
    saved: [ObjectId],

    subscriptions: [ObjectId],

    forum: {
        active: Boolean,
        posts: [ForumPostSchema]
    }
});

const AccountSchema = new Schema({
    userName: String,
    email: String,
    passwordHash: String,
    isverified: Boolean,
    verificationCode: String,

    user: {
        displayName: String,
        bio: String,
        profileImage: String,

        story: {
            ...appMetadata
        },

        comic: {
            ...appMetadata,
            savedStickers: [JSON],
        },
    }
});

// ---------------------------------------------------

// Create the Models for all schemas
const Account = model('Account', AccountSchema);

const ComicPost = model('ComicPost', ComicPostSchema);
const StoryPost = model('StoryPost', StoryPostSchema);

const Image = model('Image', ImageSchema);

module.exports = {
    Account,
    ComicPost,
    StoryPost,
    Image
};
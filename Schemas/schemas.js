const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const model = mongoose.model;
const ObjectId = Schema.Types.ObjectId;

// Schemas

// ---------------------------------------------------

// Needs to be separate schema so we can search for it by id
const CommentSchema = new Schema({
    user: String,
    date: Date,
    text: String,
    beans: Number
});

// Needs to be separate schema so we can search for it by id
const ForumPostSchema = new Schema({
    title: String,
    body: String,
    user: String,
    date: Date,
    beans: Number,
    comments: [CommentSchema]
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

    series: {
        isSeriesMember: Boolean,
        seriesName: String,
        seriesID: Number
    },

    comments: [CommentSchema],

    // Linking information
    authorID: ObjectId,
});

const ComicPostSchema = new Schema({
    ...PostMetadata,

    // Unpublished storing
    unpublished: [
        {
            title: String,
            konvaPage: JSON
        }
    ],

    // Published storing
    published: [
        {
            title: String,
            image: Buffer,
        }
    ],
});

const StoryPostSchema = new Schema({
    ...PostMetadata,
    // Unpublished storing
    unpublished: {
        pages: [
            {
                title: String,
                body: JSON,
                decisions: [
                    {
                        name: String,
                        nextPageId: String
                    }
                ]
            }
        ],
        ReactFlowJSON: JSON,
    },

    // Published storing
    published: {
        pages: [
            {
                title: String,
                body: JSON,
                decisions: [
                    {
                        name: String,
                        nextPageId: String
                    }
                ]
            }
        ],
    }
});

// ---------------------------------------------------

const SeriesSchema = new Schema({
    name: String,
    beans: Number,
    members: [StoryPostSchema || ComicPostSchema]
});

// ---------------------------------------------------

const appMetadata = ({
    beans: Number,
    posts: [StoryPostSchema || ComicPostSchema],
    series: [SeriesSchema],

    // Everything liked including posts, forum posts, and comments.
    liked: [ObjectId],
    disliked: [ObjectId],
    saved: [ObjectId],

    subscriptions: [
        {
            type: Number, // Type is an enum in interfaces
            id: Number  // Id of what is subscribed to
        }
    ],

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
        profileImage: Buffer,

        totalBeans: Number,

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

const Series = model('Series', SeriesSchema);

const Comment = model('Comment', CommentSchema);
const ForumPost = model('ForumPost', ForumPostSchema);


module.exports = {
    Account,
    ComicPost,
    StoryPost,
    Series,
    Comment,
    ForumPost
};
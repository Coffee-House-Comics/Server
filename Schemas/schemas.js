import mongoose from 'mongoose';
import { Schema, model, connect, ObjectId } from 'mongoose';

// Schemas

// ---------------------------------------------------

const CommentSchema = new Schema({
    user: String,
    date: Date,
    text: String,
    beans: Number
});

const ForumPostSchema = new Schema({
    title: String,
    body: String,
    user: String,
    date: Date,
    beans: Number,
    comments: [CommentSchema]
});

const ForumSchema = new Schema({
    active: Boolean,
    posts: [ForumPostSchema]
});

// ---------------------------------------------------

// Allow Inheritance like in: https://stackoverflow.com/questions/35361297/inheriting-mongoose-schemas
const PostSchema = function () {
    // Call Super
    Schema.apply(this, arguments);
    // Add the generic Post metadata
    this.add({
        // Metadata of the post
        name: String,
        description: String,
        author: String,

        type: PostType,

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
        authorID: Number,
    });
}

const ComicPubPageSchema = new Schema({
    title: String,
    image: Image,
});

const ComicUnPubPageSchema = new Schema({
    title: String,
    konvaPage: JSON
});

const ComicPostSchema = new PostSchema();
ComicPostSchema.add({
    // Unpublished storing
    unpublished: [ComicUnPubPageSchema],

    // Published storing
    published: [ComicPubPageSchema],
});

const StoryPageSchema = new Schema({
    title: String,
    body: JSON,
    decisions: [
        {
            name: String,
            nextPageId: String
        }
    ]
});

const StoryPostSchema = new PostSchema();
StoryPostSchema.add({
    // Unpublished storing
    unpublished: {
        pages: [StoryPageSchema],
        ReactFlowJSON: JSON,
    },

    // Published storing
    published: {
        pages: [StoryPageSchema],
    }
});

// ---------------------------------------------------

const SeriesSchema = new Schema({
    name: String,
    beans: Number,
    members: [PostSchema]
});

const SubscriptionSchema = new Schema({
    type: SubscriptionType, // Type is an enum in interfaces.ts
    id: Number  // Id of what is subscribed to
});

// ---------------------------------------------------

const UserSchema = new Schema({
    userName: String,
    bio: String,
    profileImage: Image,

    totalBeans: Number,

    story: {
        beans: Number,
        posts: [StoryPostSchema],
        series: [SeriesSchema],

        liked: [ObjectId],
        disliked: [ObjectId],
        saved: [ObjectId],
        forum: ForumSchema
    },

    comic: {
        beans: Number,
        posts: [ComicPostSchema],
        series: [SeriesSchema],

        savedStickers: [JSON],

        liked: [ObjectId],
        disliked: [ObjectId],
        saved: [ObjectId],
        forum: ForumSchema
    },


    subscriptions: [SubscriptionSchema],

    likedPosts: [String], // ids
    dislikedPosts: [String], // ids
    savedPosts: [String], // ids

    // If the forum is not active these are just null
    comicForum: ForumSchema,
    storyForum: ForumSchema,
});

const AccountSchema = new Schema({
    name: String,
    email: String,
    passwordHash: String,
    isLoggedIn: Boolean,
    isverified: Boolean,
    verificationCode: String,
    user: UserSchema,
});

// ---------------------------------------------------

// Create the Models for all schemas
const Account = mongoose.model('Account', AccountSchema);
const User = mongoose.model('User', UserSchema);

const ComicPost = mongoose.model('ComicPost', ComicPostSchema);
const ComicPubPage = mongoose.model('ComicPubPage', ComicPubPageSchema);
const ComicUnPubPage = mongoose.model('ComicUnPubPage', ComicUnPubPageSchema);

const StoryPost = mongoose.model('StoryPost', StoryPostSchema);
const StoryPage = mongoose.model('StoryPage', StoryPageSchema);

const Series = mongoose.model('Series', SeriesSchema);

const Forum = mongoose.model('Forum', ForumSchema);
const ForumPost = mongoose.model('ForumPost', ForumPostSchema);
const Comment = mongoose.model('Comment', CommentSchema);

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

export default {
    Account,
    User,
    ComicPost,
    ComicPubPage,
    ComicUnPubPage,
    StoryPost,
    StoryPage,
    Series,
    Forum,
    ForumPost,
    Comment,
    Subscription
}
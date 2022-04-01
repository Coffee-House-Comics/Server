const SubscriptionType = {
    user: 0,
    comic: 1,
    story: 2,
    Series: 3
}

const VoteType = {
    down: -1,
    neutral: 0,
    up: 1
}

const commentLocation = {
    forumPost: 0,
    post: 1
}

const SortType = {
    dateAsc: 0,
    dateDesc: 1,
    beansAsc: 2,
    beansDesc: 3,
    alphaAsc: 4,
    alphaDesc: 5
}

module.exports = {
    SubscriptionType,
    VoteType,
    commentLocation,
    SortType
}
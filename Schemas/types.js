const types = {};

types.VoteType = {
    down: -1,
    neutral: 0,
    up: 1
}

types.commentLocation = {
    forumPost: 0,
    post: 1
}

types.SortType = {
    dateAsc: 0,
    dateDesc: 1,
    beansAsc: 2,
    beansDesc: 3,
    alphaAsc: 4,
    alphaDesc: 5
}

module.exports = types;
const utils = {};

utils.constructProfileObjFromAccount = function (account) {
    if (!account || !account._id || !account.user || !account.user.displayName ||
        !account.user.bio || !account.user.profileImage || !account.user.story.beans ||
        !account.user.comic.beans) {
        return null;
    }

    return {
        id: account._id,
        displayName: account.user.displayName,
        bio: account.user.bio,
        profileImage: account.user.profileImage,
        storyBeans: account.user.story.beans,
        comicBeans: account.user.story.beans,
    };
}

module.exports = utils;
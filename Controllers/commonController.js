/*
    ** This controller hosts methods that are the same for both comic and story such as get profile by id **
*/
const formidable = require('formidable')

const schemas = require('../Schemas/schemas');
const utils = require('../Utils');
const path = require('path');
const fs = require('fs');

// Main functions ----------------------------------------------

const CommonController = {};

CommonController.getProfileById = async function (req, res) {
    /* Get profile By ID ------------
        Request body: {}

        Response {
            status 200 OK or 500 ERROR
            body: {
                id: ObjectId
                displayName: String,
                bio: String,
                profileImage: String,

                storyBeans: Number,
                comicBeans: Number,

                // If error:
                error: String
            }
        }
    */

    console.log("Entering getProfileById");

    if (!req || !req.params || !req.params.id) {
        return res.status(500).json({
            error: "No id provided"
        });
    }

    try {
        const account = await schemas.Account.findOne({ _id: req.params.id });

        if (!account) {
            return res.status(500).json({
                err: "user does not exist"
            });
        }

        const response = await utils.constructProfileObjFromAccount(account);

        return res.status(200).json(response);

    }
    catch (err) {
        return res.status(500).json({
            err: "Server error getting profile by id"
        });
    }
}

CommonController.getProfileByUserName = async function (req, res) {
    /* Get profile By userName ------------
        Request body: {}

        Response {
            status 200 OK or 500 ERROR
            body: {
                id: ObjectId
                displayName: String,
                bio: String,
                profileImage: String,
            }
        }
    */

    console.log("Entering getProfileByUserName");

    if (!req || !req.params || !req.params.userName) {
        return res.status(500).json({
            error: "No userName provided"
        });
    }

    try {
        const account = await schemas.Account.findOne({ userName: req.params.userName });

        if (!account) {
            return res.status(500).json({
                err: "user does not exist"
            });
        }

        const response = utils.constructProfileObjFromAccount(account);

        return res.status(200).json(response);
    }
    catch (err) {
        return res.status(500).json({
            err: "Server error getting profile by user Name"
        });
    }
}

CommonController.uploadImage = async function (req, res) {
    let form = new formidable.IncomingForm();
    console.log("Media form: ", form);
    form.parse(req, function (err, fields, files) {
        if (err) {
            console.log("Error handling image upload")
            console.error(err)
            return res.status(500).json({
                error: true,
                message: "Error handling image upload"
            });
        }
        let fileUploaded = files.file

        if (!fileUploaded) {
            console.log("Image not received")
            return res.status(500).json({
                error: true,
                message: "Image not received"
            });
        }

        //Get properties
        let imgName = fileUploaded.newFilename;
        let mimeType = fileUploaded.mimetype;
        console.log("imgName ", imgName)
        console.log("MIME type ", mimeType)

        let fileExtension = ""
        if (mimeType.includes("png")) {
            fileExtension = ".png"
        } else if (mimeType.includes("jpeg") || (mimeType.includes("jpg"))) {
            fileExtension = ".jpg"
        } else {
            console.log("Uploads should only work for PNGs and JPEGs");
            return res.status(400).json({
                error: true,
                message: "Image must be either PNG or JPEG"
            });
        }

        const dirName = '/home/ubuntu/CHC/Server/Images/' + imgName + fileExtension + "";

        console.log("->", dirName);

        //Copy file to image folder
        fs.copyFile(fileUploaded.filepath, dirName, (err) => {
            if (err) {
                console.error("Error copying image to new location", err)
                return res.status(500).json({
                    error: "Error copying image to new location"
                });
            }
        });
            let imageURL = "https://coffeehousecomics.com/images/fetch/" + imgName + fileExtension;

            return res.status(200).json({
                imageURL: imageURL
            });
        });
    });
}

CommonController.fetchImage = async function (req, res) {
    if (!req || !req.params || !req.params.imgName) {
        return res.status(500).json({
            error: true,
            message: "What image?"
        });
    }

    const imageName = req.params.imgName;

    console.log("Trying to get image with imageName:", imageName);

    const dirName = '/home/ubuntu/CHC/Server/Images/' + imageName + "";

    console.log("This resolved to dir path:", dirName);

    res.status(200).sendFile(dirName)
}


module.exports = CommonController;
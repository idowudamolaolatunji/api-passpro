const multer = require('multer');
const sharp = require('sharp');


//////////////////////////////////////////////////
//// MULTER STORAGE ////
//////////////////////////////////////////////////
const multerStorage = multer.memoryStorage();


//////////////////////////////////////////////////
//// MULTER FILTER ////
//////////////////////////////////////////////////
const multerFilter = (req, file, cb) => {
    try {
        if (file.mimetype.startsWith('image') || file.mimetype.startsWith('application/pdf')) {
            cb(null, true);
        } else {
            throw new Error('Not a Vaild file! Please upload only accepted files');
        }
    } catch (error) {
        cb(error, false);
    }
}


//////////////////////////////////////////////////
//// MULTER UPLOAD ////
//////////////////////////////////////////////////
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fieldSize: 1024 * 1024 * 5 }
});


//////////////////////////////////////////////////
//// MULTER UPLOAD SINGLE IMAGE ////
//////////////////////////////////////////////////
exports.uploadSinglePhoto = upload.single('image');


//////////////////////////////////////////////////
//// MULTER UPLOAD MULTIPLE IMAGEs ////
//////////////////////////////////////////////////
exports.uploadMultiplePhoto = upload.array('images', 4);


//////////////////////////////////////////////////
//// SHARP RESIZE SINGLE USER IMAGE ////
//////////////////////////////////////////////////
exports.resizeSingleUserPhoto = async function (req, _, next) {
    if(!req.file) return next();

    try {
        req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

        await sharp(req.file.buffer)
            .resize(350, 350)
            .toFormat('jpeg')
            .jpeg({ quality: 80 })
            .toFile(`public/assets/users/${req.file.filename}`);
        next();

    } catch(err) {
        next(err);
    }
};




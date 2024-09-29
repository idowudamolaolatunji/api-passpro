const User = require('../models/userModel');
const Wallet = require('../models/walletModel');

////////////////////////////////////////////////
////////////////////////////////////////////////

exports.getEveryUsersOnPassPro = async function(req, res) {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        res.status(200).json({
            status: "success",
            data: {
                count: users.length,
                users,
            }
        })
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            error: err.message
        })
    }
};

exports.getEventCreatorUsers = async function(req, res) {
    try {
        const creators = await User.find({ role: 'event-creator' }).sort({ createdAt: -1 });

        res.status(200).json({
            status: "success",
            data: {
                count: creators.length,
                creators,
            }
        })
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            error: err.message
        })
    }
};


exports.getNormalUsers = async function(req, res) {
    try {
        const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });

        res.status(200).json({
            status: "success",
            data: {
                count: users.length,
                users,
            }
        })
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            error: err.message
        })
    }
};

exports.getaUserById = async function(req, res) {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        res.status(200).json({
            status: "success",
            data: {
                user,
            }
        })
    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        })
    }
};


exports.updateUserById = async function(req, res) {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndUpdate(userId, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: "success",
            data: {
                user,
            }
        })
    } catch(err) {
        res.status(400).json({
            status: 'fail',
        })
    }
};

// ADD PROFILE IMAGES
exports.uploadProfilePicture = async function (req, res) {
    try {
        let image;
        if(req.file) image = req.file.filename;

        const updated = await User.findByIdAndUpdate(req.user._id, { image }, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            status: 'success',
            data: {
                user: updated,
            }
        });
    } catch(err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
}


exports.deleteUserById = async function(req, res) {
    try {
        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({
            status: "success",
            data: null
        })
    } catch(err) {
        res.status(404).json({
            status: 'fail',
            message: err.message,
        })
    }
};


exports.deleteAccount = async function(req, res) {
    try {
        // GET THE USER
        const currUser = await User.findById(req.user._id).select('+password');
        if(!currUser || !currUser.isActive) {
            return res.json({ message: 'User not found!' });
        }
        // CHECK IF THE PROVIDED PASSWORD IS CORRECT
        if (!(await currUser?.comparePassword(req.body.password, currUser.password))) {
            return res.json({ message: "Incorrect password " });
        }

        await User.findByIdAndUpdate(currUser._id, { isActive: false });

        res.cookie('jwt', '', {
            expires: new Date(Date.now() + 10 * 500),
            httpOnly: true
        }).clearCookie('jwt');

        return res.status(204).json({
            status: "success",
            data: null
        });

    } catch(err) {
        return res.status(400).json({
            status: "fail",
            message: err.message
        })
    }
};
  


////////////////////////////////////////////////////
// update current user data

exports.updateMe = async function (req, res) {
    try {
        console.log(req.user._id)
        // create an error if user POST's password data.
        if(req.body.password || req.body.passwordConfirm) {
            return res.json({ messahe: 'This route is not for password updates. Please use /update-Password.'});
        }
        
        // // 1. filter
        const { email, isActive, role , isOTPVerified, password, passwordConfirm, slug, passwordChangedAt, otpCode, otpExpiresIn, passwordResetToken, passwordResetExpires } = req.body

        if(email || isActive || role  || isOTPVerified || password || passwordConfirm || slug || passwordChangedAt || otpCode || otpExpiresIn || passwordResetToken || passwordResetExpires) {
            return res.status(403).json({
                message: 'You are unauthorised to perform this action!'
            })
        }

        // 2. update
        const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: "success",
            message: 'Profile Updated!',
            data: { user: updatedUser }
        })

    } catch(err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
}
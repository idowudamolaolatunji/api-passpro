const crypto = require('crypto');

const User = require('../models/userModel');
const Wallet = require('../models/walletModel');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////

const sendEmail = require('../utils/sendEmail');
const otpEmail = require('../emails/emailTemplates/otpEmail');
const passwordResetEmail = require('../emails/emailTemplates/passwordResetEmail');
const welcomeEmail = require('../emails/emailTemplates/welcomeEmail');

// GENERATE OTP
const generateOtp = () => {
    return Math.floor(1000 + Math.random() * 9000);
};


/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
exports.signUpUser = async function (req, res) {
    try {
        const { email, name, telephoneNumber, password, passwordConfirm, role, businessName, address } = req.body;

        const emailExist = await User.findOne({ email });
        const AcctExistAndUnverified = await User.findOne({ email, isOTPVerified: false })
        if (AcctExistAndUnverified) return res.json({ message: "Email Already Exists and Unverified!" });
        if (emailExist) return res.json({ message: "Email already exist!" });

        const otpCode = generateOtp();
        const emailOtp = otpEmail(otpCode);
        const newUser = await User.create({
            name,
            businessName,
            address,
            telephoneNumber,
            email,
            password,
            passwordConfirm,
            role,
            otpCode
        });

        await Wallet.create({
            user: newUser._id,
            balance: 0,
        });

        res.status(201).json({
            status: "success",
            message: "Signup Successful!",
            data: {
                user: newUser
            }
        });

        await sendEmail({
            email: newUser.email,
            subject: "Passpro OTP Verification Code",
            message: emailOtp
        });

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
}



exports.loginUser = async function (req, res) {
    try {

        const { email, password } = req.body;
		const user = await User.findOne({ email }).select("+password");

		// SOME USER CHECKINGS
		if (!user || !user.email) {
			return res.json({ message: "Account does not exist" });
		}
		if (!user?.isActive) {
			return res.json({ message: "Account no longer active" });
		}
		if (!user?.email || !(await user.comparePassword(password, user?.password))) {
			return res.json({ message: "Incorrect email or password " });
		}
		if (!user.isOtpVerified) {
			return res.json({ message: "Not Verified!" });
		}
		user.pushToken = req.body.pushToken;
		user.save({ validateBeforeSave: false });

		// CREATING AND SETTING TOKEN
		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_TOKEN, {
			expiresIn: process.env.JWT_EXPIRES_IN,
		});

		res.status(200).json({
			status: "success",
			message: "Login Successful!",
			data: {
				user,
			},
			token,
		});

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
}



exports.requestOtp = async function (req, res) {
    try {
        const { email } = req.body;
        const requestingUser = await User.findOne({ email });
        if (!requestingUser || !requestingUser.isActive) return res.json({ message: "You are not a valid user" });

        // SOME CHECKINGS
        if (requestingUser.isOtpVerified) {
            return res.json({ message: "You are already a verified user" });
        };

        const { isOTPExpired, remainingSec } = requestingUser.isOTPExpired();
        if (!isOTPExpired) {
            return res.json({ message: `OTP not yet expired, Remains ${remainingSec} seconds left` });
        }

        // GENRATE OTP
        const newOtp = generateOtp();
        const emailOtp = otpEmail(newOtp)
        requestingUser.otpCode = newOtp;
        await requestingUser.save({ validateBeforeSave: false });
        console.log(requestingUser)

        res.status(200).json({
            status: 'success',
            message: 'Passpro OTP Verification Code Resent!',
            data: {
                verifyingUser: requestingUser
            }
        })

        // SEND OTP TO THE USER EMAIL
        return await sendEmail({
            email: requestingUser.email,
            subject: "Passpro OTP Verification Code Resent!",
            message: emailOtp,
        });

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
}


exports.verifyOtp = async function (req, res) {
    try {

        const { email, otp } = req.body;

        console.log()

        // CHECK IF USER TRULY EXIST
        const user = await User.findOne({ email }).select('+otpCode');
        console.log(user)
        if (!user || !user.isActive) {
            return res.json({ message: "Invalid User or User no longer exist!" });
        }

        // CHECK IF OTP HAS EXPIRED (ONLY VALID FOR 3 MINUTES)
        if (user.isOTPExpired().result) {
            return res.json({ message: "OTP expired. Please request a new one." });
        }

        // NOW CHECK IF OTP IS CORRECT
        if (user?.otpCode !== Number(otp)) {
            return res.json({ message: "Invalid OTP Code, Try again!" });
        }

        // UPDATE THE USER AND GRANT ACCESS
        user.isOtpVerified = true;
        user.otpCode = undefined;
        await user.save({ validateBeforeSave: false });

        // CREATING AND SETTING TOKEN
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_TOKEN, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        
        const firstName = user.name.split(' ')[0].charAt(0).toUpperCase() + user.name.split(' ')[0].slice(1);
        const emailWelcome = welcomeEmail(firstName);


        res.status(200).json({
            status: "success",
            message: "OTP Verified",
            data: {
                user,
            },
            token,
        });

        await sendEmail({
            email: user.email,
            subject: 'Welcome to PassPro',
            message: emailWelcome
        });

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
}



exports.forgotPassword = async function (req, res) {
    try {
        const { email } = req.body;

        // 1) Get user based on POSTed email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "There is no user with email address" });
        }

        // 2) Generate the random reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });


        // 3) Send it to user's email

        // const resetURL = `https://www.passpro.com/reset-password/${resetToken}`;
        // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

        const resetEmail = passwordResetEmail(resetToken);

        await sendEmail({
            email: user.email,
            subject: 'Passpro password reset token (valid for 10 min)',
            message: resetEmail
        });

        // user.passwordResetToken = undefined;
        // user.passwordResetEpires = undefined;
        // await user.save({ validateBeforeSave: false });

        res.status(200).json({
            status: "success",
            message: "Token Email successfully sent to email!",
            data: {
                user
            }
        });

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
}


exports.resetPassord = async function (req, res) {
    try {

        const { password, passwordConfirm } = req.body;

        // get user based on token
        const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        }).select('password passwordResetToken passwordResetExpires');
        console.log(user);

        // if token has not expired, there is a user, set new password
        if (!user) return res.status(404).json({ message: "Token is invalid or has expired" });
        const comparedPassword = await user.comparePassword(password, user.password);
        if(comparedPassword) return res.json({
            message: 'Previous password and new password cannot be the same',
        });
        
        user.password = password;
        user.passwordConfirm = passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // update changedPasswordAt for the user
        // done in userModel on the user schema

        return res.status(200).json({
            status: "success",
            message: "Password reset successful",
            data: {
                user,
            }
        });

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
}


exports.updatePassword = async function (req, res) {
    try {

        const { passwordCurrent, password, passwordConfirm } = req.body;
        // get user
		const user = await User.findById(req.user._id).select("+password");

		// check if POSTED current password is correct
        const comparedPassword = await user.comparePassword(passwordCurrent, user.password)
		if (!comparedPassword) {
            return res.json({ message: "Your current password is wrong." });
		}
        
        // check if current password is the same as new password
        const comparedPasswordWithCurrent = await user.comparePassword(password, user.password)
		if (comparedPasswordWithCurrent) {
			return res.json({ message: "Previous password and new password cannot be the same." });
		}

		// if so, update user password
		user.password = password;
		user.passwordConfirm = passwordConfirm;
		await user.save({ validateModifiedOnly: true });
		// User.findByIdAndUpdate, will not work here...

		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_TOKEN, {
			expiresIn: process.env.JWT_EXPIRES_IN,
		});

		return res.status(201).json({
			status: "success",
            message: 'Password Changed Successful!',
			data: {
                user,
			},
            token,
		});

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
}


exports.logoutUser = async function (req, res) {
    res.clearCookie("jwt");
    res.status(200).json({ status: "success" });
}


exports.createAdmin = async function (req, res) {
    try {

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
}


exports.loginAdmin = async function (req, res) {
    try {

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
}
const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');
const bcrypt = require('bcrypt');
const moment = require('moment');


//////////////////////////////////////////////
//// SCHEMA CONFIGURATION  ////
//////////////////////////////////////////////
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        lowercase: true,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        validate: [validator.isEmail, "Enter a valid email"],
        lowercase: true,
        required: true,
    },
    password: {
        type:String,
        required: true,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: true,
        validate: {
            validator: function(el) {
                return el === this.password;
            },
            message: 'Password are not the same!',
        }
    },
    image: String,
    role: {
        type: String,
        enum: ["user", "event-creator"],
        default: "user"
    },
    businessName: {
        type: String,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    slug: String,
    isOtpVerified: {
        type: Boolean,
        default: false
    },
    country: String,
    phoneNumber: String,
    address: String,
    passwordChangedAt: Date,
    otpExpiresIn: Date,
    otpCode: { type: Number, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
}, {
    timestamps: true,
});


//////////////////////////////////////////////
//// SCHEMA MIDDLEWARES ////
//////////////////////////////////////////////
const saltRound = 12;
userSchema.pre('save', async function(next) {
    // CHECK IF PASSWORD IS ALREADY MODIFIED
    if(!this.isModified('password')) return next();

    // IF NOT HASH THE PASSWORD
    const hashedPassword = await bcrypt.hash(this.password, saltRound);
    this.password = hashedPassword;
    this.passwordConfirm = undefined

    next();
});

userSchema.pre("save", async function (next) {
	if (this.isModified("password") || this.isNew) return next();
	this.passwordChangedAt = Date.now() - 100;
	next();
});

userSchema.pre("save", function (next) {
    if(this.isNew) {
        // CREATING USER SLUG
        const slug = slugify(this.name.split(' ')[0], { lower: true });
        this.slug = `${slug}-${this._id}`;
    }
	next();
});

userSchema.pre("save", function (next) {
	this.otpExpiresIn = Date.now() + 2 * 60 * 1000;
	next();
});

userSchema.methods.isOTPExpired = function () {
    // MODIFIED VERSION SIR
	if (this.otpCode || this.otpExpiresIn) {
        const currentTime = new Date(Date.now());
        const ExpiresTime = new Date(this.otpExpiresIn);
        console.log(currentTime, ExpiresTime);

        const remainingSec = Number((ExpiresTime - currentTime) / 1000).toFixed(0);
		return { isOTPExpired: currentTime > ExpiresTime, remainingSec };
	}
	return false;
};


//////////////////////////////////////////////
//// INSTANCE METHODS ////
//////////////////////////////////////////////
userSchema.methods.changedPasswordAfter = function (jwtTimeStamp) {
	if (this.passwordChangedAt) {
		const changeTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
		return jwtTimeStamp < changeTimeStamp;
	}
	// return false means not changed
	return false;
};

userSchema.methods.comparePassword = async function (candidatePassword, hashedPassword) {
	const encrypted = await bcrypt.compare(candidatePassword, hashedPassword);
	return encrypted;
};

userSchema.methods.createPasswordResetToken = function () {
	// create random bytes token
	const resetToken = crypto.randomBytes(32).toString("hex");

	// simple hash random bytes token
	const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
	this.passwordResetToken = hashedToken;

	// create time limit for token to expire (10 mins)
	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    console.log(resetToken, hashedToken, Date.now() + 10 * 60 * 1000)

	return resetToken;
	// send the unencrypted version
};


//////////////////////////////////////////////
//// MODEL AND COLLECTION ////
//////////////////////////////////////////////
const User = mongoose.model('User', userSchema);
module.exports = User;
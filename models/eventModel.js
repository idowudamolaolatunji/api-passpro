const mongoose = require('mongoose');
const { default: slugify } = require('slugify');

const eventSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name:  {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    images: [String],
    slug: String,
    category: {
        type: String,
        required: true
    },
    details: {
        venue: {
            type: String,
            required: true
        },
        date: {
            // type: Date,
            type: String,
            require: true,
        },
        time: String,
    }
}, {
    timestamps: true,
});


eventSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'creator',
        select: '_id name email'
    });

    next();
});

eventSchema.pre('save', function(next) {
    const slug = slugify(this.name.toString().split(' ').slice(0, 2).join(' '), { lower: true, replacement: '-' });
    this.slug = `${slug}-${this._id.toString().slice(0, 4)}`;

    next();
});

const Event = mongoose.model("Event", eventSchema);
module.exports = Event;
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['read', 'unread'],
        default: 'unread',
    }
});



notificationSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: '_id email image'
    });

    next();
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
    },
    amount: {
        type: Number,
        required: true
    },
    reference: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['success', 'pending', 'failed'],
        default: 'success'
    },
    purpose: {
        type: String,
        enum: ['deposit', 'withdrawal','order'],
        default: 'deposit',
        required: true
    },
    paidAt: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true,
});


transactionSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: '_id email image fullName',
    });
    next();
});


const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    ticketType: {
        type: String,
        required: true,
    },
    orderId: Number,
    buyer: {
        type: mongoose.Schema.Types.Mixed,
        ...(typeof this.buyer !== 'string' && { ref: 'User' }),
        required: true
    },
    ordedAt: {
        type: Date,
        default: Date.now,
    }
});


const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
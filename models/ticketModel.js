const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    ticketName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    price: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true
});

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Event = require('../models/eventModel');
const Ticket = require('../models/ticketModel');
const Transaction = require('../models/transactionModel');

const { getResponsedata } = require('../utils/helpers');
const Wallet = require('../models/walletModel');


exports.purchaseTicketWithPaystack = async function(req, res) {
    try {
        const { reference, charges } = req.params;
        const { ticketId, userId } = req.body;
        
        // GET THE RESPONSE DATA
        const { amount, status, paidAt } = await getResponsedata(reference, charges);

        // HANDLE PAYMENT VERIFICATION ERROR
        if (status !== 200) {
            return res.status(400).json({ status: 'fail', message: 'Unable to verify payment' });
        }

        const { order } = await handleTheDirtyJob(userId, ticketId, 'card', amount, reference, paidAt)
        
        res.status(200).json({
            status: 'success',
            message: 'Payment successful',
            data: {
                ticketOrder: order
            }
        });

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


async function handleTheDirtyJob(reqUserId, ticketId, payType, amount, reference, paidAt) {
    // Find the User, Ticket, event, event creator and then create the order
    const user = await User.findById(reqUserId);
    const ticket = await Ticket.findById(ticketId);
    console.log('H1 2')
    const event = await Event.findById(ticket.event);
    const creator = await User.findById(event.creator);
    console.log('H1 3')
    const creatorWallet = await Wallet.findById(creator._id);
    const orderId = Math.trunc(Math.random() * 100000000000) + 1;
    console.log('H1 4')

    if(payType === 'wallet') {
        const userWallet = await Wallet.findById(user._id);

        if(userWallet.balance < amount) return res.json({ message: 'Insufficient funds in the wallet' });
        
        // DEDUCT MONEY FROM BUYER
        userWallet.balance -= amount;
        await userWallet.save({});
    }

    const order = await Order.create({
        creator: creator._id,
        event: event._id,
        ticketType: ticket.ticketName,
        orderId,
        buyer: user._id || 'Annoymous',
    });

    // DECREASE THE TICKET QUANTITY AND CREDIT THE SELLER
    ticket.quantity -= 1;
    await ticket.save({});

    creatorWallet.balance += amount;
    await creatorWallet.save({});

    // CREATE TRANSACTIONS
    if(user) {
        await Transaction.create({
            user: user._id,
            amount, reference,
            purpose: 'order',
            ...paidAt && paidAt,
        });
    }
    
    await Transaction.create({
        user: creator._id,
        amount, reference,
        purpose: 'order',
        ...paidAt && paidAt,
    });

    return order
}


exports.purchaseTicketWithWalletBalance = async (req, res) => {
    try {
        const { ticketId, amount } = req.body;
        const reference = Date.now()

        const { order } = await handleTheDirtyJob(req.user._id, ticketId, 'wallet', amount, reference)

        res.status(200).json({
            status: 'success',
            message: 'Payment successful',
            data: {
                order
            }
        });
    } catch (err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
}


exports.getAllPurchases = async(req, res) => {
    try {
        const orders = await Order.find();

        res.status(200).json({
            status: 'success',
            count: orders.length,
            data: {
                orders
            }
        })

    } catch(err) {
        return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
    }
}

// GET MY ORDERS
exports.getMyOrdersHistory = async(req, res) => {
    try {
        const orders = await Order.find({ creator: req.user._id }).sort({ updatedAt: -1 });

        res.status(200).json({
            status: 'success',
            count: orders.length,
            data: {
                orders
            }
        });

    } catch(err) {
        return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
    }
}
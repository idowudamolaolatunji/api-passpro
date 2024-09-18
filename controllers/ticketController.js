const Event = require('../models/eventModel');
const Ticket = require('../models/ticketModel');

exports.createTicket = async function(req, res) {
    try {
        const { ticketName, quantity, price } = req.body;
        const { eventId } = req.params;

		console.log('Hi1');
		
        const event = await Event.findById(eventId);
        if(!event) return res.json({ message: 'No event with this Id' });
		
		console.log('Hi2');
        const newTicket = await Ticket.create({
			event: eventId,
            ticketName,
            quantity,
            price,
        });
		console.log('Hi3');

        res.status(200).json({
            status: 'success',
            message: `${quantity} ${ticketName} tickets created!`,
            data: {
                event,
                ticket: newTicket,
            }
        })

    } catch(err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
}


exports.getAllTicketByEvent = async function(req, res) {
    try {

        const { eventId } = req.params;
        const tickets = await Ticket.find({ event: eventId }).sort({ createdAt: -1 });

        if(!tickets || tickets.length < 0) return res.json({ message: 'No tickets with this event yet!' });

		res.status(200).json({
			status: 'success',
			count: tickets.length,
			data: {
				tickets
			}
		});

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


exports.getAllTickets = async function(req, res) {
	try {

		const tickets = await Ticket.find().sort({ createdAt: -1 });

		res.status(200).json({
			status: 'success',
			count: tickets.length,
			data: {
				tickets
			}
		});

	} catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


exports.getTicketById = async function(req, res) {
    try {
        const { ticketId } = req.params;
        const ticket = await Ticket.findById(ticketId);

		res.status(200).json({
			status: 'success',
			data: {
				ticket
			}
		});

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}



exports.updateTicketById = async function(req, res) {
    try {
        const { ticketId } = req.params;
        const ticket = await Ticket.findOneAndUpdate(
			{ _id: ticketId }, req.body, { runValidators: true, new: true }
		);

		res.status(200).json({
			status: 'success',
			message: 'Ticket update successful!',
			data: {
				ticket
			}
		});

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


exports.deleteTicketById = async function(req, res) {
    try {
        const { ticketId } = req.params;

		const ticket = await Ticket.findOne({ _id: ticketId });
		if(!ticket) return res.json({ message: 'No ticket found' });
        await Ticket.findByIdAndDelete(ticket._id);

		res.status(200).json({
			status: 'success',
			message: 'Ticket deleted successfully',
			data: null
		});

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}
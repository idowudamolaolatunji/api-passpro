const sharp = require('sharp');
const EventCategory = require('../models/eventCategoryModel');
const Event = require('../models/eventModel');
const Notification = require('../models/NotificationModel');
// const { io } = require('../utils/socket');


exports.createEventCategory = async function (req, res) {
    try {
        const { name } = req.body;
        const category = await EventCategory.create({ name });

        res.status(201).json({
            status: 'success',
            message: `${name} category created!`,
            data: {
                category
            }
        });

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
}


exports.getAllCategories = async function(req, res) {
    try {
        const categories = await EventCategory.find();
        res.status(200).json({
            status: 'success',
            count: categories.length,
            data: {
                categories
            }
        });

    } catch (err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


exports.createEvent = async function (req, res) {
    try {

        const { name, description, category, venue, date, time } = req.body;

        const newEvent = await Event.create({
            creator: req.user._id,
            name,
            description,
            category,
            details: {
                venue,
                date,
                time
            }
        });

        await EventCategory.findOneAndUpdate(
			{ name: req.body.category },
			{ $inc: { eventCounts: 1 } },
			{ runValidators: true, new: true }
		);

		await Notification.create({
			user: req.user._id,
			title: 'New Event Created',
			content: `You just created a new event for ${newEvent.name}, commencing on the ${newEvent.details.date}`,
		})

        res.status(201).json({
            status: 'success',
            message: `Event created!`,
            data: {
                event: newEvent,
            }
        });

    } catch (err) {
        return res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


exports.uploadEventImages = async function (req, res) {
    try {
		const { eventId } = req.params
        const event = await Event.findById(eventId);
		if(!event) return res.json({
			message: 'Cannot find event'
		});

		const images = [];
		if (req?.files && Array.isArray(req.files)) {
			for (const image of req.files) {
                const index = req.files.indexOf(image);
				const fileName = `event-${event._id}-${Date.now()}-${index + 1}.jpeg`
				await sharp(image.buffer)
					.resize(750, 750)
					.toFormat('jpeg')
					.jpeg({ quality: 80 })
					.toFile(`public/assets/events/${fileName}`)
				;
				images.push(fileName);
			}
		}

		event.images = images;
		await event.save({});

        res.status(200).json({
            status: 'success',
			message: `Image${images.length > 1 ? 's' : ''} upload successful`,
            data: {
                images: event.images
            }
        });

    } catch(err) {
		return res.status(400).json({
            status: 'fail',
			message: err.message
        });
    }
}



exports.getAllEvents = async function(req, res) {
	try {
		const events = await Event.find({}).sort({ createdAt: -1 });
		
		res.status(200).json({
			status: 'success',
			count: events.length,
			data: {
				events
			}
		});

	} catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


exports.getEventById = async function(req, res) {
    try {
        const { eventId } = req.params;
        const event = await Event.findById(eventId);

		res.status(200).json({
			status: 'success',
			data: {
				event
			}
		});

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}

exports.getEventBySlug = async function(req, res) {
    try {
        const { eventSlug } = req.params;
        const event = await Event.findOne({ slug: eventSlug });

		res.status(200).json({
			status: 'success',
			data: {
				event
			}
		});

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


exports.getEventsByCategorySlug = async function(req, res) {
    try {
        const { categorySlug } = req.params;
		const category = await EventCategory.findOne({ slug: categorySlug });
        const events = await Event.find({ category: category.name }).sort({ createdAt: -1 });

		res.status(200).json({
            status: 'success',
            count: events.length,
			data: {
				events
			}
		});

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


exports.allEventsBycreatorId = async function(req, res) {
    try {
        const { creatorId } = req.params; 
        const events = await Event.find({ creator: creatorId }).sort({ createdAt: -1 });

        if(!events || events.length < 1) {
            return res.json({
                message: 'No Events by this creator'
            });
        }

        res.status(200).json({
			status: 'success',
			count: events.length,
			data: {
				events
			}
		});

    }catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


exports.allMyCreatedEvents = async function(req, res) {
	try {
		const events = await Event.find({ creator: req.user._id }).sort({ createdAt: -1 });
        
        if(!events || events.length < 1) {
            return res.json({
                message: 'You have no event'
            });
        }

		res.status(200).json({
			status: 'success',
			count: events.length,
			data: {
				events
			}
		});

	} catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


exports.updateEventById = async function(req, res) {
    try {
        const { venue, date, time } = req.body;
        const { eventId } = req.params;
        const event = await Event.findOneAndUpdate(
			{ _id: eventId }, {...req.body, details: { venue, date, time }}, { runValidators: true, new: true }
		);

		await Notification.create({
			user: req.user._id,
			title: 'Event Updated',
			content: `You Updated the "${event.name}" event`,
		})

		res.status(200).json({
			status: 'success',
			message: 'Event update successful!',
			data: {
				event
			}
		});

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}


exports.deleteEventById = async function(req, res) {
    try {
        const { eventId } = req.params;

		const event = await Event.findOne({ _id: eventId })
		if(!event) return res.json({ message: 'No event found' });
        await Event.findByIdAndDelete(event._id);

		await EventCategory.findOneAndUpdate(
			{ name: event.category },
			{ $inc: { eventCounts: -1 } },
			{ runValidators: true, new: true }
		);

		await Notification.create({
			user: req.user._id,
			title: 'Event Deleted',
			content: `You Deleted the "${event.name}" event`,
		});

		res.status(200).json({
			status: 'success',
			message: 'Event deleted successfully',
			data: null
		});

    } catch(err) {
		return res.status(400).json({
			status: 'fail',
			message: err.message,
		});
	}
}
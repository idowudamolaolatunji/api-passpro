
const express = require('express');
const eventController = require('../controllers/eventController');
const { authProtectedUser } = require('../middlewares/protected');
const { uploadMultiplePhoto } = require('../middlewares/multer');

const router = express.Router();

// EVENTS AND EVENT DOCUMENTS
router.post('/create-event', authProtectedUser, eventController.createEvent);
router.post('/upload-event-images/:eventId', uploadMultiplePhoto, eventController.uploadEventImages);

router.get('/get-events', eventController.getAllEvents);
router.get('/get-event/id/:eventId', eventController.getEventById);
router.get('/get-event/slug/:eventSlug', eventController.getEventBySlug);

router.get('/creator-events/:creatorId', eventController.allEventsBycreatorId);
router.get('/get-events-in-category/:categorySlug', eventController.getEventsByCategorySlug);

router.get('/my-events', authProtectedUser, eventController.allMyCreatedEvents);
router.patch('/update-event/:eventId', authProtectedUser, eventController.updateEventById);
router.delete('/delete-event/:eventId', authProtectedUser, eventController.deleteEventById);

// EVENT CATEGORY AND CATEGORY DOCUMENTS
router.post('/create-category', eventController.createEventCategory);
router.get('/get-categories', eventController.getAllCategories);


module.exports = router;
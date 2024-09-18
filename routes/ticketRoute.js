
const express = require('express');

const ticketController = require('../controllers/ticketController');
const { authProtectedUser } = require('../middlewares/protected');

const router = express.Router();

router.post('/create-ticket/:eventId', authProtectedUser, ticketController.createTicket);
router.get('/get-event-tickets/:eventId', ticketController.getAllTicketByEvent);

router.get('/get-ticket/:ticketId', ticketController.getTicketById);


module.exports = router;

const express = require('express');

const {
    purchaseTicketWithPaystack, 
    purchaseTicketWithWalletBalance 
} = require('../controllers/orderController');

const { authProtectedUser } = require('../middlewares/protected');

const router = express.Router();

router.post(
    '/purchase-ticket/card/:reference/:charges/:ticketId', 
    authProtectedUser, 
    purchaseTicketWithPaystack
);

router.post(
    '/purchase-ticket/wallet/:ticketId', 
    authProtectedUser, 
    purchaseTicketWithWalletBalance
);




module.exports = router;
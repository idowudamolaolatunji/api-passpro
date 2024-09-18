
const express = require('express');
const authController = require('../controllers/authController');
const { authProtectedUser } = require('../middlewares/protected');

const router = express.Router();

router.post('/signup', authController.signUpUser);
router.post('/login', authController.loginUser);

router.post('/request-otp', authController.requestOtp);
router.post('/verify-otp', authController.verifyOtp);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassord);

router.post('/update-password', authProtectedUser, authController.updatePassword);

router.post('/logout', authController.logoutUser);

module.exports = router;
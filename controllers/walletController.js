const User = require("../models/userModel");
const Wallet = require("../models/walletModel");
const { formatNumber } = require("../utils/helpers");



// GET USER WALLET 
exports.getWallet = async (req, res) => {
	try {
		const wallet = await Wallet.findOne({ user: req.user._id });

		res.status(200).json({
			status: "success",
			data: {
				wallet,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

//  CREATE WALLET DEPOSITS
exports.walletDeposit = async (req, res) => {
	try {
		const { reference, charges } = req.params;

		// FIND THE CURRENT USER
		const user = await User.findById(req.user._id);
		if (!user) {
			return res.json({
				message: "User Not Found!",
			});
		}

		// GET THE RESPONSE DATA
        const { amount, status, paidAt } = await getResponsedata(reference, charges);

        // HANDLE PAYMENT VERIFICATION ERROR
        if (status !== 200) {
            return res.status(400).json({ status: 'fail', message: 'Unable to verify payment' });
        }

		// UPDATE THE USER WALLET BALANCE
		const userWallet = await Wallet.findOne({ user: user._id });
		userWallet.walletBalance += amount;
		await userWallet.save({});

		// CREATE TRANSACTION DOCUMENT
		const newDeposit = await Transaction.create({
			user: user.id,
			amount, reference,
			purpose: "deposit",
		});

		await Notification.create({
			user: user.id,
			title: 'New Deposit',
			content: `A deposit of ₦${formatNumber(amount)} was made!`
		});

		res.status(200).json({
			status: "success",
			message: `Deposit Successful!`,
			data: { transaction: newDeposit },
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};




exports.walletWithdrawalRequest = async (req, res) => {
	try {
		const { amount, password } = req.body;
		const reference = Date.now()

		const user = await User.findById(req.user._id).select('+password');
        if(!user || !user.isActive) return res.json({ message: 'User not found!' });

        // 0. CHECK IF THE PROVIDED PASSWORD IS CORRECT
		const comparedPassword = await user.comparePassword(password, user.password)
        if (!comparedPassword) {
            return res.json({ message: "Incorrect password " });
        }

        // 1. IF WALLET BALANCE IS LESS THAN THE REQUESTING AMOUNT
		const userWallet = await Wallet.findOne({ user: user._id });
        if(userWallet.balance < amount) {
            return res.json({ message: 'Insufficient balance to complete request!' });
        }
        
        // 2. IF THE REQUESTING AMOUNT IS LESS THAN THE SET MINIMUM WITHDRAWAL AMOUNT
        const minimumAmount = 1000;
        if(amount < minimumAmount) {
            return res.json({ message: 'Minimum Withdrawal is ₦1,000' });
        };

        // 3. DEBIT AND UPDATE THE WALLET BALANCE 
		userWallet.balance -= amount;
		await userWallet.save({});

		const withdrawalRequest = await Transaction.create({
			user: user.id,
			amount, reference,
			status: "pending",
			purpose: "withdrawal",
		});

		const newNotification = await Notification.create({
			user: user.id,
			title: 'New Withdrawal',
			content: `A withdrawal of ₦${formatNumber(amount)} was made!`
		});

		res.status(200).json({
			status: 'success',
			message: 'Request successful, might take up to 24hrs',
			data: { transaction: withdrawalRequest }
		});

	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
}
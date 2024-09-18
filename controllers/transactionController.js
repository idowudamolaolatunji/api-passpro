const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");
const { formatNumber } = require("../utils/helpers");


// GET ALL TRANSACTION
exports.allTransactions = async (req, res) => {
	try {
		const transactions = await Transaction.find().sort({ createdAt: -1 });

		res.status(200).json({
			status: "success",
			count: transactions.length,
			data: {
				transactions,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};


exports.approvalWithdrawalRequest = async (req, res) => {
	try {
        const { transactionId } = req.params;
        const { password } = req.body;
		// CONFIRM THAT ADMIN ACCESS TO PERFORM TASK
        // const admin = await Admin.findById(req.user._id).select('+password');
        // if(!(await admin.comparePassword(password, admin.password))) {
		// 	return res.json({ message: "Incorrect password" });
		// }		

		// CHECKING IF THE REQUEST IS STILL PENDING FOR APPROVAL
        const withdrawalRequest = await Transaction.findById(transactionId);
        if(!withdrawalRequest) {
            return res.json({
                message: 'Withdrawal has either been processed, or cannot be found!'
            });
        }
        const user = await User.findById(withdrawalRequest.user._id);

        withdrawalRequest.status = 'success';
        await withdrawalRequest.save({});

		await Notification.create({
			user: user.id,
			title: 'New Approved Withdrawal',
			content: `A withdrawal of ₦${formatNumber(withdrawalRequest.amount)} is being sent to your bank!`
		});

        res.status(200).json({
            status: 'success',
            message: 'Withdrawal successful',
			data: { transaction: withdrawalRequest }
        });

	} catch(err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
}


// GET ALL MY TRANSACTIONS
exports.allMyTransactions = async (req, res) => {
	try {
		const myTransactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(80);

		res.status(200).json({
			status: "success",
			count: myTransactions.length,
			data: {
				myTransactions,
			},
		});
	} catch (err) {
		return res.status(400).json({
			status: "fail",
			message: err.message,
		});
	}
};

const verifyPayment = require("./verifyPayment");

exports.getResponsedata = async function(reference, charges) {
    const paymentVerification = await verifyPayment(reference);
    const response = paymentVerification.data.data;
    
    const amount = (Number(response.amount) / 100) - charges;
    const status = paymentVerification.status;
    const paidAt = response.paidAt;
    return { amount, status, paidAt };
}


exports.formatNumber = function(amount) {
	return Number(amount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
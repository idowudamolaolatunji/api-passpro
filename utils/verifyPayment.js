const axios = require('axios');

const verifyPayment = async(reference) => {
    try {
        const headers = {
            'Authorization': 'Bearer ' + process.env.PAYSTACK_SECRET_KEY,
        };
        const check = axios.get(`https://api.paystack.co/transaction/verify/${reference}`, { headers });
        const response = await check;

        if (response.data.data.status !== "success") {
            res.status(400).json({
                message: "Unable to Verify Payment"
            });
        }
        return response;
    } catch(err) {
        return err;
    }
}

module.exports = verifyPayment;
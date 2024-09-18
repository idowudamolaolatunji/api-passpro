const path = require('path');

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");

//////////////////////////////////////////////
//////////////////////////////////////////////
const app = express();
const userRouter = require('./routes/userRoute');
const eventRouter = require('./routes/eventRoute');
const ticketRouter = require('./routes/ticketRoute');
const orderRouter = require('./routes/orderRoute');
//////////////////////////////////////////////
//////////////////////////////////////////////


//////////////////////////////////////////////
//// MIDDLEWARES ////
//////////////////////////////////////////////

// MORGAN REQUEST MIDDLEWARE
app.use(morgan("dev"));

// EXPRESS BODY PARSER
app.use(express.json({ limit: "10mb" }));

// COOKIE PARSER
app.use(cookieParser());

// CORS
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://passpro.africa", "https://app.passpro.africa"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// REQUEST MIDDLEWARE
app.use(function (_, _, next) {
	console.log("Fetching Data..");
	next();
});

// STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

//////////////////////////////////////////////
//// MOUNTING ROUTES ////
//////////////////////////////////////////////
app.use('/api/users', userRouter);
app.use('/api/events', eventRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api/orders', orderRouter);


module.exports = app;
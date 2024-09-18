const http = require('http');

const mongoose = require('mongoose');
const dotenv = require('dotenv');


//////////////////////////////////////////////
//// ENVIROMENT CONFIGURATION ////
//////////////////////////////////////////////
const app = require('./app'); 
dotenv.config({ path: './config.env' });

const server = http.createServer(app);

//////////////////////////////////////////////
//// DATABASE CONFIGURATION ////
//////////////////////////////////////////////
const PORT = process.env.PORT || 2300; 
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);


async function connectDB() {
    try {
        await mongoose.connect(DB);
        console.log('Database connected successfully!');
    } catch(err) {
        console.log(err.message)
    }
}
connectDB();


//////////////////////////////////////////////
//// SERVER CONFIGURATION ////
//////////////////////////////////////////////
server.listen(PORT, 'localhost', function() {
    console.log(`Server running on port ${PORT}...`);
});

module.exports = server;
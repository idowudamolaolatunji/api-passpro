const socket = require('socket.io');
const server = require('../server');

// const { Server } = require('socket.io');
// const io = new Server(server, { cors: { }});

exports.io = socket(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174", "https://passpro.africa", "https://app.passpro.africa"],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }
});
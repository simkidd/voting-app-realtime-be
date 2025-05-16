"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const environments_1 = require("../utils/environments");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const prodOrigins = [
    "http://localhost:3000",
    "https://voting-app-realtime-fe.vercel.app",
];
const devOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
];
const { NODE_ENV } = environments_1.env;
let origin;
if (NODE_ENV === "production") {
    origin = prodOrigins;
}
else if (NODE_ENV === "development") {
    origin = [...prodOrigins, ...devOrigins];
}
else {
    origin = true;
}
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin,
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    io.use(auth_middleware_1.authenticateSocket);
    io.on("connection", (socket) => {
        console.log(`User ${socket.data.id} connected`);
        socket.on("subscribe", (positionId) => {
            socket.join(`position-${positionId}`);
            console.log(`User subscribed to position ${positionId}`);
        });
        socket.on("unsubscribe", (positionId) => {
            socket.leave(`position-${positionId}`);
            console.log(`User unsubscribed from position ${positionId}`);
        });
        socket.on("disconnect", (reason) => {
            console.log(`User ${socket.data.id} disconnected: ${reason}`);
        });
        socket.on("error", (err) => {
            console.error(`Socket error for user ${socket.data.id}:`, err);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io)
        throw new Error("Socket.io not initialized");
    return io;
};
exports.getIO = getIO;

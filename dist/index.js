"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const socket_1 = require("./config/socket");
const db_1 = __importDefault(require("./config/db"));
const environments_1 = require("./utils/environments");
const { PORT } = environments_1.env;
const server = http_1.default.createServer(app_1.default);
// Initialize Socket.io
(0, socket_1.initSocket)(server);
// Start server
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, db_1.default)();
        server.listen(PORT, () => console.log(`
        🚀 Server is running!
        🔗 http://localhost:${PORT}
        📡 Environment: ${environments_1.env.NODE_ENV}
        🕒 ${new Date().toLocaleString()}
      `));
        // Graceful shutdown
        process.on("SIGTERM", () => {
            console.log("SIGTERM received. Shutting down gracefully...");
            server.close(() => {
                console.log("💥 Process terminated");
                process.exit(0);
            });
        });
    }
    catch (error) {
        console.log(error);
        process.exit(1);
    }
});
startServer();

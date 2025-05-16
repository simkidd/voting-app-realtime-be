"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const environments_1 = require("./utils/environments");
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
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
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin,
    credentials: true,
}));
// Body parsers
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// import routes
app.use("/api/v1", routes_1.default);
// Health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy" });
});
// Handle 404
app.use(error_middleware_1.notFoundHandler);
// Error handler
app.use(error_middleware_1.errorHandler);
exports.default = app;

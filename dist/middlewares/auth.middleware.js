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
exports.authenticateSocket = exports.adminOnly = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_schema_1 = require("../models/user.schema");
const environments_1 = require("../utils/environments");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const authenticate = (req, res, next) => {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (!token) {
        res.status(401).json({
            success: false,
            error: "Authentication required",
        });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.userId,
            corporateId: decoded.corporateId,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: "Invalid token",
        });
        return;
    }
};
exports.authenticate = authenticate;
const adminOnly = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        res.status(403).json({
            success: false,
            error: "Admin access required",
        });
        return;
    }
    next();
};
exports.adminOnly = adminOnly;
const authenticateSocket = (socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = socket.handshake.auth.token ||
            ((_a = socket.handshake.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]);
        if (!token) {
            throw new Error("Authentication error: No token provided");
        }
        const decoded = jsonwebtoken_1.default.verify(token, environments_1.env.JWT_SECRET);
        // Verify user exists
        const user = yield user_schema_1.User.findById(decoded.userId);
        if (!user) {
            throw new Error("Authentication error: User not found");
        }
        // Attach user data to socket
        socket.data = {
            id: user._id,
            corporateId: user.corporateId,
            role: user.role,
        };
        next();
    }
    catch (err) {
        console.error("Socket authentication error:", err);
        next(new Error("Authentication failed"));
    }
});
exports.authenticateSocket = authenticateSocket;

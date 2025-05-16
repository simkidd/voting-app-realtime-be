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
exports.logout = exports.getMe = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_schema_1 = require("../models/user.schema");
const environments_1 = require("../utils/environments");
const { JWT_SECRET } = environments_1.env;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { corporateId, pin } = req.body;
        if (!corporateId || !pin) {
            res.status(400).json({
                success: false,
                error: "Corporate ID and PIN are required",
            });
            return;
        }
        // Verify corporate ID and PIN
        const user = yield user_schema_1.User.findOne({ corporateId, pin });
        if (!user) {
            res.status(401).json({
                success: false,
                error: "Invalid corporate ID or PIN",
            });
            return;
        }
        // 2. Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: user._id,
            corporateId: user.corporateId,
            role: user.role,
        }, JWT_SECRET, { expiresIn: "8h" });
        const userResponseData = {
            id: user._id,
            corporateId: user.corporateId,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            hasVoted: user.hasVoted,
        };
        res.cookie("token", token, {
            httpOnly: true,
            secure: environments_1.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 8 * 60 * 60 * 1000, // 8 hours
        });
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                token,
                user: userResponseData,
            },
        });
        return;
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
        return;
    }
});
exports.login = login;
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield user_schema_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id).select("-pin");
        if (!user) {
            res.status(404).json({
                success: false,
                error: "User not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: user,
        });
        return;
    }
    catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
        return;
    }
});
exports.getMe = getMe;
const logout = (req, res) => {
    res.clearCookie("token");
    res.json({
        success: true,
        message: "Logout successful",
    });
    return;
};
exports.logout = logout;

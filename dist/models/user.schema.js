"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    corporateId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    pin: { type: String, required: true },
    role: {
        type: String,
        enum: ["voter", "candidate", "admin"],
        default: "voter",
    },
    department: { type: String, required: true },
    hasVoted: { type: Boolean, default: false },
    votedPositions: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Position",
        },
    ],
}, { timestamps: true });
exports.User = (0, mongoose_1.model)("User", UserSchema);

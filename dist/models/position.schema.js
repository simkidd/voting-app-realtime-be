"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = void 0;
const mongoose_1 = require("mongoose");
const PositionSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    electionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Election",
        required: true,
    },
    isActive: { type: Boolean, default: false },
}, { timestamps: true });
exports.Position = (0, mongoose_1.model)("Position", PositionSchema);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Election = void 0;
const mongoose_1 = require("mongoose");
const election_interface_1 = require("../interfaces/election.interface");
const ElectionSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
        type: String,
        enum: Object.values(election_interface_1.ElectionStatus),
        default: election_interface_1.ElectionStatus.DRAFT,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
exports.Election = (0, mongoose_1.model)("Election", ElectionSchema);

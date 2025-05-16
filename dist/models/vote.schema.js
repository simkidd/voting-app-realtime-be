"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vote = void 0;
const mongoose_1 = require("mongoose");
const VoteSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    positionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Position",
        required: true,
    },
    candidateId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Candidate",
        required: true,
    },
    electionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Election",
        required: true,
    },
    votedAt: { type: Date },
}, { timestamps: true });
// Compound index to enforce one vote per user per position
VoteSchema.index({ userId: 1, positionId: 1 }, { unique: true });
exports.Vote = (0, mongoose_1.model)("Vote", VoteSchema);

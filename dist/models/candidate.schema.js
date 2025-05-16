"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Candidate = void 0;
const mongoose_1 = require("mongoose");
const photoSchema = new mongoose_1.Schema({
    imageUrl: { type: String },
    publicId: { type: String },
}, { _id: false });
const CandidateSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    corporateId: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    photo: { type: photoSchema },
    qualifications: { type: [String], required: true },
    manifesto: { type: String, required: true },
    positionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Position",
        required: true,
    },
    electionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Election",
        required: true,
    },
    votes: { type: Number, default: 0 },
}, { timestamps: true });
exports.Candidate = (0, mongoose_1.model)("Candidate", CandidateSchema);

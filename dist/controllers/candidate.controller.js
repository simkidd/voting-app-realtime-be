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
exports.deleteCandidate = exports.getCandidateById = exports.getCandidates = exports.createCandidate = void 0;
const candidate_schema_1 = require("../models/candidate.schema");
const position_schema_1 = require("../models/position.schema");
const mongoose_1 = __importDefault(require("mongoose"));
const election_schema_1 = require("../models/election.schema");
const election_interface_1 = require("../interfaces/election.interface");
const user_schema_1 = require("../models/user.schema");
const cloudinary_1 = require("../utils/cloudinary");
const createCandidate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { userId, positionId, qualifications, manifesto } = req.body;
        // 1. Input validation
        if (!userId || !positionId) {
            res.status(400).json({
                success: false,
                error: "User ID and position ID are required",
            });
            return;
        }
        // 2. Verify position exists and is active
        const position = yield position_schema_1.Position.findById(positionId).session(session);
        if (!position || !position.isActive) {
            res.status(404).json({
                success: false,
                error: "Active position not found",
            });
            return;
        }
        // 3. Verify election is in valid state
        const election = yield election_schema_1.Election.findById(position.electionId).session(session);
        if (!election || election.status !== election_interface_1.ElectionStatus.ACTIVE) {
            res.status(400).json({
                success: false,
                error: "Cannot add candidates to inactive elections",
            });
            return;
        }
        // 4. Verify user exists and is eligible
        const user = yield user_schema_1.User.findById(userId).session(session);
        if (!user) {
            res.status(404).json({
                success: false,
                error: "User not found",
            });
            return;
        }
        // 5. Check for duplicate corporateId in same election
        const existingCandidate = yield candidate_schema_1.Candidate.findOne({
            $or: [{ userId: user._id }, { corporateId: user.corporateId }],
            electionId: position.electionId,
        }).session(session);
        if (existingCandidate) {
            res.status(409).json({
                success: false,
                error: "User is already a candidate in this election",
            });
            return;
        }
        // 6. Handle image upload if present
        let imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
        let imagePublicId = null;
        if (req.file) {
            try {
                const uploadResult = yield (0, cloudinary_1.uploadImage)(req.file, {
                    folder: `voting-app/${position.electionId}/candidates`,
                    transformation: [
                        { width: 500, height: 500, crop: "" },
                        { quality: "auto" },
                    ],
                });
                imageUrl = uploadResult.secure_url;
                imagePublicId = uploadResult.public_id;
            }
            catch (uploadError) {
                console.error("Image upload failed:", uploadError);
                res.status(500).json({
                    success: false,
                    error: "Failed to upload candidate image",
                });
                return;
            }
        }
        // 7. Create candidate
        const candidate = yield candidate_schema_1.Candidate.create([
            {
                name: user.name,
                corporateId: user.corporateId,
                department: user.department,
                positionId,
                electionId: position.electionId,
                photo: {
                    imageUrl,
                    publicId: imagePublicId,
                },
                qualifications: Array.isArray(qualifications)
                    ? qualifications.filter((q) => q.trim().length > 0)
                    : [qualifications].filter((q) => q.trim().length > 0),
                manifesto: manifesto || `My vision for ${position.title}`,
                votes: 0,
            },
        ], { session });
        // 8. Update user role if needed
        if (user.role === "voter") {
            yield user_schema_1.User.findByIdAndUpdate(user._id, { $set: { role: "candidate" } }, { session });
        }
        yield session.commitTransaction();
        res.status(201).json({
            success: true,
            data: candidate[0],
        });
        return;
    }
    catch (error) {
        console.error("Create candidate error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create candidate",
        });
    }
});
exports.createCandidate = createCandidate;
const getCandidates = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { positionId, electionId, sortBy } = req.query;
        // 1. Build query
        const query = {};
        if (positionId)
            query.positionId = positionId;
        if (electionId)
            query.electionId = electionId;
        // 2. Build sort
        const sortOptions = {};
        if (sortBy === "votes") {
            sortOptions.votes = -1;
        }
        else {
            sortOptions.name = 1;
        }
        // 3. Fetch candidates with additional data
        const candidates = yield candidate_schema_1.Candidate.find(query)
            .populate("positionId", "title")
            .populate("electionId", "title")
            .sort(sortOptions);
        // 4. Return results
        res.status(200).json({
            success: true,
            data: candidates,
        });
        return;
    }
    catch (error) {
        console.error("Get candidates error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch candidates",
        });
        return;
    }
});
exports.getCandidates = getCandidates;
const getCandidateById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { candidateId } = req.params;
        const candidate = yield candidate_schema_1.Candidate.findById(candidateId)
            .populate("positionId", "title description")
            .populate("electionId", "title status");
        if (!candidate) {
            res.status(404).json({
                success: false,
                error: "Candidate not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: candidate,
        });
        return;
    }
    catch (error) {
        console.error("Get candidate error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch candidate",
        });
        return;
    }
});
exports.getCandidateById = getCandidateById;
const deleteCandidate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { candidateId } = req.params;
        // 1. Find candidate
        const candidate = yield candidate_schema_1.Candidate.findById(candidateId).session(session);
        if (!candidate) {
            res.status(404).json({
                success: false,
                error: "Candidate not found",
            });
            return;
        }
        // 2. Check if candidate has votes
        if (candidate.votes > 0) {
            res.status(400).json({
                success: false,
                error: "Cannot delete candidate with existing votes",
            });
            return;
        }
        // 3. Delete candidate
        yield candidate_schema_1.Candidate.deleteOne({ _id: candidateId }).session(session);
        // 4. Revert user role if needed
        const user = yield user_schema_1.User.findOne({
            corporateId: candidate.corporateId,
        }).session(session);
        if (user && user.role === "candidate") {
            // Check if user has other candidacies
            const otherCandidacies = yield candidate_schema_1.Candidate.countDocuments({
                corporateId: candidate.corporateId,
                _id: { $ne: candidateId },
            }).session(session);
            if (otherCandidacies === 0) {
                yield user_schema_1.User.findByIdAndUpdate(user._id, { $set: { role: "voter" } }, { session });
            }
        }
        yield session.commitTransaction();
        res.json({
            success: true,
            message: "Candidate deleted successfully",
        });
        return;
    }
    catch (error) {
        yield session.abortTransaction();
        console.error("Delete candidate error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete candidate",
        });
        return;
    }
    finally {
        session.endSession();
    }
});
exports.deleteCandidate = deleteCandidate;

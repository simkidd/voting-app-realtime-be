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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResults = exports.castVote = void 0;
const socket_1 = require("../config/socket");
const candidate_schema_1 = require("../models/candidate.schema");
const election_schema_1 = require("../models/election.schema");
const position_schema_1 = require("../models/position.schema");
const user_schema_1 = require("../models/user.schema");
const vote_schema_1 = require("../models/vote.schema");
// export const castVote = async (req: Request, res: Response) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const { positionId, candidateId } = req.body;
//     const userId = req?.user?.id;
//     // 1. Input validation
//     if (!positionId || !candidateId) {
//       res.status(400).json({
//         success: false,
//         error: "Position ID and candidate ID are required",
//       });
//       return;
//     }
//     // 2. Verify user exists and is a voter
//     const user = await User.findById(userId).session(session);
//     if (!user || user.role !== "voter") {
//       res.status(403).json({
//         success: false,
//         error: "Only voters can cast votes",
//       });
//       return;
//     }
//     // 3. Verify position exists and is active
//     const position = await Position.findById(positionId).session(session);
//     if (!position || !position.isActive) {
//       res.status(400).json({
//         success: false,
//         error: "Voting for this position is closed",
//       });
//       return;
//     }
//     // 4. Verify election is active
//     const election = await Election.findById(position.electionId).session(
//       session
//     );
//     if (!election || election.status !== "active") {
//       res.status(400).json({
//         success: false,
//         error: "Voting is not currently active",
//       });
//       return;
//     }
//     // 5. Verify candidate exists and belongs to position
//     const candidate = await Candidate.findOne({
//       _id: candidateId,
//       positionId,
//     }).session(session);
//     if (!candidate) {
//       res.status(404).json({
//         success: false,
//         error: "Candidate not found for this position",
//       });
//       return;
//     }
//     // 6. Verify user hasn't already voted for this position
//     const existingVote = await Vote.findOne({
//       userId,
//       positionId,
//     }).session(session);
//     if (existingVote) {
//       res.status(400).json({
//         success: false,
//         error: "You have already voted for this position",
//       });
//       return;
//     }
//     // 7. Record vote
//     const vote = new Vote({
//       userId,
//       positionId,
//       candidateId,
//       electionId: position.electionId,
//       votedAt: new Date(),
//     });
//     await vote.save({ session });
//     // 8. Update candidate vote count
//     await Candidate.findByIdAndUpdate(
//       candidateId,
//       { $inc: { votes: 1 } },
//       { session }
//     );
//     // 9. Check if this was the last position to vote for
//     const totalPositions = await Position.countDocuments({
//       electionId: position.electionId,
//       isActive: true,
//     }).session(session);
//     const userVotes = await Vote.countDocuments({
//       userId,
//       electionId: position.electionId,
//     }).session(session);
//     // 10. Mark user as completely voted if they've voted for all positions
//     await User.findByIdAndUpdate(
//       userId,
//       {
//         $addToSet: { votedPositions: positionId },
//         $set: {
//           hasVoted: userVotes + 1 >= totalPositions,
//         },
//       },
//       { session }
//     );
//     await session.commitTransaction();
//     // 11. Get updated results with candidate photos
//     const results = await Candidate.aggregate([
//       { $match: { positionId: position._id } },
//       { $sort: { votes: -1 } },
//       {
//         $project: {
//           _id: 1,
//           name: 1,
//           photo: 1,
//           votes: 1,
//           percentage: {
//             $cond: [
//               { $eq: [{ $sum: "$votes" }, 0] },
//               0,
//               {
//                 $multiply: [
//                   {
//                     $divide: ["$votes", { $sum: "$votes" }],
//                   },
//                   100,
//                 ],
//               },
//             ],
//           },
//         },
//       },
//     ]);
//     // 12. Broadcast real-time update
//     getIO().to(`position-${positionId}`).emit("vote-update", {
//       positionId,
//       results,
//     });
//     res.status(200).json({
//       success: true,
//       message:
//         userVotes >= totalPositions
//           ? "You have completed voting for all positions"
//           : "Vote recorded successfully",
//       data: results,
//     });
//     return;
//   } catch (error) {
//     await session.abortTransaction();
//     console.error("Vote error:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to record vote",
//     });
//     return;
//   } finally {
//     session.endSession();
//   }
// };
const castVote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { positionId, candidateId } = req.body;
        const userId = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id;
        // 1. Input validation
        if (!positionId || !candidateId) {
            res.status(400).json({
                success: false,
                error: "Position ID and candidate ID are required",
            });
            return;
        }
        // 2. Verify user exists and is a voter
        const user = yield user_schema_1.User.findById(userId);
        if (!user || user.role !== "voter") {
            res.status(403).json({
                success: false,
                error: "Only voters can cast votes",
            });
            return;
        }
        // 3. Verify position exists and is active
        const position = yield position_schema_1.Position.findById(positionId);
        if (!position || !position.isActive) {
            res.status(400).json({
                success: false,
                error: "Voting for this position is closed",
            });
            return;
        }
        // 4. Verify election is active
        const election = yield election_schema_1.Election.findById(position.electionId);
        if (!election || election.status !== "active") {
            res.status(400).json({
                success: false,
                error: "Voting is not currently active",
            });
            return;
        }
        // 5. Verify candidate exists and belongs to position
        const candidate = yield candidate_schema_1.Candidate.findOne({
            _id: candidateId,
            positionId,
        });
        if (!candidate) {
            res.status(404).json({
                success: false,
                error: "Candidate not found for this position",
            });
            return;
        }
        // 6. Verify user hasn't already voted for this position
        const existingVote = yield vote_schema_1.Vote.findOne({
            userId,
            positionId,
        });
        if (existingVote) {
            res.status(400).json({
                success: false,
                error: "You have already voted for this position",
            });
            return;
        }
        // 7. Record vote
        const vote = new vote_schema_1.Vote({
            userId,
            positionId,
            candidateId,
            electionId: position.electionId,
            votedAt: new Date(),
        });
        yield vote.save();
        // 8. Update candidate vote count
        yield candidate_schema_1.Candidate.findByIdAndUpdate(candidateId, { $inc: { votes: 1 } });
        // 9. Check if this was the last position to vote for
        const totalPositions = yield position_schema_1.Position.countDocuments({
            electionId: position.electionId,
            isActive: true,
        });
        const userVotes = yield vote_schema_1.Vote.countDocuments({
            userId,
            electionId: position.electionId,
        });
        // 10. Mark user as completely voted if they've voted for all positions
        yield user_schema_1.User.findByIdAndUpdate(userId, {
            $addToSet: { votedPositions: positionId },
            $set: {
                hasVoted: userVotes + 1 >= totalPositions,
            },
        });
        // 11. Get updated results with candidate photos
        const results = yield candidate_schema_1.Candidate.aggregate([
            { $match: { positionId: position._id } },
            { $sort: { votes: -1 } },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    photo: 1,
                    votes: 1,
                },
            },
        ]);
        // 12. Broadcast real-time update
        (0, socket_1.getIO)().to(`position-${positionId}`).emit("vote-update", {
            positionId,
            results,
        });
        res.status(200).json({
            success: true,
            message: userVotes >= totalPositions
                ? "You have completed voting for all positions"
                : "Vote recorded successfully",
            data: results,
        });
        return;
    }
    catch (error) {
        console.error("Vote error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to record vote",
        });
        return;
    }
});
exports.castVote = castVote;
const getResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { positionId } = req.params;
        // 1. Verify position exists
        const position = yield position_schema_1.Position.findById(positionId);
        if (!position) {
            res.status(404).json({
                success: false,
                error: "Position not found",
            });
            return;
        }
        // 2. Get results with candidate photos and percentages
        const results = yield candidate_schema_1.Candidate.aggregate([
            { $match: { positionId: position._id } },
            { $sort: { votes: -1 } },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    department: 1,
                    photo: 1,
                    votes: 1,
                },
            },
        ]);
        res.status(200).json({
            success: true,
            data: results,
        });
        return;
    }
    catch (error) {
        console.error("Get results error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch results",
        });
        return;
    }
});
exports.getResults = getResults;

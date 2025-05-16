import { Request, Response } from "express";
import mongoose from "mongoose";
import { getIO } from "../config/socket";
import { Candidate } from "../models/candidate.schema";
import { Election } from "../models/election.schema";
import { Position } from "../models/position.schema";
import { User } from "../models/user.schema";
import { Vote } from "../models/vote.schema";

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

export const castVote = async (req: Request, res: Response) => {
  try {
    const { positionId, candidateId } = req.body;
    const userId = req?.user?.id;

    // 1. Input validation
    if (!positionId || !candidateId) {
      res.status(400).json({
        success: false,
        error: "Position ID and candidate ID are required",
      });
      return;
    }

    // 2. Verify user exists and is a voter
    const user = await User.findById(userId);
    if (!user || user.role !== "voter") {
      res.status(403).json({
        success: false,
        error: "Only voters can cast votes",
      });
      return;
    }

    // 3. Verify position exists and is active
    const position = await Position.findById(positionId);
    if (!position || !position.isActive) {
      res.status(400).json({
        success: false,
        error: "Voting for this position is closed",
      });
      return;
    }

    // 4. Verify election is active
    const election = await Election.findById(position.electionId);
    if (!election || election.status !== "active") {
      res.status(400).json({
        success: false,
        error: "Voting is not currently active",
      });
      return;
    }

    // 5. Verify candidate exists and belongs to position
    const candidate = await Candidate.findOne({
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
    const existingVote = await Vote.findOne({
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
    const vote = new Vote({
      userId,
      positionId,
      candidateId,
      electionId: position.electionId,
      votedAt: new Date(),
    });

    await vote.save();

    // 8. Update candidate vote count
    await Candidate.findByIdAndUpdate(candidateId, { $inc: { votes: 1 } });

    // 9. Check if this was the last position to vote for
    const totalPositions = await Position.countDocuments({
      electionId: position.electionId,
      isActive: true,
    });

    const userVotes = await Vote.countDocuments({
      userId,
      electionId: position.electionId,
    });

    // 10. Mark user as completely voted if they've voted for all positions
    await User.findByIdAndUpdate(userId, {
      $addToSet: { votedPositions: positionId },
      $set: {
        hasVoted: userVotes + 1 >= totalPositions,
      },
    });

    // 11. Get updated results with candidate photos
    const results = await Candidate.aggregate([
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
    getIO().to(`position-${positionId}`).emit("vote-update", {
      positionId,
      results,
    });

    res.status(200).json({
      success: true,
      message:
        userVotes >= totalPositions
          ? "You have completed voting for all positions"
          : "Vote recorded successfully",
      data: results,
    });
    return;
  } catch (error) {
    console.error("Vote error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to record vote",
    });
    return;
  }
};

export const getResults = async (req: Request, res: Response) => {
  try {
    const { positionId } = req.params;

    // 1. Verify position exists
    const position = await Position.findById(positionId);
    if (!position) {
      res.status(404).json({
        success: false,
        error: "Position not found",
      });
      return;
    }

    // 2. Get results with candidate photos and percentages
    const results = await Candidate.aggregate([
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
  } catch (error) {
    console.error("Get results error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch results",
    });
    return;
  }
};

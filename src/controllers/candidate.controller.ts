// controllers/candidate.controller.ts
import { Request, Response } from "express";
import { ApiResponse } from "../interfaces/ApiResponse";
import { Candidate } from "../models/candidate.schema";
import { ICandidate } from "../interfaces/candidate.interface";
import { Position } from "../models/position.schema";
import mongoose from "mongoose";
import { Election } from "../models/election.schema";
import { ElectionStatus } from "../interfaces/election.interface";
import { User } from "../models/user.schema";
import { uploadImage } from "../utils/cloudinary";

export const createCandidate = async (
  req: Request,
  res: Response<ApiResponse<ICandidate>>
) => {
  const session = await mongoose.startSession();
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
    const position = await Position.findById(positionId).session(session);
    if (!position || !position.isActive) {
      res.status(404).json({
        success: false,
        error: "Active position not found",
      });
      return;
    }

    // 3. Verify election is in valid state
    const election = await Election.findById(position.electionId).session(
      session
    );
    if (!election || election.status !== ElectionStatus.ACTIVE) {
      res.status(400).json({
        success: false,
        error: "Cannot add candidates to inactive elections",
      });
      return;
    }

    // 4. Verify user exists and is eligible
    const user = await User.findById(userId).session(session);
    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    // 5. Check for duplicate corporateId in same election
    const existingCandidate = await Candidate.findOne({
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
    let imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.name
    )}&background=random`;
    let imagePublicId = null;

    if (req.file) {
      try {
        const uploadResult = await uploadImage(req.file, {
          folder: `voting-app/${position.electionId}/candidates`,
          transformation: [
            { width: 500, height: 500, crop: "" },
            { quality: "auto" },
          ],
        });
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        res.status(500).json({
          success: false,
          error: "Failed to upload candidate image",
        });
        return;
      }
    }

    // 7. Create candidate
    const candidate = await Candidate.create(
      [
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
      ],
      { session }
    );

    // 8. Update user role if needed
    if (user.role === "voter") {
      await User.findByIdAndUpdate(
        user._id,
        { $set: { role: "candidate" } },
        { session }
      );
    }

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: candidate[0],
    });
    return;
  } catch (error) {
    console.error("Create candidate error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create candidate",
    });
  }
};

export const getCandidates = async (
  req: Request,
  res: Response<ApiResponse<ICandidate[]>>
) => {
  try {
    const { positionId, electionId, sortBy } = req.query;

    // 1. Build query
    const query: any = {};
    if (positionId) query.positionId = positionId;
    if (electionId) query.electionId = electionId;

    // 2. Build sort
    const sortOptions: any = {};
    if (sortBy === "votes") {
      sortOptions.votes = -1;
    } else {
      sortOptions.name = 1;
    }

    // 3. Fetch candidates with additional data
    const candidates = await Candidate.find(query)
      .populate("positionId", "title")
      .populate("electionId", "title")
      .sort(sortOptions);

    // 4. Return results
    res.status(200).json({
      success: true,
      data: candidates,
    });
    return;
  } catch (error) {
    console.error("Get candidates error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch candidates",
    });
    return;
  }
};

export const getCandidateById = async (
  req: Request,
  res: Response<ApiResponse<ICandidate>>
) => {
  try {
    const { candidateId } = req.params;

    const candidate = await Candidate.findById(candidateId)
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
  } catch (error) {
    console.error("Get candidate error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch candidate",
    });
    return;
  }
};

export const deleteCandidate = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { candidateId } = req.params;

    // 1. Find candidate
    const candidate = await Candidate.findById(candidateId).session(session);
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
    await Candidate.deleteOne({ _id: candidateId }).session(session);

    // 4. Revert user role if needed
    const user = await User.findOne({
      corporateId: candidate.corporateId,
    }).session(session);
    if (user && user.role === "candidate") {
      // Check if user has other candidacies
      const otherCandidacies = await Candidate.countDocuments({
        corporateId: candidate.corporateId,
        _id: { $ne: candidateId },
      }).session(session);

      if (otherCandidacies === 0) {
        await User.findByIdAndUpdate(
          user._id,
          { $set: { role: "voter" } },
          { session }
        );
      }
    }

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Candidate deleted successfully",
    });
    return;
  } catch (error) {
    await session.abortTransaction();
    console.error("Delete candidate error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete candidate",
    });
    return;
  } finally {
    session.endSession();
  }
};

// controllers/position.controller.ts
import { Request, Response } from "express";
import { ApiResponse } from "../interfaces/ApiResponse";
import { ElectionStatus } from "../interfaces/election.interface";
import { IPosition } from "../interfaces/position.interface";
import { Election } from "../models/election.schema";
import { Position } from "../models/position.schema";

export const createPosition = async (
  req: Request,
  res: Response<ApiResponse<IPosition>>
) => {
  try {
    const { title, description, electionId } = req.body;

    // 1. Input validation
    if (!title || !electionId) {
      res.status(400).json({
        success: false,
        error: "Title and election ID are required",
      });
      return;
    }

    // 2. Verify election exists and is editable
    const election = await Election.findById(electionId);
    if (!election || election.isDeleted) {
      res.status(404).json({
        success: false,
        error: "Election not found",
      });
      return;
    }

    if (election.status === ElectionStatus.COMPLETED) {
      res.status(400).json({
        success: false,
        error: "Cannot add positions to completed elections",
      });
      return;
    }

    // 3. Check for duplicate position title in same election
    const existingPosition = await Position.findOne({
      title,
      electionId,
      isDeleted: false,
    });

    if (existingPosition) {
      res.status(409).json({
        success: false,
        error: "Position with this title already exists in the election",
      });
      return;
    }

    // 4. Create position
    const position = new Position({
      title,
      description,
      electionId,
      isActive: false,
      createdBy: req?.user?.id,
    });

    await position.save();

    // 5. Return created position
    res.status(201).json({
      success: true,
      data: position,
    });
    return;
  } catch (error) {
    console.error("Create position error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create position",
    });
    return;
  }
};

export const togglePositionStatus = async (req: Request, res: Response) => {
  try {
    const { positionId } = req.params;
    const { isActive } = req.body;

    // 1. Validate input
    if (typeof isActive !== "boolean") {
      res.status(400).json({
        success: false,
        error: "isActive must be a boolean value",
      });
      return;
    }

    // 2. Get position with election details
    const position = await Position.findById(positionId).populate({
      path: "electionId",
      select: "status startDate endDate",
    });

    if (!position || (position as any).isDeleted) {
      res.status(404).json({
        success: false,
        error: "Position not found",
      });
      return;
    }

    const election = position.electionId as unknown as {
      status: string;
      startDate: Date;
      endDate: Date;
    };

    // 3. Validate election status
    if (election.status === ElectionStatus.COMPLETED) {
      res.status(400).json({
        success: false,
        error: "Cannot modify positions in completed elections",
      });
      return;
    }

    // 4. Validate active period
    const now = new Date();
    if (isActive && (now < election.startDate || now > election.endDate)) {
      res.status(400).json({
        success: false,
        error: "Position can only be active during election period",
      });
      return;
    }

    // 5. Update position status
    const updatedPosition = await Position.findByIdAndUpdate(
      positionId,
      { isActive },
      { new: true, runValidators: true }
    );

    // 3. Return updated position
    res.status(200).json({
      success: true,
      data: updatedPosition,
    });
    return;
  } catch (error) {
    console.error("Toggle position error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update position",
    });
  }
};

export const getPositions = async (req: Request, res: Response) => {
  try {
    const { electionId, active } = req.query;

    // Build query
    const query: any = { isDeleted: false };
    if (electionId) query.electionId = electionId;
    if (active === "true") query.isActive = true;
    if (active === "false") query.isActive = false;

    const positions = await Position.find()
      .populate("electionId", "title status")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: positions,
    });
    return;
  } catch (error) {
    console.error("Get positions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch positions",
    });
    return;
  }
};

export const deletePosition = async (req: Request, res: Response) => {
  try {
    const { positionId } = req.params;

    // 1. Check if position exists
    const position = await Position.findById(positionId);
    if (!position) {
      res.status(404).json({
        success: false,
        error: "Position not found",
      });
      return;
    }

    // 2. Prevent deletion of active positions
    if (position.isActive) {
      res.status(400).json({
        success: false,
        error: "Cannot delete active positions",
      });
      return;
    }

    // 3. Soft delete
    await Position.findByIdAndUpdate(
      positionId,
      { isDeleted: true },
      { new: true }
    );

    res.json({
      success: true,
      message: "Position deleted successfully",
    });
    return;
  } catch (error) {
    console.error("Delete position error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete position",
    });
    return;
  }
};

import { Request, Response } from "express";
import { ElectionStatus } from "../interfaces/election.interface";
import { Election } from "../models/election.schema";

export const createElection = async (req: Request, res: Response) => {
  try {
    const { title, description, startDate, endDate } = req.body;

    if (!title || !startDate || !endDate) {
      res.status(400).json({
        success: false,
        error: "Title, start date, and end date are required",
      });
      return;
    }

    // Date validation
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      res.status(400).json({
        success: false,
        error: "End date must be after start date",
      });
      return;
    }

    const election = await Election.create({
      title,
      description,
      startDate: start,
      endDate: end,
      createdBy: req.user?.id, // From auth middleware
      status: ElectionStatus.DRAFT,
    });

    res.status(201).json({
      success: true,
      message: "Elected created successfully",
      data: election,
    });
    return;
  } catch (error) {
    console.error("Create election error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create election",
    });
    return;
  }
};

export const updateElectionStatus = async (req: Request, res: Response) => {
  try {
    const { electionId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!Object.values(ElectionStatus).includes(status)) {
      res.status(400).json({
        success: false,
        error: "Invalid election status",
      });
      return;
    }

    // Validate status transition
    const election = await Election.findById(electionId);
    if (!election) {
      res.status(404).json({
        success: false,
        error: "Election not found",
      });
      return;
    }

    // Status transition validation
    const validTransitions: Record<ElectionStatus, ElectionStatus[]> = {
      [ElectionStatus.DRAFT]: [ElectionStatus.UPCOMING, ElectionStatus.ACTIVE],
      [ElectionStatus.UPCOMING]: [
        ElectionStatus.ACTIVE,
        ElectionStatus.CANCELLED,
      ],
      [ElectionStatus.ACTIVE]: [
        ElectionStatus.COMPLETED,
        ElectionStatus.CANCELLED,
      ],
      [ElectionStatus.COMPLETED]: [],
      [ElectionStatus.CANCELLED]: [],
    };

    if (!validTransitions[election.status].includes(status)) {
      res.status(400).json({
        success: false,
        error: `Cannot transition from ${election.status} to ${status}`,
      });
      return;
    }

    // Special handling for ACTIVE status
    if (status === ElectionStatus.ACTIVE) {
      const now = new Date();
      if (now < election.startDate || now > election.endDate) {
        res.status(400).json({
          success: false,
          error: "Election can only be active during its scheduled period",
        });
        return;
      }
    }

    const updatedElection = await Election.findByIdAndUpdate(
      electionId,
      { status },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: updatedElection,
    });
    return;
  } catch (error) {
    console.error("Update election error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update election",
    });
    return;
  }
};

export const getElectionById = async (req: Request, res: Response) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findById(electionId)
      .populate("createdBy", "name email")

    if (!election || election.isDeleted) {
      res.status(404).json({
        success: false,
        error: "Election not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: election,
    });
    return;
  } catch (error) {
    console.error("Get election error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch election",
    });
    return;
  }
};

export const listElections = async (req: Request, res: Response) => {
  try {
    const { status, upcoming, active } = req.query;

    // Build query
    const query: any = { isDeleted: false };
    if (
      status &&
      Object.values(ElectionStatus).includes(status as ElectionStatus)
    ) {
      query.status = status;
    }

    // Convenience filters
    const now = new Date();
    if (upcoming === "true") {
      query.startDate = { $gt: now };
      query.status = ElectionStatus.UPCOMING;
    }
    if (active === "true") {
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
      query.status = ElectionStatus.ACTIVE;
    }

    const elections = await Election.find(query)
      .populate("createdBy", "name")
      .sort({ startDate: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: elections,
    });
    return;
  } catch (error) {
    console.error("List elections error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch elections",
    });
    return;
  }
};

export const deleteElection = async (req: Request, res: Response) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findById(electionId);
    if (!election) {
      res.status(404).json({
        success: false,
        error: "Election not found",
      });
      return;
    }

    // Prevent deletion of active elections
    if (election.status === ElectionStatus.ACTIVE) {
      res.status(400).json({
        success: false,
        error: "Cannot delete active elections",
      });
      return;
    }

    // Soft delete
    await Election.findByIdAndUpdate(
      electionId,
      { isDeleted: true },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Election deleted successfully",
    });
    return;
  } catch (error) {
    console.error("Delete election error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete election",
    });
    return;
  }
};

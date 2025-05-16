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
exports.deleteElection = exports.listElections = exports.getElectionById = exports.updateElectionStatus = exports.createElection = void 0;
const election_interface_1 = require("../interfaces/election.interface");
const election_schema_1 = require("../models/election.schema");
const createElection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const election = yield election_schema_1.Election.create({
            title,
            description,
            startDate: start,
            endDate: end,
            createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id, // From auth middleware
            status: election_interface_1.ElectionStatus.DRAFT,
        });
        res.status(201).json({
            success: true,
            message: "Elected created successfully",
            data: election,
        });
        return;
    }
    catch (error) {
        console.error("Create election error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create election",
        });
        return;
    }
});
exports.createElection = createElection;
const updateElectionStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { electionId } = req.params;
        const { status } = req.body;
        // Validate status
        if (!Object.values(election_interface_1.ElectionStatus).includes(status)) {
            res.status(400).json({
                success: false,
                error: "Invalid election status",
            });
            return;
        }
        // Validate status transition
        const election = yield election_schema_1.Election.findById(electionId);
        if (!election) {
            res.status(404).json({
                success: false,
                error: "Election not found",
            });
            return;
        }
        // Status transition validation
        const validTransitions = {
            [election_interface_1.ElectionStatus.DRAFT]: [election_interface_1.ElectionStatus.UPCOMING, election_interface_1.ElectionStatus.ACTIVE],
            [election_interface_1.ElectionStatus.UPCOMING]: [
                election_interface_1.ElectionStatus.ACTIVE,
                election_interface_1.ElectionStatus.CANCELLED,
            ],
            [election_interface_1.ElectionStatus.ACTIVE]: [
                election_interface_1.ElectionStatus.COMPLETED,
                election_interface_1.ElectionStatus.CANCELLED,
            ],
            [election_interface_1.ElectionStatus.COMPLETED]: [],
            [election_interface_1.ElectionStatus.CANCELLED]: [],
        };
        if (!validTransitions[election.status].includes(status)) {
            res.status(400).json({
                success: false,
                error: `Cannot transition from ${election.status} to ${status}`,
            });
            return;
        }
        // Special handling for ACTIVE status
        if (status === election_interface_1.ElectionStatus.ACTIVE) {
            const now = new Date();
            if (now < election.startDate || now > election.endDate) {
                res.status(400).json({
                    success: false,
                    error: "Election can only be active during its scheduled period",
                });
                return;
            }
        }
        const updatedElection = yield election_schema_1.Election.findByIdAndUpdate(electionId, { status }, { new: true });
        res.status(200).json({
            success: true,
            data: updatedElection,
        });
        return;
    }
    catch (error) {
        console.error("Update election error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update election",
        });
        return;
    }
});
exports.updateElectionStatus = updateElectionStatus;
const getElectionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { electionId } = req.params;
        const election = yield election_schema_1.Election.findById(electionId)
            .populate("createdBy", "name email");
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
    }
    catch (error) {
        console.error("Get election error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch election",
        });
        return;
    }
});
exports.getElectionById = getElectionById;
const listElections = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, upcoming, active } = req.query;
        // Build query
        const query = { isDeleted: false };
        if (status &&
            Object.values(election_interface_1.ElectionStatus).includes(status)) {
            query.status = status;
        }
        // Convenience filters
        const now = new Date();
        if (upcoming === "true") {
            query.startDate = { $gt: now };
            query.status = election_interface_1.ElectionStatus.UPCOMING;
        }
        if (active === "true") {
            query.startDate = { $lte: now };
            query.endDate = { $gte: now };
            query.status = election_interface_1.ElectionStatus.ACTIVE;
        }
        const elections = yield election_schema_1.Election.find(query)
            .populate("createdBy", "name")
            .sort({ startDate: -1 })
            .lean();
        res.status(200).json({
            success: true,
            data: elections,
        });
        return;
    }
    catch (error) {
        console.error("List elections error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch elections",
        });
        return;
    }
});
exports.listElections = listElections;
const deleteElection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { electionId } = req.params;
        const election = yield election_schema_1.Election.findById(electionId);
        if (!election) {
            res.status(404).json({
                success: false,
                error: "Election not found",
            });
            return;
        }
        // Prevent deletion of active elections
        if (election.status === election_interface_1.ElectionStatus.ACTIVE) {
            res.status(400).json({
                success: false,
                error: "Cannot delete active elections",
            });
            return;
        }
        // Soft delete
        yield election_schema_1.Election.findByIdAndUpdate(electionId, { isDeleted: true }, { new: true });
        res.status(200).json({
            success: true,
            message: "Election deleted successfully",
        });
        return;
    }
    catch (error) {
        console.error("Delete election error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete election",
        });
        return;
    }
});
exports.deleteElection = deleteElection;

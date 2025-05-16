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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../config/db"));
const candidate_schema_1 = require("../models/candidate.schema");
const election_schema_1 = require("../models/election.schema");
const position_schema_1 = require("../models/position.schema");
const user_schema_1 = require("../models/user.schema");
const vote_schema_1 = require("../models/vote.schema");
const environments_1 = require("../utils/environments");
// Helper function to generate random pins
const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();
// Departments in the organization
const DEPARTMENTS = [
    "Engineering",
    "Marketing",
    "Human Resources",
    "Finance",
    "Operations",
];
// Main seeding function
const seedDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, db_1.default)();
        console.log("Connected to database for seeding");
        // Clear existing data (in reverse dependency order)
        yield vote_schema_1.Vote.deleteMany();
        yield candidate_schema_1.Candidate.deleteMany();
        yield position_schema_1.Position.deleteMany();
        yield election_schema_1.Election.deleteMany();
        yield user_schema_1.User.deleteMany();
        console.log("Cleared existing data");
        // 1. Create Admin User
        const adminUser = yield user_schema_1.User.create({
            corporateId: "ADMIN001",
            name: "System Admin",
            email: "admin@company.com",
            pin: yield bcryptjs_1.default.hash("1234", 10),
            role: "admin",
            department: "Operations",
            hasVoted: false,
        });
        // 2. Create Regular Users (Voters)
        const users = yield user_schema_1.User.insertMany(Array.from({ length: 50 }, (_, i) => ({
            corporateId: `EMP${String(i + 100).padStart(3, "0")}`,
            name: `Employee ${i + 1}`,
            email: `employee${i + 1}@company.com`,
            pin: generatePin(),
            role: "voter",
            department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
            hasVoted: false,
        })));
        // 3. Create Election
        const election = yield election_schema_1.Election.create({
            title: "2025 Board Election",
            description: "Annual election for board members",
            startDate: new Date("2025-06-01"),
            endDate: new Date("2025-06-30"),
            status: "active",
            createdBy: adminUser._id,
        });
        // 4. Create Positions
        const positions = yield position_schema_1.Position.insertMany([
            {
                title: "President",
                description: "Chief executive officer",
                electionId: election._id,
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                title: "Vice President",
                description: "Second-in-command executive",
                electionId: election._id,
                isActive: true,
                createdBy: adminUser._id,
            },
            {
                title: "Secretary",
                description: "Handles official records",
                electionId: election._id,
                isActive: true,
                createdBy: adminUser._id,
            },
        ]);
        // 5. Create Candidates (3 per position)
        const candidates = [];
        const qualifications = [
            "5+ years company experience",
            "Leadership training certified",
            "MBA degree holder",
            "Project management expertise",
            "Excellent communication skills",
        ];
        // Track used user indices to prevent duplicates
        const usedUserIndices = new Set();
        for (const position of positions) {
            const positionCandidates = yield candidate_schema_1.Candidate.insertMany(Array.from({ length: 3 }, (_, i) => {
                // Find an unused user index
                let userIndex;
                do {
                    userIndex = Math.floor(Math.random() * users.length);
                } while (usedUserIndices.has(userIndex));
                usedUserIndices.add(userIndex);
                const user = users[userIndex];
                return {
                    name: user.name,
                    corporateId: user.corporateId,
                    department: user.department,
                    positionId: position._id,
                    electionId: election._id,
                    photo: {
                        imageUrl: `https://randomuser.me/api/portraits/${userIndex % 2 === 0 ? "men" : "women"}/${userIndex + 10}.jpg`,
                        publicId: null,
                    },
                    qualifications: qualifications.slice(0, 2 + Math.floor(Math.random() * 3)),
                    manifesto: `I promise to bring innovation and transparency to the ${position.title} role. My focus will be on team collaboration and measurable results.`,
                    votes: 0,
                };
            }));
            candidates.push(...positionCandidates);
        }
        console.log("Database seeded successfully!");
        console.log("-------------------------------");
        console.log("Sample Admin Credentials:");
        console.log(`Corporate ID: ADMIN001`);
        console.log(`PIN: 1234`);
        console.log("-------------------------------");
        console.log("Stats:");
        console.log(`- Users: ${users.length + 1} (1 admin)`);
        console.log(`- Positions: ${positions.length}`);
        console.log(`- Candidates: ${candidates.length}`);
        process.exit(0);
    }
    catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
});
// Execute seeding
if (environments_1.env.NODE_ENV !== "production") {
    seedDB();
}
else {
    console.error("Seeding disabled in production");
    process.exit(1);
}

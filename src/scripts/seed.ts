import bcrypt from "bcryptjs";
import connectDB from "../config/db";
import { Candidate } from "../models/candidate.schema";
import { Election } from "../models/election.schema";
import { Position } from "../models/position.schema";
import { User } from "../models/user.schema";
import { Vote } from "../models/vote.schema";
import { env } from "../utils/environments";

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
const seedDB = async () => {
  try {
    await connectDB();
    console.log("Connected to database for seeding");

    // Clear existing data (in reverse dependency order)
    await Vote.deleteMany();
    await Candidate.deleteMany();
    await Position.deleteMany();
    await Election.deleteMany();
    await User.deleteMany();
    console.log("Cleared existing data");

    // 1. Create Admin User
    const adminUser = await User.create({
      corporateId: "ADMIN001",
      name: "System Admin",
      email: "admin@company.com",
      pin: await bcrypt.hash("1234", 10),
      role: "admin",
      department: "Operations",
      hasVoted: false,
    });

    // 2. Create Regular Users (Voters)
    const users = await User.insertMany(
      Array.from({ length: 50 }, (_, i) => ({
        corporateId: `EMP${String(i + 100).padStart(3, "0")}`,
        name: `Employee ${i + 1}`,
        email: `employee${i + 1}@company.com`,
        pin: generatePin(),
        role: "voter",
        department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
        hasVoted: false,
      }))
    );

    // 3. Create Election
    const election = await Election.create({
      title: "2025 Board Election",
      description: "Annual election for board members",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-30"),
      status: "active",
      createdBy: adminUser._id,
    });

    // 4. Create Positions
    const positions = await Position.insertMany([
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
      const positionCandidates = await Candidate.insertMany(
        Array.from({ length: 3 }, (_, i) => {
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
              imageUrl: `https://randomuser.me/api/portraits/${
                userIndex % 2 === 0 ? "men" : "women"
              }/${userIndex + 10}.jpg`,
              publicId: null,
            },
            qualifications: qualifications.slice(
              0,
              2 + Math.floor(Math.random() * 3)
            ),
            manifesto: `I promise to bring innovation and transparency to the ${position.title} role. My focus will be on team collaboration and measurable results.`,
            votes: 0,
          };
        })
      );
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
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

// Execute seeding
if (env.NODE_ENV !== "production") {
  seedDB();
} else {
  console.error("Seeding disabled in production");
  process.exit(1);
}

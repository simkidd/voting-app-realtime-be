import { model, Schema } from "mongoose";
import { ICandidate } from "../interfaces/candidate.interface";

const photoSchema = new Schema(
  {
    imageUrl: { type: String },
    publicId: { type: String },
  },
  { _id: false }
);

const CandidateSchema = new Schema<ICandidate>(
  {
    name: { type: String, required: true },
    corporateId: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    photo: { type: photoSchema },
    qualifications: { type: [String], required: true },
    manifesto: { type: String, required: true },
    positionId: {
      type: Schema.Types.ObjectId,
      ref: "Position",
      required: true,
    },
    electionId: {
      type: Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },
    votes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Candidate = model<ICandidate>("Candidate", CandidateSchema);

import { Document, Types } from "mongoose";

export interface ICandidate extends Document {
  name: string;
  corporateId: string;
  department: string;
  photo: {
    imageUrl: string;
    publicId: string;
  };
  qualifications: string[];
  manifesto: string;
  positionId: Types.ObjectId;
  electionId: Types.ObjectId;
  votes: number;
}

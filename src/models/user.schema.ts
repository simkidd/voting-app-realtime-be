import { Schema, model } from "mongoose";
import { IUser } from "../interfaces/user.interface";

const UserSchema = new Schema<IUser>(
  {
    corporateId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    pin: { type: String, required: true },
    role: {
      type: String,
      enum: ["voter", "candidate", "admin"],
      default: "voter",
    },
    department: { type: String, required: true },
    hasVoted: { type: Boolean, default: false },
    votedPositions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Position",
      },
    ],
  },
  { timestamps: true }
);

export const User = model<IUser>("User", UserSchema);

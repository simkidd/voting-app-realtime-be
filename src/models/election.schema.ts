import { model, Schema } from "mongoose";
import { ElectionStatus, IElection } from "../interfaces/election.interface";

const ElectionSchema = new Schema<IElection>(
  {
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: Object.values(ElectionStatus),
      default: ElectionStatus.DRAFT,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Election = model<IElection>("Election", ElectionSchema);

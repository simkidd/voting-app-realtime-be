import { model, Schema } from "mongoose";
import { IPosition } from "../interfaces/position.interface";

const PositionSchema = new Schema<IPosition>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    electionId: {
      type: Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Position = model<IPosition>("Position", PositionSchema);

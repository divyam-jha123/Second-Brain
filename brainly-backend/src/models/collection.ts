import { Schema, model, Document, Types } from "mongoose";

export interface ICollection extends Document {
  _id: Types.ObjectId;
  userId: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new Schema<ICollection>(
  {
    userId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
      maxlength: 60,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// One collection name per user; two users may both have a "Backend".
collectionSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Collection = model<ICollection>("Collection", collectionSchema);

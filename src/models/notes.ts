import { Schema, model, Document } from "mongoose";

interface Inote extends Document {
  title: Object;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<Inote>(
  {
    title: {
      type: Schema.Types.ObjectId,
      required: [true, "title is required"],
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

const noteModel = model<Inote>('Notes', noteSchema);

export default noteModel;
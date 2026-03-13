import { Schema, model, Document } from "mongoose";

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
  }

}, {
  timestamps: true
});

export const User = model<IUser>("User", userSchema);
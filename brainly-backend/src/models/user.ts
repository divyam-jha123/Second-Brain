import { Schema, model, Document } from "mongoose";

interface IUser extends Document {
  clerkUserId: string;
  username: string;
  email: string;
  /** Topics picked during onboarding; used to suggest tags. */
  topics: string[];
  onboardingCompletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  clerkUserId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  topics: {
    type: [String],
    default: [],
  },
  // Null means the user has not been through onboarding yet. Skipping still
  // stamps this, so the flow is never shown twice.
  onboardingCompletedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

export const User = model<IUser>("User", userSchema);
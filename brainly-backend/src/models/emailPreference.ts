import { Schema, model, Document } from "mongoose";

export interface IEmailPreference extends Document {
  clerkUserId: string;
  email: string;
  featureAnnouncements: boolean;
  weeklyDigest: boolean;
  unsubscribedAll: boolean;
  lastDigestSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const emailPreferenceSchema = new Schema<IEmailPreference>(
  {
    clerkUserId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
    },
    featureAnnouncements: {
      type: Boolean,
      default: true,
    },
    weeklyDigest: {
      type: Boolean,
      default: true,
    },
    unsubscribedAll: {
      type: Boolean,
      default: false,
    },
    lastDigestSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export const EmailPreference = model<IEmailPreference>(
  "EmailPreference",
  emailPreferenceSchema,
);

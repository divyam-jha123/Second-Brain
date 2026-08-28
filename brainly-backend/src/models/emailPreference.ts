import { Schema, model, Document } from "mongoose";
import { randomUUID } from "node:crypto";

export interface IEmailPreference extends Document {
  clerkUserId: string;
  email: string;
  featureAnnouncements: boolean;
  weeklyDigest: boolean;
  digestSections: {
    savedThisWeek: boolean;
    untaggedNudge: boolean;
    recallQuestions: boolean;
  };
  /** 0 = Sunday. Delivery is stored per user; the cron still runs globally. */
  digestDay: number;
  digestHour: number;
  timezone: string;
  unsubscribedAll: boolean;
  /** When the user last opted in to the weekly email, for consent records. */
  consentedAt?: Date;
  /** Set when they turn the weekly email off. Unrelated to section checkboxes. */
  unsubscribedAt?: Date;
  /** Stable per-user token for one-click unsubscribe links in emails. */
  unsubscribeToken: string;
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
    digestSections: {
      savedThisWeek: { type: Boolean, default: true },
      untaggedNudge: { type: Boolean, default: true },
      recallQuestions: { type: Boolean, default: false },
    },
    digestDay: {
      type: Number,
      default: 0,
      min: 0,
      max: 6,
    },
    digestHour: {
      type: Number,
      default: 9,
      min: 0,
      max: 23,
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    unsubscribedAll: {
      type: Boolean,
      default: false,
    },
    consentedAt: {
      type: Date,
      default: null,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
    unsubscribeToken: {
      type: String,
      default: () => randomUUID(),
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

import { Schema, model, Document, Types } from "mongoose";

interface Inote extends Document {
  title: string;
  content: string;
  userId: string;
  tags: string[];
  note?: string;
  collectionId: Types.ObjectId | null;
  sourceDomain?: string;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<Inote>(
  {
    title: {
      type: String,
      required: [true, "title is required"],
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    // The user's own annotation about the save.
    note: {
      type: String,
      trim: true,
    },
    collectionId: {
      type: Schema.Types.ObjectId,
      ref: "Collection",
      default: null,
    },
    // Derived from `content` on write so reads never re-parse the URL.
    sourceDomain: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// The dashboard's two access patterns: newest-first, and filter-by-tag.
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, tags: 1 });

/** What a share link exposes. Legacy links predate this field and mean "all". */
export type ShareScope = "all" | "collection" | "tag" | "items";

export interface ILink extends Document {
  _id: Types.ObjectId;
  userId: string;
  hash: string;
  scope: ShareScope;
  // Nullable at rest (the schema defaults them to null), but typed as optional
  // so mongoose's create/query casting stays happy.
  collectionId?: Types.ObjectId;
  tag?: string;
  noteIds: Types.ObjectId[];
  label?: string;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const linkSchema = new Schema<ILink>(
  {
    userId: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      required: true,
    },
    // Backfilled onto rows written before scoping existed, which shared everything.
    scope: {
      type: String,
      enum: ["all", "collection", "tag", "items"],
      default: "all",
    },
    collectionId: {
      type: Schema.Types.ObjectId,
      ref: "Collection",
      default: null,
    },
    tag: {
      type: String,
      trim: true,
      default: null,
    },
    noteIds: {
      type: [Schema.Types.ObjectId],
      ref: "Notes",
      default: [],
    },
    label: {
      type: String,
      trim: true,
    },
    // Soft revoke: a killed hash must never be reissued to somebody else.
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

linkSchema.index({ hash: 1 }, { unique: true });
linkSchema.index({ userId: 1, createdAt: -1 });

const Links = model<ILink>("Link", linkSchema);
const Notes = model<Inote>("Notes", noteSchema);

export { Notes, Links };

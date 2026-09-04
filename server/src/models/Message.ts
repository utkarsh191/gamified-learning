import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
  user: Types.ObjectId;
  college: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Denormalized from the sender's User.college at creation time.
    // NEVER trusted from the client — always set server-side from the
    // authenticated user's DB record. This is what scopes the message to
    // a college-wise community chat.
    college: {
      type: String,
      required: true,
      trim: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

// Fast fetch of one college's messages, newest first
messageSchema.index({ college: 1, createdAt: -1 });

// TTL index: MongoDB's background TTL monitor automatically deletes a
// message document once its `createdAt` is older than 86400 seconds
// (24 hours). This is native MongoDB-level expiration — no cron job,
// no setInterval/setTimeout, no manual cleanup loop, and no frontend
// involvement. The TTL monitor sweeps roughly once every 60 seconds,
// so actual deletion happens at ~24h plus a small delay, never before.
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Message = mongoose.model<IMessage>("Message", messageSchema);

export default Message;
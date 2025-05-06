import mongoose, { Document } from "mongoose";

interface IGroup extends Document {
  groupId: string;
  name: string;
  admin: string;
  students: string[];
  instructors?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface IMessage extends Document {
  group: string;
  sender: string;
  role: "admin" | "student" | "instructor";
  text?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new mongoose.Schema(
  {
    groupId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    admin: { type: String, required: true },
    students: [String],
    instructors: [String],
  },
  {
    timestamps: true,
  }
);

const messageSchema = new mongoose.Schema(
  {
    group: { type: String, required: true },
    sender: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "student", "instructor"],
      required: true,
    },
    text: String,
    image: String,
  },
  {
    timestamps: true,
  }
);

const Group = mongoose.model<IGroup>("Group", groupSchema);
const Message = mongoose.model<IMessage>("Message", messageSchema);

export { Group, Message, IGroup, IMessage };

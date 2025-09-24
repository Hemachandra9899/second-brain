import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "note title is required"],
    },
    description: {
      type: String,
    }
  },
  { timestamps: true }
);

export default mongoose.model("Note", noteSchema);

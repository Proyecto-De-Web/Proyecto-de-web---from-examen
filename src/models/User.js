import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullname:  { type: String, trim: true },
  email:     { type: String, trim: true, required: true, unique: true, lowercase: true },
  username:  { type: String, trim: true, required: true, unique: true },
  password:  { type: String, required: true },
  rol:       { type: String, enum: ["investigador","explorador","admin"], default: "explorador" }
}, { timestamps: true });

export default mongoose.models.Users ||
  mongoose.model("Users", userSchema);

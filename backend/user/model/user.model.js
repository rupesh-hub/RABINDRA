import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    profile: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: true,
    }
  },

  { timestamps: true }
);

export const User = mongoose.model('User',userSchema); 
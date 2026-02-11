import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      minlength: 6,
    },

    otp: {
      type: String,
    },

    otpExpiresAt: {
      type: Date,
    },

    otpVerified: {
      type: Boolean,
      default: false,
    },

    googleId: {
      type: String,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;

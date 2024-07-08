const mongoose = require("mongoose");

const userScheama = new mongoose.Schema(
  {
    emailId: {
      type: String,
      required: [true, "Please provide an email"],
      unique: [true, "Email already exists"],
    },
    password: {
      type: String,
      required: [true, "Please provide an password"],
    },
    phone: {
      type: String,
    },
    firstName: {
      type: String,
      required: [true, "Please provide a First Name"],
    },
    lastName: {
      type: String,
    },
    profilePic: {
      type: String,
    },
    profileStatus: {
      type: String,
    },
    role: {
      type: String,
      enum: ["Admin", "Manager", "Team Lead", "User"],
      required: [true, "Please provide a role"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
    },
    updatedBy: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userScheama);

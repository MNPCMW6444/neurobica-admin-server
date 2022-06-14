const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
    },
    passwordHash: { type: String, required: true },
    token: {
      type: Array,
    },
  },

  {
    timestamps: true,
  }
);

const User = mongoose.model("user", userSchema);

module.exports = User;

const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, required: true },
    tasks: { type: Array, required: false },
  },
  {
    timestamps: true,
  }
);

const item = mongoose.model("item", itemSchema);

module.exports = item;

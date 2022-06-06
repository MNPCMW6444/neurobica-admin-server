const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, required: true },
    desc: { type: String, required: true },
    sign1: { type: Boolean, required: true },
    sign2: { type: Boolean, required: true },
    sign3: { type: Boolean, required: true },
    time: { type: Date, required: false },
  },
  {
    timestamps: true,
  }
);

const item = mongoose.model("item", itemSchema);

module.exports = item;

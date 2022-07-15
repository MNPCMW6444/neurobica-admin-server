const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    desc: { type: String, required: true },
    children: { type: Array, required: true },
  },
  {
    timestamps: true,
  }
);

const task = mongoose.model("task", taskSchema);

module.exports = task;

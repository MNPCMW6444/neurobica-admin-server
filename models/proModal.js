const mongoose = require("mongoose");

const proSchema = new mongoose.Schema(
  {
    header: { type: String, required: false },
    tasks: { type: Array, required: false },
  },
  {
    timestamps: true,
  }
);

const pro = mongoose.model("pro", proSchema);

module.exports = pro;
